import {
  Calendar,
  Clock,
  DollarSign,
  Gift,
  Save,
  Settings,
  Star,
  Target,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGroup, useUserGroups } from '../../hooks/useGroup';
import { PointRule, pointsService } from '../../lib/points';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface PointSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

interface PointCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  defaultPoints: number;
  color: string;
  bgColor: string;
}

const POINT_CATEGORIES: PointCategory[] = [
  {
    id: 'task_completion',
    name: '할일 완료',
    icon: Target,
    description: '할일을 완료했을 때 지급되는 기본 포인트',
    defaultPoints: 10,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 'streak_bonus',
    name: '연속 달성',
    icon: Zap,
    description: '연속으로 할일을 완료했을 때 지급되는 보너스 포인트',
    defaultPoints: 20,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'special_action',
    name: '특별 행동',
    icon: Star,
    description: '가족을 돕거나 특별한 행동을 했을 때 지급되는 포인트',
    defaultPoints: 25,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'weekly_goal',
    name: '주간 목표',
    icon: Calendar,
    description: '주간 목표를 달성했을 때 지급되는 포인트',
    defaultPoints: 100,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    id: 'time_management',
    name: '시간 관리',
    icon: Clock,
    description: '정해진 시간 내에 할일을 완료했을 때 지급되는 포인트',
    defaultPoints: 10,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    id: 'family_help',
    name: '가족 도움',
    icon: Gift,
    description: '다른 가족 구성원의 할일을 도왔을 때 지급되는 포인트',
    defaultPoints: 15,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
];

export function PointSettingsModal({
  isOpen,
  onClose,
  groupId,
}: PointSettingsModalProps) {
  const { user } = useAuth();
  const { groups = [] } = useUserGroups();
  const { members = [] } = useGroup({
    groupId,
    loadMembers: true,
  });

  // 권한 체크
  const selectedGroup = groups.find(g => g.id === groupId);
  const currentMember = members.find(m => m.userId === user?.uid);
  const isGroupLeader = selectedGroup?.ownerId === user?.uid;
  const isDeputyGroupLeader = currentMember?.role === 'vice_owner' || currentMember?.role === 'admin';
  const hasPermission = isGroupLeader || isDeputyGroupLeader;

  // 권한이 없으면 모달을 닫음 (임시로 비활성화)
  // useEffect(() => {
  //   if (isOpen && !hasPermission) {
  //     onClose();
  //   }
  // }, [isOpen, hasPermission, onClose]);
  const [pointRules, setPointRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pointValues, setPointValues] = useState<Record<string, number>>({});

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape, { capture: true });
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape, { capture: true });
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 포인트 규칙 로드
  useEffect(() => {
    if (isOpen && groupId) {
      loadPointRules();
    }
  }, [isOpen, groupId]);

  const loadPointRules = async () => {
    setLoading(true);
    try {
      const rules = await pointsService.getPointRules(groupId);
      setPointRules(rules);

      // 현재 포인트 값들을 초기화
      const initialValues: Record<string, number> = {};
      POINT_CATEGORIES.forEach(category => {
        const existingRule = rules.find(rule => rule.type === category.id);
        initialValues[category.id] =
          existingRule?.points || category.defaultPoints;
      });
      setPointValues(initialValues);
      setHasChanges(false);
    } catch (error) {
      console.error('포인트 규칙 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 포인트 값 변경 처리
  const handlePointChange = (categoryId: string, value: number) => {
    const newValues = { ...pointValues, [categoryId]: value };
    setPointValues(newValues);

    // 변경사항 확인
    const originalRule = pointRules.find(rule => rule.type === categoryId);
    const originalValue =
      originalRule?.points ||
      POINT_CATEGORIES.find(c => c.id === categoryId)?.defaultPoints ||
      0;
    const hasChanged = newValues[categoryId] !== originalValue;

    setHasChanges(
      Object.keys(newValues).some(key => {
        const rule = pointRules.find(r => r.type === key);
        const defaultValue =
          POINT_CATEGORIES.find(c => c.id === key)?.defaultPoints || 0;
        return newValues[key] !== (rule?.points || defaultValue);
      })
    );
  };

  // 포인트 규칙 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      // 기존 규칙들 비활성화
      for (const rule of pointRules) {
        await pointsService.updatePointRule(rule.id, { isActive: false });
      }

      // 새로운 규칙들 생성
      for (const category of POINT_CATEGORIES) {
        const points = pointValues[category.id] || category.defaultPoints;

        await pointsService.createPointRule({
          groupId,
          name: category.name,
          type: category.id as any,
          points,
          description: category.description,
          isActive: true,
        });
      }

      // 규칙 다시 로드
      await loadPointRules();
      setHasChanges(false);
    } catch (error) {
      console.error('포인트 규칙 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  // 기본값으로 초기화
  const handleReset = () => {
    const defaultValues: Record<string, number> = {};
    POINT_CATEGORIES.forEach(category => {
      defaultValues[category.id] = category.defaultPoints;
    });
    setPointValues(defaultValues);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="point-settings-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-enter">
        <GlassCard
          variant="strong"
          className="p-8 relative points-glow bg-white/5 backdrop-blur-xl"
        >
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <Typography.H1
              id="point-settings-modal-title"
              className="text-3xl font-bold text-white mb-2 drop-shadow-sm"
            >
              포인트 관리 설정
            </Typography.H1>
            <Typography.Body className="text-white/95 text-lg">
              포인트별 획득 점수를 설정하여 동기부여 시스템을 커스터마이징하세요
            </Typography.Body>
          </div>

          {!hasPermission ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <Typography.H2 className="text-2xl font-bold text-white mb-4 drop-shadow-sm">
                접근 권한이 없습니다
              </Typography.H2>
              <Typography.Body className="text-white/95 text-lg mb-6">
                포인트 설정은 그룹장과 부그룹장만 접근할 수 있습니다.
              </Typography.Body>
              <WaveButton
                onClick={onClose}
                variant="outline"
                size="lg"
                className="text-white border-white/30 hover:bg-white/10 transition-all duration-200"
              >
                닫기
              </WaveButton>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* 포인트 가치 정보 */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-xl p-6 border-2 border-green-400/50 shadow-lg">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <DollarSign className="w-8 h-8 text-green-300" />
                    <Typography.H2 className="text-2xl font-bold text-white drop-shadow-sm">
                      포인트 가치 기준
                    </Typography.H2>
                  </div>
                  <div className="text-center">
                    <Typography.H3 className="text-4xl font-bold text-green-300 mb-2 drop-shadow-sm">
                      1 포인트 = 100원
                    </Typography.H3>
                    <Typography.Body className="text-white/95 text-lg">
                      설정한 포인트는 실제 가치로 환산되어 보상으로 사용됩니다
                    </Typography.Body>
                  </div>
                </div>
              </div>

              {/* 포인트 카테고리 설정 */}
              <div className="mb-8">
                <Typography.H2 className="text-2xl font-semibold text-white mb-6 text-center drop-shadow-sm">
                  💡 포인트 획득 점수 설정
                </Typography.H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {POINT_CATEGORIES.map(category => {
                    const Icon = category.icon;
                    const currentValue =
                      pointValues[category.id] || category.defaultPoints;
                    const originalRule = pointRules.find(
                      rule => rule.type === category.id
                    );
                    const originalValue =
                      originalRule?.points || category.defaultPoints;
                    const hasChanged = currentValue !== originalValue;

                    return (
                      <div
                        key={category.id}
                        className={`p-6 bg-white/15 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 shadow-lg hover:bg-white/20 ${
                          hasChanged
                            ? 'border-yellow-400/50 bg-yellow-500/10'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className={`w-12 h-12 ${category.bgColor} rounded-full flex items-center justify-center shadow-md`}
                          >
                            <Icon className={`w-6 h-6 ${category.color}`} />
                          </div>
                          <div className="flex-1">
                            <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                              {category.name}
                            </Typography.H3>
                            <Typography.Body className="text-white/95 text-sm leading-relaxed">
                              {category.description}
                            </Typography.Body>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Typography.Body className="text-white/95 font-medium">
                              획득 포인트
                            </Typography.Body>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={currentValue}
                                onChange={e =>
                                  handlePointChange(
                                    category.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                              <Typography.Body className="text-white/95 font-semibold">
                                포인트
                              </Typography.Body>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                            <Typography.Body className="text-white/95 text-sm">
                              실제 가치
                            </Typography.Body>
                            <Typography.Body className="text-green-300 font-bold">
                              {currentValue * 100}원
                            </Typography.Body>
                          </div>

                          {hasChanged && (
                            <div className="flex items-center gap-2 p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                              <Typography.Body className="text-yellow-300 text-sm">
                                변경됨: {originalValue} → {currentValue} 포인트
                              </Typography.Body>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 설정 요약 */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl p-6 border-2 border-purple-400/50 shadow-lg">
                  <Typography.H3 className="text-xl font-bold text-white mb-4 text-center drop-shadow-sm">
                    📊 설정 요약
                  </Typography.H3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {POINT_CATEGORIES.map(category => {
                      const currentValue =
                        pointValues[category.id] || category.defaultPoints;
                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                        >
                          <Typography.Body className="text-white/95 text-sm font-medium">
                            {category.name}
                          </Typography.Body>
                          <Typography.Body className="text-white font-bold">
                            {currentValue}P
                          </Typography.Body>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center justify-between">
                      <Typography.Body className="text-white/95 font-semibold">
                        총 최대 획득 가능 포인트
                      </Typography.Body>
                      <Typography.Body className="text-green-300 font-bold text-lg">
                        {Object.values(pointValues).reduce(
                          (sum, value) => sum + value,
                          0
                        )}
                        P
                      </Typography.Body>
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <WaveButton
                  onClick={handleReset}
                  variant="outline"
                  size="lg"
                  className="text-white border-white/30 hover:bg-white/10 transition-all duration-200"
                >
                  기본값으로 초기화
                </WaveButton>
                <WaveButton
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="text-white border-white/30 hover:bg-white/10 transition-all duration-200"
                >
                  취소
                </WaveButton>
                <WaveButton
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      설정 저장
                    </>
                  )}
                </WaveButton>
              </div>

              {/* 변경사항 알림 */}
              {hasChanges && (
                <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <Typography.Body className="text-yellow-300 text-center">
                    ⚠️ 설정이 변경되었습니다. 저장 버튼을 클릭하여 변경사항을
                    적용하세요.
                  </Typography.Body>
                </div>
              )}
            </>
          )}

          {/* 하단 닫기 옵션 */}
          <div className="text-center space-y-4 mt-8">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white transition-colors duration-200 text-sm underline font-medium"
                aria-label="나중에 다시 보기"
              >
                나중에 다시 보기
              </button>
              <span className="text-white/70 text-sm">•</span>
              <span className="text-white/70 text-sm">ESC 키로 닫기</span>
              <span className="text-white/70 text-sm">•</span>
              <span className="text-white/70 text-sm">외부 클릭으로 닫기</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
