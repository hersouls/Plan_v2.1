import React from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { GlassCard } from './GlassCard';
import { WaveButton } from './WaveButton';
import { Typography } from './typography';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  description,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
}) => {
  const { firstFocusableRef, modalContainerRef } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <GlassCard
        variant="strong"
        className="w-full max-w-sm p-6"
        ref={modalContainerRef as any}
        tabIndex={-1}
      >
        <Typography.H4 id="confirm-dialog-title" className="text-white mb-2">
          {title}
        </Typography.H4>
        {description && (
          <Typography.Body className="text-white/80 mb-4">
            {description}
          </Typography.Body>
        )}

        <div className="flex gap-3 mt-4">
          <WaveButton
            ref={firstFocusableRef}
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            aria-label="취소"
          >
            {cancelText}
          </WaveButton>
          <WaveButton
            className={`flex-1 ${
              danger
                ? 'bg-gradient-to-r from-semantic-danger-500 to-semantic-danger-600 hover:from-semantic-danger-600 hover:to-semantic-danger-700 text-white'
                : ''
            }`}
            onClick={onConfirm}
            aria-label={confirmText}
          >
            {confirmText}
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default ConfirmDialog;
