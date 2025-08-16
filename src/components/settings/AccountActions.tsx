import { useState } from 'react';
import { 
  Key, LogOut, Shield, AlertTriangle, 
  Download, Upload, Lock, Mail, UserX
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { InlineLoading } from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDangerous?: boolean;
}

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText,
  isDangerous = false 
}: ConfirmationModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const confirmWord = 'DELETE';

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isDangerous && confirmInput !== confirmWord) {
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard variant="strong" className="max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-red-500 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-300">{message}</p>
          </div>
        </div>

        {isDangerous && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">
              확인을 위해 <span className="font-mono font-bold text-red-400">{confirmWord}</span>를 입력하세요:
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder={confirmWord}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <WaveButton variant="ghost" onClick={onClose}>
            취소
          </WaveButton>
          <WaveButton 
            onClick={handleConfirm}
            disabled={isDangerous && confirmInput !== confirmWord}
            className={isDangerous ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
}

export function AccountActions() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.new.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setLoading('password');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Password updated');
      setShowPasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordError('');
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordError('비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleExportData = async () => {
    setLoading('export');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = {
        user: {
          email: user?.email,
          displayName: user?.displayName,
          createdAt: user?.metadata?.creationTime
        },
        settings: JSON.parse(localStorage.getItem('moonwave-settings') || '{}'),
        theme: JSON.parse(localStorage.getItem('moonwave-theme') || '{}'),
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moonwave-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('import');
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.settings) {
        localStorage.setItem('moonwave-settings', JSON.stringify(data.settings));
      }
      if (data.theme) {
        localStorage.setItem('moonwave-theme', JSON.stringify(data.theme));
      }

      console.log('Data imported successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to import data:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    setLoading('logout');
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      setLoading(null);
      setShowLogoutModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading('delete');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Account deleted');
      navigate('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setLoading(null);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard variant="light" className="p-6">
        <h3 className="text-lg font-semibold mb-6">계정 보안</h3>
        
        <div className="space-y-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Key size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">비밀번호 변경</p>
                <p className="text-sm text-gray-600">계정 보안을 위해 정기적으로 변경하세요</p>
              </div>
            </div>
            <Lock size={20} className="text-gray-400" />
          </button>

          <button
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield size={18} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">2단계 인증</p>
                <p className="text-sm text-gray-600">추가 보안 계층을 활성화합니다</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">활성화됨</span>
          </button>

          <button
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Mail size={18} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">이메일 변경</p>
                <p className="text-sm text-gray-600">로그인 이메일 주소 변경</p>
              </div>
            </div>
            <Mail size={20} className="text-gray-400" />
          </button>
        </div>
      </GlassCard>

      <GlassCard variant="light" className="p-6">
        <h3 className="text-lg font-semibold mb-6">데이터 관리</h3>
        
        <div className="space-y-3">
          <WaveButton
            variant="ghost"
            className="w-full justify-start"
            onClick={handleExportData}
            disabled={loading === 'export'}
          >
            {loading === 'export' ? (
              <InlineLoading />
            ) : (
              <>
                <Download size={16} />
                데이터 내보내기
              </>
            )}
          </WaveButton>

          <label className="w-full">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              disabled={loading === 'import'}
            />
            <WaveButton
              variant="ghost"
              className="w-full justify-start"
              disabled={loading === 'import'}
              onClick={(e) => {
                e.preventDefault();
                e.currentTarget.parentElement?.querySelector('input')?.click();
              }}
            >
              {loading === 'import' ? (
                <InlineLoading />
              ) : (
                <>
                  <Upload size={16} />
                  데이터 가져오기
                </>
              )}
            </WaveButton>
          </label>
        </div>
      </GlassCard>

      <GlassCard variant="light" className="p-6 border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold mb-6 text-red-700">위험 구역</h3>
        
        <div className="space-y-3">
          <WaveButton
            variant="ghost"
            className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} />
            로그아웃
          </WaveButton>

          <WaveButton
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteModal(true)}
          >
            <UserX size={16} />
            계정 삭제
          </WaveButton>
        </div>

        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <p className="text-xs text-red-700">
            <AlertTriangle size={12} className="inline mr-1" />
            계정 삭제는 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.
          </p>
        </div>
      </GlassCard>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="strong" className="max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">비밀번호 변경</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <WaveButton 
                variant="ghost" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ current: '', new: '', confirm: '' });
                  setPasswordError('');
                }}
              >
                취소
              </WaveButton>
              <WaveButton 
                onClick={handlePasswordChange}
                disabled={loading === 'password'}
              >
                {loading === 'password' ? <InlineLoading /> : '변경'}
              </WaveButton>
            </div>
          </GlassCard>
        </div>
      )}

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        confirmText={loading === 'logout' ? '로그아웃 중...' : '로그아웃'}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="계정 삭제"
        message="계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다. 정말 삭제하시겠습니까?"
        confirmText={loading === 'delete' ? '삭제 중...' : '계정 삭제'}
        isDangerous
      />
    </div>
  );
}