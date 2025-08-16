import { Key, X } from 'lucide-react';
import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface ManualInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inviteCode: string) => void;
}

export function ManualInviteModal({
  isOpen,
  onClose,
  onSubmit,
}: ManualInviteModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    if (inviteCode.trim().length < 6) {
      setError('올바른 초대 코드를 입력해주세요.');
      return;
    }

    setError('');
    onSubmit(inviteCode.trim());
    setInviteCode('');
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <GlassCard
        variant="medium"
        className="p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 p-2 rounded-lg hover:bg-white/10"
          type="button"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <Typography.H3 className="text-white mb-2">
            초대 코드 입력
          </Typography.H3>
          <Typography.Body className="text-white/80">
            가족 그룹 초대 코드를 입력하세요
          </Typography.Body>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Typography.Label className="block text-white mb-3">
              초대 코드
            </Typography.Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-white/70" />
              </div>
              <input
                type="text"
                value={inviteCode}
                onChange={e => {
                  setInviteCode(e.target.value);
                  if (error) setError('');
                }}
                className="
                  glass-light w-full pl-12 pr-4 py-4 rounded-xl 
                  text-base text-white placeholder-white/50 
                  focus:outline-none focus:ring-2 
                  focus:ring-blue-500/50 focus:border-transparent
                  transition-all duration-200 font-pretendard
                "
                placeholder="초대 코드를 입력하세요"
                maxLength={20}
              />
            </div>
            {error && (
              <Typography.Body className="text-red-400 text-sm mt-2">
                {error}
              </Typography.Body>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <WaveButton
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </WaveButton>
            <WaveButton type="submit" variant="primary" className="flex-1">
              참여하기
            </WaveButton>
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <Typography.Body className="text-white/80 text-sm">
            💡 가족 구성원에게 받은 초대 코드를 정확히 입력해주세요
            <br />
            🔗 초대 코드는 보통 6-8자리의 영문자와 숫자로 구성됩니다
          </Typography.Body>
        </div>
      </GlassCard>
    </div>
  );
}
