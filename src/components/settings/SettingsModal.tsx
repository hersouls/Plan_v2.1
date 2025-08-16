import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Plane, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigationCallback } from '../../utils/navigationCallback';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { SettingsContainer } from './SettingsContainer';
import type { SettingsContainerProps } from './types';

interface SettingsModalProps extends Omit<SettingsContainerProps, 'mode'> {
  isOpen?: boolean;
  title?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen = true, 
  onClose,
  enableCallback = false,
  initialTab = 'profile',
  title = '설정'
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { smartGoBack } = useNavigationCallback(searchParams);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // 모달이 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    try {
      await signOut();
      if (onClose) onClose();
      
      // 콜백이 활성화된 경우 스마트 뒤로가기, 아니면 로그인으로
      if (enableCallback) {
        smartGoBack(navigate, '/login');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (enableCallback) {
      // 콜백이 활성화되었지만 onClose가 없는 경우 스마트 뒤로가기
      smartGoBack(navigate, '/');
    }
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <GlassCard 
        variant="strong" 
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white font-pretendard">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 로그아웃 버튼 */}
            <WaveButton
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline ml-1">로그아웃</span>
            </WaveButton>
            
            {/* 닫기 버튼 */}
            {(onClose || enableCallback) && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                aria-label="설정 닫기"
              >
                <X className="w-5 h-5 text-white group-hover:text-white/80" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            <SettingsContainer
              mode="modal"
              initialTab={initialTab}
              onClose={onClose}
              enableCallback={enableCallback}
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};