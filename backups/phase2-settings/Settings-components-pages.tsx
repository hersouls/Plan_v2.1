import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNavigationCallback } from '../../utils/navigationCallback';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { 
  User, 
  Bell, 
  Shield, 
  LogOut,
  X,
  Plane
} from 'lucide-react';

interface SettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  enableCallback?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ 
  isOpen = true, 
  onClose,
  enableCallback = false 
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { smartGoBack } = useNavigationCallback(searchParams);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  const [preferences, setPreferences] = useState({
    theme: 'auto',
    language: 'ko',
    notifications: true,
    emailNotifications: true
  });

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('moonwaveTravelPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to parse preferences:', error);
      }
    }
  }, []);

  const savePreferences = (newPreferences: typeof preferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('moonwaveTravelPreferences', JSON.stringify(newPreferences));
  };

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

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile' as const, label: '프로필', icon: User },
    { id: 'notifications' as const, label: '알림', icon: Bell },
    { id: 'privacy' as const, label: '개인정보', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard variant="strong" className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Plane className="w-8 h-8 text-travel-blue" />
            <h1 className="text-2xl font-bold text-white">설정</h1>
          </div>
          {(onClose || enableCallback) && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-white/5 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-travel-blue text-white'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="absolute bottom-4 left-4 right-4">
              <WaveButton
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut size={16} className="mr-2" />
                로그아웃
              </WaveButton>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">프로필 정보</h2>
                
                <GlassCard variant="light" className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-travel-blue to-travel-purple flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {user?.displayName || user?.email?.split('@')[0] || '사용자'}
                      </h3>
                      <p className="text-white/60">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">이메일</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">표시 이름</label>
                      <input
                        type="text"
                        value={user?.displayName || ''}
                        disabled
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        placeholder="설정된 이름이 없습니다"
                      />
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}


            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">알림 설정</h2>
                
                <GlassCard variant="light" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">푸시 알림</h3>
                        <p className="text-white/60 text-sm">여행 일정 및 중요 알림을 받습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications}
                          onChange={(e) => savePreferences({ ...preferences, notifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-travel-blue"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">이메일 알림</h3>
                        <p className="text-white/60 text-sm">중요한 업데이트를 이메일로 받습니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => savePreferences({ ...preferences, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-travel-blue"></div>
                      </label>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">개인정보 보호</h2>
                
                <GlassCard variant="light" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-medium mb-2">데이터 보호</h3>
                      <p className="text-white/70 text-sm mb-4">
                        모든 개인정보는 안전하게 암호화되어 저장됩니다.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-white font-medium mb-2">계정 보안</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Firebase Authentication을 통해 안전하게 관리됩니다.
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <WaveButton
                        variant="secondary"
                        size="sm"
                        onClick={() => alert('계정 삭제 기능은 관리자에게 문의해주세요.')}
                      >
                        계정 삭제
                      </WaveButton>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;