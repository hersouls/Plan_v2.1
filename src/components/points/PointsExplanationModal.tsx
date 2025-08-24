import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { pointsService, type PointRule } from '../../lib/points';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface PointsExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string | null;
}

export function PointsExplanationModal({
  isOpen,
  onClose,
  groupId,
}: PointsExplanationModalProps) {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<PointRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !groupId) {
      setRules([]);
      setError(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    pointsService
      .getPointRules(groupId)
      .then(res => {
        if (!mounted) return;
        setRules(res);
      })
      .catch(() => {
        if (!mounted) return;
        setError('가이드 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [groupId, isOpen]);

  const baseRule = useMemo(
    () => rules.find(r => r.type === 'task_completion'),
    [rules]
  );
  const streakRule = useMemo(
    () => rules.find(r => r.type === 'streak_bonus'),
    [rules]
  );
  const rateRule = useMemo(
    () => rules.find(r => r.type === 'completion_rate'),
    [rules]
  );
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-explanation-modal-title"
    >
      <GlassCard variant="strong" className="w-full max-w-2xl p-6 modal-enter">
        <div className="flex items-center justify-between mb-4">
          <Typography.H3
            id="points-explanation-modal-title"
            className="text-white"
          >
            포인트 시스템 가이드
          </Typography.H3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="포인트 시스템 안내 모달 닫기"
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>

        <div className="space-y-6 text-white/80 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            <Typography.Body>가이드 정보를 불러오는 중...</Typography.Body>
          ) : error ? (
            <Typography.Body className="text-red-300">{error}</Typography.Body>
          ) : null}
          <div>
            <Typography.Body className="text-white font-medium">
              포인트는 어떻게 획득하나요?
            </Typography.Body>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <span className="text-white/90">할일 완료</span>: 담당한 할일을
                완료하면 기본 포인트가 적립됩니다
                {baseRule ? (
                  <span className="text-white/70">
                    {' '}
                    (현재 {Math.max(0, Math.floor(baseRule.points))}점)
                  </span>
                ) : null}
                .
              </li>
              <li>
                <span className="text-white/90">마감 준수</span>: 마감일 내 완료
                시 추가 보너스가 적용될 수 있습니다.
              </li>
              <li>
                <span className="text-white/90">협업/리뷰</span>: 다른 구성원의
                작업을 도와주거나 리뷰를 완료하면 보너스가 지급될 수 있습니다.
              </li>
              <li>
                <span className="text-white/90">연속 수행</span>: 연속 출석/연속
                완료 등 꾸준한 활동에 대해 연속 보너스가 부여될 수 있습니다
                {streakRule && streakRule.isActive && (
                  <span className="text-white/70">{` (현재 ${Math.max(
                    1,
                    Math.floor(streakRule.conditions?.minStreak || 1)
                  )}일 연속 시 ${Math.max(
                    0,
                    Math.floor(streakRule.points)
                  )}점)`}</span>
                )}
                .
              </li>
              <li>
                <span className="text-white/90">관리자 보너스</span>:
                그룹장/부그룹장이 동기부여를 위해 추가 포인트를 수동 지급할 수
                있습니다.
              </li>
            </ul>
          </div>

          <div>
            <Typography.Body className="text-white font-medium">
              어떤 경우에 차감되나요?
            </Typography.Body>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <span className="text-white/90">지연/미완료</span>: 마감 기한
                초과 또는 미완료가 반복되면 감점이 발생할 수 있습니다.
              </li>
              <li>
                <span className="text-white/90">취소/반려</span>: 제출한 작업이
                반려되거나 취소되는 경우 일부 포인트가 회수될 수 있습니다.
              </li>
              <li>
                <span className="text-white/90">규칙 위반</span>: 운영 정책을
                위반하는 경우 관리자가 감점을 적용할 수 있습니다.
              </li>
            </ul>
          </div>

          <div>
            <Typography.Body className="text-white font-medium">
              승인과 정산은 어떻게 이루어지나요?
            </Typography.Body>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <span className="text-white/90">승인 대기</span>: 완료/차감
                사유가 생성되면 먼저 승인 대기 목록에 등록됩니다.
              </li>
              <li>
                <span className="text-white/90">관리자 승인</span>:
                그룹장/부그룹장이 검토 후 승인/반려를 결정합니다.
              </li>
              <li>
                <span className="text-white/90">정산 반영</span>: 승인 시 총
                포인트에 반영되고, 반려 시 내역만 보관됩니다.
              </li>
            </ul>
          </div>

          <div>
            <Typography.Body className="text-white font-medium">
              현재 그룹 정책 요약
            </Typography.Body>
            {groupId ? (
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  기본 포인트:{' '}
                  {baseRule
                    ? `${Math.max(0, Math.floor(baseRule.points))}점`
                    : '설정 없음 (기본 10점 적용)'}
                </li>
                <li>
                  연속 보너스:{' '}
                  {streakRule
                    ? streakRule.isActive
                      ? `${Math.max(
                          1,
                          Math.floor(streakRule.conditions?.minStreak || 1)
                        )}일 연속 시 ${Math.max(
                          0,
                          Math.floor(streakRule.points)
                        )}점`
                      : '비활성화'
                    : '설정 없음'}
                </li>
                <li>
                  완료율 보너스:{' '}
                  {rateRule
                    ? rateRule.isActive
                      ? `완료율 ${Math.max(
                          0,
                          Math.min(
                            100,
                            Math.floor(
                              rateRule.conditions?.minCompletionRate || 0
                            )
                          )
                        )}% 이상 시 ${Math.max(
                          0,
                          Math.floor(rateRule.points)
                        )}점`
                      : '비활성화'
                    : '설정 없음'}
                </li>
              </ul>
            ) : (
              <Typography.Caption className="text-white/60">
                그룹이 선택되지 않았습니다. 그룹을 선택하면 해당 정책이
                표시됩니다.
              </Typography.Caption>
            )}
          </div>

          <div>
            <Typography.Body className="text-white font-medium">
              역할과 권한
            </Typography.Body>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <span className="text-white/90">그룹장/부그룹장</span>: 포인트
                설정, 승인/반려, 보너스/차감 수동 조정 권한 보유
              </li>
              <li>
                <span className="text-white/90">구성원</span>: 할일 수행 및
                포인트 현황 조회, 내역 확인
              </li>
            </ul>
          </div>

          <div>
            <Typography.Body className="text-white font-medium">
              예시 시나리오
            </Typography.Body>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                오늘 할일 3개를 제때 완료 → 기본 포인트 3건 적립, 마감 준수
                보너스 추가 가능
              </li>
              <li>일주일 연속 완료 → 연속 보너스가 누적 적용될 수 있음</li>
              <li>리뷰 반려로 재작업 → 재제출 후 승인되면 최종 점수 반영</li>
            </ul>
          </div>

          <div>
            <Typography.Body className="text-white font-medium">
              참고사항
            </Typography.Body>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                포인트 기준과 가중치는 그룹 정책에 따라 달라질 수 있습니다.
              </li>
              <li>관리자가 임시로 수동 조정한 내역은 히스토리에 표시됩니다.</li>
              <li>
                자세한 수치 및 규정은 추후 설정 화면에서 관리할 수 있도록
                제공됩니다.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <WaveButton
            variant="secondary"
            onClick={onClose}
            aria-label="포인트 안내 닫기"
          >
            닫기
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
}
