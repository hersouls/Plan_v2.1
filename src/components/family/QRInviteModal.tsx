import { Copy, Download, Share2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface QRInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  groupName: string;
  inviteUrl: string;
}

export function QRInviteModal({
  isOpen,
  onClose,
  inviteCode,
  groupName,
  inviteUrl,
}: QRInviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (isOpen && inviteUrl) {
      setQrValue(inviteUrl);
    }
  }, [isOpen, inviteUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groupName} 가족 그룹 초대`,
          text: `${groupName} 가족 그룹에 초대합니다. 아래 링크로 참여해주세요!`,
          url: inviteUrl,
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${groupName}-초대QR코드.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <GlassCard
        variant="medium"
        className="p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 p-2 rounded-lg hover:bg-white/10"
          type="button"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <Typography.H3 className="text-white mb-2">
            QR코드로 초대하기
          </Typography.H3>
          <Typography.Body className="text-white/80">
            {groupName} 가족 그룹에 초대합니다
          </Typography.Body>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <QRCode
              value={qrValue}
              size={200}
              level="M"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Invite Code */}
        <div className="mb-6">
          <Typography.Label className="block text-white mb-2">
            초대 코드
          </Typography.Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg">
              <Typography.Body className="text-white font-mono text-center">
                {inviteCode}
              </Typography.Body>
            </div>
            <WaveButton
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="px-3"
            >
              <Copy size={16} />
            </WaveButton>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <WaveButton
            variant="primary"
            onClick={handleShare}
            className="w-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            공유하기
          </WaveButton>

          <WaveButton
            variant="secondary"
            onClick={handleCopyLink}
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? '복사됨!' : '링크 복사'}
          </WaveButton>

          <WaveButton
            variant="ghost"
            onClick={handleDownloadQR}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            QR코드 다운로드
          </WaveButton>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <Typography.Body className="text-white/80 text-sm">
            📱 스마트폰으로 QR코드를 스캔하거나
            <br />
            🔗 링크를 복사해서 가족 구성원에게 전달하세요
          </Typography.Body>
        </div>
      </GlassCard>
    </div>
  );
}
