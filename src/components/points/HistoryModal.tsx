import { useVirtualizer } from '@tanstack/react-virtual';
import type { Timestamp } from 'firebase/firestore';
import { Award, CheckCircle, History, Plus, TrendingUp } from 'lucide-react';
import React, { useRef } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import type { PointHistory } from '../../lib/points';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  histories: PointHistory[];
  approved?: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  title,
  histories,
  approved = false,
}) => {
  const formatDateFull = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '날짜 없음';
    }
  };

  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: histories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    overscan: 10,
  });

  const { firstFocusableRef, modalContainerRef } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <GlassCard
        variant="strong"
        className="w-full max-w-4xl p-6 max-h-[80vh] modal-enter points-glow"
        ref={modalContainerRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                approved
                  ? 'bg-gradient-to-br from-semantic-success-500 to-semantic-success-600'
                  : 'bg-gradient-to-br from-semantic-success-500 to-semantic-success-600'
              }`}
            >
              {approved ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <History className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <Typography.H3
                className="text-xl font-semibold text-white"
                id="history-modal-title"
              >
                {title}
              </Typography.H3>
              <Typography.Caption className="text-white/70">
                모든 포인트 활동 기록
              </Typography.Caption>
            </div>
          </div>
          <WaveButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            aria-label="포인트 내역 모달 닫기"
            ref={firstFocusableRef}
          >
            닫기
          </WaveButton>
        </div>

        {histories.length > 0 ? (
          <div
            ref={parentRef}
            className="max-h-[60vh] overflow-y-auto"
            role="list"
            aria-label="전체 포인트 내역 목록"
          >
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const history = histories[virtualRow.index];
                const isEarned =
                  history.type === 'earned' || history.type === 'bonus';
                const isDeducted =
                  history.type === 'deducted' || history.type === 'penalty';
                return (
                  <div
                    key={history.id}
                    className={`
                      flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-lg point-history-card
                      ${
                        isEarned
                          ? 'point-history-bg-earned'
                          : isDeducted
                          ? 'point-history-bg-deducted'
                          : 'point-history-bg-manual'
                      }
                    `}
                    role="listitem"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm point-icon-animate ${
                          isEarned
                            ? 'point-earned'
                            : isDeducted
                            ? 'point-deducted'
                            : 'point-manual'
                        }`}
                        aria-label={
                          isEarned ? '획득' : isDeducted ? '차감' : '기타'
                        }
                      >
                        {isEarned ? (
                          <Plus className="w-6 h-6" />
                        ) : isDeducted ? (
                          <TrendingUp className="w-6 h-6" />
                        ) : (
                          <Award className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Typography.Body className="font-semibold text-gray-900 text-lg">
                          {history.description}
                        </Typography.Body>
                        <div className="flex items-center gap-3 mt-2">
                          <Typography.Caption className="text-gray-500">
                            {formatDateFull(history.createdAt)}
                          </Typography.Caption>
                          {history.type === 'bonus' && (
                            <span className="point-badge point-badge-bonus">
                              보너스
                            </span>
                          )}
                          {approved && (
                            <span className="px-3 py-1 bg-semantic-success-50 text-semantic-success-700 text-sm rounded-full font-medium">
                              승인 완료
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Typography.Body
                        className={`font-bold text-xl ${
                          isEarned
                            ? 'point-text-earned'
                            : isDeducted
                            ? 'point-text-deducted'
                            : 'point-text-manual'
                        }`}
                      >
                        {isEarned ? '+' : isDeducted ? '-' : ''}
                        {history.amount}
                      </Typography.Body>
                      <Typography.Caption className="text-gray-400 font-medium">
                        포인트
                      </Typography.Caption>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="text-center py-16"
            role="status"
            aria-label="포인트 내역 없음"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200/50 to-gray-300/50 rounded-full flex items-center justify-center mx-auto mb-6">
              {approved ? (
                <CheckCircle className="w-10 h-10 text-gray-400" />
              ) : (
                <History className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <Typography.H4 className="text-white font-semibold mb-3">
              아직 포인트 내역이 없습니다
            </Typography.H4>
            <Typography.Body className="text-white/70">
              할일을 완료하면 포인트를 획득할 수 있어요!
            </Typography.Body>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default HistoryModal;
