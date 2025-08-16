import jsQR from 'jsqr';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { ManualInviteModal } from './ManualInviteModal';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  onScanError: (error: string) => void;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // 비디오 로드 완료 후 스캔 시작
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            scanQRCode();
          }
        };
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.');
      setIsScanning(false);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 이미지 데이터 가져오기
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // jsQR로 QR코드 스캔
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      // QR코드 발견
      setSuccess('QR코드 스캔이 완료되었습니다!');
      onScanSuccess(code.data);
      stopScanning();
      return;
    }

    // 다음 프레임 스캔
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const stopScanning = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setSuccess(null);
    startScanning();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
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
          <Typography.H3 className="text-white mb-2">QR코드 스캔</Typography.H3>
          <Typography.Body className="text-white/80">
            가족 그룹 초대 QR코드를 스캔하세요
          </Typography.Body>
        </div>

        {/* Camera View */}
        <div className="relative mb-6">
          <div className="aspect-square bg-black rounded-xl overflow-hidden relative">
            {isScanning && !error && !success && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-400 rounded-lg relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400"></div>
                  </div>
                </div>
                {/* Scanning Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                </div>
              </>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <Typography.Body className="text-white mb-4">
                  {error}
                </Typography.Body>
                <WaveButton variant="primary" onClick={handleRetry}>
                  다시 시도
                </WaveButton>
              </div>
            )}

            {success && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <Typography.Body className="text-white mb-4">
                  {success}
                </Typography.Body>
                <WaveButton variant="primary" onClick={handleClose}>
                  확인
                </WaveButton>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <Typography.Body className="text-white/80 text-sm">
            📱 QR코드를 카메라 프레임 안에 맞춰주세요
            <br />
            🔍 자동으로 스캔됩니다
          </Typography.Body>
        </div>

        {/* Manual Input Option */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <Typography.Body className="text-white/80 text-sm text-center mb-3">
            QR코드가 인식되지 않나요?
          </Typography.Body>
          <WaveButton
            variant="ghost"
            onClick={() => {
              setShowManualModal(true);
            }}
            className="w-full"
          >
            초대 코드 직접 입력
          </WaveButton>
        </div>
      </GlassCard>

      {/* Manual Invite Modal */}
      <ManualInviteModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSubmit={inviteCode => {
          onScanSuccess(inviteCode);
          setShowManualModal(false);
        }}
      />
    </div>
  );
}
