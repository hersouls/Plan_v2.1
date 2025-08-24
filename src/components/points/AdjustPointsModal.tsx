import { Plus, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface AdjustPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'add' | 'deduct';
  onConfirm: (amount: number, reason: string) => void;
  currentPoints: number;
  memberName: string;
}

export const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  isOpen,
  onClose,
  action,
  onConfirm,
  currentPoints,
  memberName,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const { firstFocusableRef, modalContainerRef } = useModalA11y({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      setAmount(0);
      setReason('');
    }
  }, [isOpen]);

  const sanitizedAmount = useMemo(
    () => Math.max(0, Number.isFinite(amount) ? amount : 0),
    [amount]
  );
  const preview = useMemo(() => {
    const base =
      action === 'add'
        ? currentPoints + sanitizedAmount
        : currentPoints - sanitizedAmount;
    return Math.max(0, base);
  }, [action, currentPoints, sanitizedAmount]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-points-modal-title"
    >
      <GlassCard
        variant="strong"
        className="w-full max-w-md p-6 modal-enter points-glow"
        ref={modalContainerRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              action === 'add'
                ? 'bg-gradient-to-br from-semantic-success-500 to-semantic-success-600'
                : 'bg-gradient-to-br from-semantic-danger-500 to-semantic-danger-600'
            }`}
          >
            {action === 'add' ? (
              <Plus className="w-6 h-6 text-white" />
            ) : (
              <TrendingUp className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <Typography.H3
              className="text-lg font-semibold text-white"
              id="adjust-points-modal-title"
            >
              {action === 'add' ? '포인트 추가' : '포인트 차감'}
            </Typography.H3>
            <Typography.Caption className="text-white/70">
              {memberName || 'Unknown'}님의 포인트를{' '}
              {action === 'add' ? '추가' : '차감'}합니다
            </Typography.Caption>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="adjustAmount"
              className="block text-sm font-medium text-white mb-2"
            >
              포인트 수량
            </label>
            <input
              id="adjustAmount"
              type="number"
              min={1}
              value={sanitizedAmount}
              onChange={e => setAmount(parseInt(e.target.value || '0', 10))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="포인트 수량을 입력하세요"
            />
          </div>
          <div>
            <label
              htmlFor="adjustReason"
              className="block text-sm font-medium text-white mb-2"
            >
              사유
            </label>
            <textarea
              id="adjustReason"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder={`포인트 ${
                action === 'add' ? '추가' : '차감'
              } 사유를 입력하세요`}
            />
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">현재 포인트</span>
              <span className="text-white font-semibold">
                {currentPoints || 0}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-white/70 text-sm">
                {action === 'add' ? '추가 후' : '차감 후'}
              </span>
              <span
                className={`font-semibold ${
                  action === 'add'
                    ? 'text-semantic-success-400'
                    : 'text-semantic-danger-400'
                }`}
              >
                {preview}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <WaveButton
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            aria-label="포인트 조정 취소"
            ref={firstFocusableRef}
          >
            취소
          </WaveButton>
          <WaveButton
            onClick={() =>
              sanitizedAmount > 0 &&
              reason.trim() &&
              onConfirm(sanitizedAmount, reason)
            }
            disabled={sanitizedAmount <= 0 || !reason.trim()}
            className={`flex-1 ${
              action === 'add'
                ? 'bg-gradient-to-r from-semantic-success-500 to-semantic-success-600 hover:from-semantic-success-600 hover:to-semantic-success-700'
                : 'bg-gradient-to-r from-semantic-danger-500 to-semantic-danger-600 hover:from-semantic-danger-600 hover:to-semantic-danger-700'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200`}
            aria-label={`포인트 ${action === 'add' ? '추가' : '차감'} 확인`}
          >
            {action === 'add' ? '추가' : '차감'}
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdjustPointsModal;
