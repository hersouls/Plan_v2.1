import { Save, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { pointsService, type PointRule } from '../../lib/points';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { useToast } from '../ui/useToast';

interface PointSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export function PointSettingsModal({
  isOpen,
  onClose,
  groupId,
}: PointSettingsModalProps) {
  const { firstFocusableRef, modalContainerRef } = useModalA11y({
    isOpen,
    onClose,
  });
  const toast = useToast();

  // 간단한 폼 상태: 기본 포인트, 스트릭 보너스, 완료율 보너스
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [basePoints, setBasePoints] = useState<number>(10);
  const [streakActive, setStreakActive] = useState<boolean>(true);
  const [streakMin, setStreakMin] = useState<number>(7);
  const [streakPoints, setStreakPoints] = useState<number>(5);
  const [rateActive, setRateActive] = useState<boolean>(true);
  const [rateMin, setRateMin] = useState<number>(80);
  const [ratePoints, setRatePoints] = useState<number>(5);

  // 로드
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoading(true);
    pointsService
      .getPointRules(groupId)
      .then(rules => {
        if (!mounted) return;
        // 기본 포인트 규칙
        const base = rules.find(r => r.type === 'task_completion');
        if (base) setBasePoints(base.points);

        const streak = rules.find(r => r.type === 'streak_bonus');
        if (streak) {
          setStreakActive(streak.isActive);
          setStreakMin(streak.conditions?.minStreak ?? 7);
          setStreakPoints(streak.points);
        }

        const rate = rules.find(r => r.type === 'completion_rate');
        if (rate) {
          setRateActive(rate.isActive);
          setRateMin(rate.conditions?.minCompletionRate ?? 80);
          setRatePoints(rate.points);
        }
      })
      .catch(() => {
        toast.error('설정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [groupId, isOpen, toast]);

  const isValid = useMemo(() => {
    if (!Number.isFinite(basePoints) || basePoints < 0) return false;
    if (streakActive) {
      if (!Number.isFinite(streakMin) || streakMin < 1) return false;
      if (!Number.isFinite(streakPoints) || streakPoints < 0) return false;
    }
    if (rateActive) {
      if (!Number.isFinite(rateMin) || rateMin < 0 || rateMin > 100)
        return false;
      if (!Number.isFinite(ratePoints) || ratePoints < 0) return false;
    }
    return true;
  }, [
    basePoints,
    streakActive,
    streakMin,
    streakPoints,
    rateActive,
    rateMin,
    ratePoints,
  ]);

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      // 1) 기존 규칙 로드
      const rules = await pointsService.getPointRules(groupId);
      const base = rules.find(r => r.type === 'task_completion');
      const streak = rules.find(r => r.type === 'streak_bonus');
      const rate = rules.find(r => r.type === 'completion_rate');

      // 2) upsert 로직
      const upserts: Array<Promise<unknown>> = [];

      if (base) {
        upserts.push(
          pointsService.updatePointRule(base.id, {
            points: Math.floor(Math.max(0, basePoints)),
            isActive: true,
          } as Partial<PointRule>)
        );
      } else {
        upserts.push(
          pointsService.createPointRule({
            groupId,
            name: '할일 완료 기본 포인트',
            type: 'task_completion',
            points: Math.floor(Math.max(0, basePoints)),
            description: '할일 완료 시 기본으로 지급되는 포인트',
            isActive: true,
          })
        );
      }

      if (streak) {
        upserts.push(
          pointsService.updatePointRule(streak.id, {
            points: Math.floor(Math.max(0, streakPoints)),
            isActive: !!streakActive,
            conditions: {
              ...streak.conditions,
              minStreak: Math.floor(Math.max(1, streakMin)),
            },
          } as Partial<PointRule>)
        );
      } else {
        upserts.push(
          pointsService.createPointRule({
            groupId,
            name: '연속 보너스',
            type: 'streak_bonus',
            points: Math.floor(Math.max(0, streakPoints)),
            conditions: { minStreak: Math.floor(Math.max(1, streakMin)) },
            description: '연속 완료 시 지급되는 보너스',
            isActive: !!streakActive,
          })
        );
      }

      if (rate) {
        upserts.push(
          pointsService.updatePointRule(rate.id, {
            points: Math.floor(Math.max(0, ratePoints)),
            isActive: !!rateActive,
            conditions: {
              ...rate.conditions,
              minCompletionRate: Math.max(
                0,
                Math.min(100, Math.floor(rateMin))
              ),
            },
          } as Partial<PointRule>)
        );
      } else {
        upserts.push(
          pointsService.createPointRule({
            groupId,
            name: '완료율 보너스',
            type: 'completion_rate',
            points: Math.floor(Math.max(0, ratePoints)),
            conditions: {
              minCompletionRate: Math.max(
                0,
                Math.min(100, Math.floor(rateMin))
              ),
            },
            description: '기간 내 높은 완료율 달성 시 지급되는 보너스',
            isActive: !!rateActive,
          })
        );
      }

      await Promise.all(upserts);
      toast.success('포인트 설정이 저장되었습니다.');
      onClose();
    } catch {
      toast.error('저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="point-settings-modal-title"
    >
      <GlassCard
        variant="strong"
        className="w-full max-w-lg p-6 modal-enter"
        ref={modalContainerRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <Typography.H3 id="point-settings-modal-title" className="text-white">
            포인트 설정 (임시)
          </Typography.H3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="포인트 설정 모달 닫기"
            ref={firstFocusableRef}
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>

        {loading ? (
          <div className="text-white/80">설정을 불러오는 중...</div>
        ) : (
          <div className="space-y-6 text-white/80">
            <div>
              <Typography.Body className="text-white font-medium">
                기본 포인트 (할일 완료)
              </Typography.Body>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-28 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={basePoints}
                  onChange={e =>
                    setBasePoints(parseInt(e.target.value || '0', 10))
                  }
                  min={0}
                  aria-label="기본 포인트"
                />
                <span className="text-white/60 text-sm">점</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Typography.Body className="text-white font-medium">
                  연속 보너스 설정
                </Typography.Body>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={streakActive}
                    onChange={e => setStreakActive(e.target.checked)}
                    aria-label="연속 보너스 활성화"
                  />
                  활성화
                </label>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    최소 연속 일수
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={streakMin}
                    onChange={e =>
                      setStreakMin(parseInt(e.target.value || '1', 10))
                    }
                    min={1}
                    disabled={!streakActive}
                    aria-label="최소 연속 일수"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    보너스 포인트
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={streakPoints}
                    onChange={e =>
                      setStreakPoints(parseInt(e.target.value || '0', 10))
                    }
                    min={0}
                    disabled={!streakActive}
                    aria-label="연속 보너스 포인트"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Typography.Body className="text-white font-medium">
                  완료율 보너스 설정
                </Typography.Body>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rateActive}
                    onChange={e => setRateActive(e.target.checked)}
                    aria-label="완료율 보너스 활성화"
                  />
                  활성화
                </label>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    최소 완료율 (%)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={rateMin}
                    onChange={e =>
                      setRateMin(parseInt(e.target.value || '0', 10))
                    }
                    min={0}
                    max={100}
                    disabled={!rateActive}
                    aria-label="최소 완료율"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">
                    보너스 포인트
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={ratePoints}
                    onChange={e =>
                      setRatePoints(parseInt(e.target.value || '0', 10))
                    }
                    min={0}
                    disabled={!rateActive}
                    aria-label="완료율 보너스 포인트"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <WaveButton
            variant="secondary"
            onClick={onClose}
            aria-label="포인트 설정 닫기"
            disabled={saving}
          >
            닫기
          </WaveButton>
          <WaveButton
            onClick={handleSave}
            aria-label="포인트 설정 저장"
            disabled={!isValid || saving}
          >
            <Save size={16} className="mr-1" /> 저장
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
}
