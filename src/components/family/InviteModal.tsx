import logger from '@/lib/logger';
import {
  Check,
  Copy,
  Link2,
  Loader2,
  Mail,
  QrCode,
  Send,
  Users,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { GroupRole } from '../../types/group';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  groupId: string;
  inviteCode?: string;
  onInviteByEmail: (
    email: string,
    role: GroupRole,
    message?: string
  ) => Promise<void>;
  onGenerateInviteLink: () => Promise<string>;
  onCopyInviteCode: () => void;
}

export function InviteModal({
  isOpen,
  onClose,
  groupName,
  inviteCode,
  onInviteByEmail,
  onGenerateInviteLink,
  onCopyInviteCode,
}: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'link' | 'code'>(
    'email'
  );
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<GroupRole>('member');
  const [message, setMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleEmailInvite = async () => {
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onInviteByEmail(email.trim(), role, message.trim() || undefined);
      setEmail('');
      setMessage('');
      // Show success message or close modal
    } catch (error) {
      logger.error('invite', 'Failed to send invitation', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (inviteLink || isLoading) return;

    setIsLoading(true);
    try {
      const link = await onGenerateInviteLink();
      setInviteLink(link);
    } catch (error) {
      logger.error('invite', 'Failed to generate invite link', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      logger.error('invite', 'Failed to copy', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard variant="strong">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div>
              <h2 className="text-lg-ko font-semibold">멤버 초대</h2>
              <p className="text-sm text-gray-500">
                {groupName}에 새 멤버를 초대하세요
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/20">
            {[
              { key: 'email', label: '이메일', icon: Mail },
              { key: 'link', label: '링크', icon: Link2 },
              { key: 'code', label: '코드', icon: QrCode },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'email' | 'link' | 'code')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
                  border-b-2 transition-colors
                  ${
                    activeTab === tab.key
                      ? 'border-primary-400 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 주소
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="초대할 사람의 이메일을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-400 focus:outline-none"
                    disabled={isLoading}
                    onKeyDown={e => e.key === 'Enter' && handleEmailInvite()}
                  />
                </div>

                <div className="modal-dropdown">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    역할
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as GroupRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-400 focus:outline-none"
                    disabled={isLoading}
                  >
                    <option value="member">일반 멤버</option>
                    <option value="admin">관리자</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {role === 'admin'
                      ? '관리자는 멤버 관리와 설정 변경이 가능합니다'
                      : '일반 멤버는 할일 생성과 완료가 가능합니다'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    초대 메시지 (선택사항)
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="개인적인 초대 메시지를 추가하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-400 focus:outline-none resize-none"
                    disabled={isLoading}
                  />
                </div>

                <WaveButton
                  onClick={handleEmailInvite}
                  className="w-full"
                  disabled={!email.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  초대 이메일 전송
                </WaveButton>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-base-ko font-medium mb-2">
                    초대 링크 생성
                  </h3>
                  <p className="text-sm text-gray-600">
                    링크를 통해 누구든지 그룹에 참여할 수 있습니다
                  </p>
                </div>

                {!inviteLink ? (
                  <WaveButton
                    onClick={handleGenerateLink}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Link2 size={16} />
                    )}
                    초대 링크 생성
                  </WaveButton>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Link2 size={16} className="text-gray-500" />
                        <span className="text-sm font-medium">초대 링크</span>
                      </div>
                      <p className="text-sm text-gray-600 break-all">
                        {inviteLink}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <WaveButton
                        onClick={() => copyToClipboard(inviteLink, 'link')}
                        className="flex-1"
                        variant="ghost"
                      >
                        {copied === 'link' ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                        {copied === 'link' ? '복사됨!' : '링크 복사'}
                      </WaveButton>

                      <WaveButton
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `${groupName} 초대`,
                              text: `${groupName} 그룹에 참여하세요!`,
                              url: inviteLink,
                            });
                          } else {
                            copyToClipboard(inviteLink, 'link');
                          }
                        }}
                        className="flex-1"
                      >
                        <Send size={16} />
                        공유하기
                      </WaveButton>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      링크는 7일 후 만료됩니다
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <QrCode size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-base-ko font-medium mb-2">초대 코드</h3>
                  <p className="text-sm text-gray-600">
                    6자리 코드를 공유하여 간편하게 초대하세요
                  </p>
                </div>

                {inviteCode ? (
                  <div className="space-y-3">
                    <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                      <div className="text-3xl-ko font-bold text-primary-700 tracking-widest mb-2">
                        {inviteCode}
                      </div>
                      <p className="text-sm text-primary-600">그룹 참여 코드</p>
                    </div>

                    <div className="flex gap-2">
                      <WaveButton
                        onClick={() => copyToClipboard(inviteCode, 'code')}
                        className="flex-1"
                        variant="ghost"
                      >
                        {copied === 'code' ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                        {copied === 'code' ? '복사됨!' : '코드 복사'}
                      </WaveButton>

                      <WaveButton onClick={onCopyInviteCode} className="flex-1">
                        <Send size={16} />
                        코드 공유
                      </WaveButton>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>사용법:</strong> 초대받은 사람은 앱에서 "그룹
                        참여" → "코드 입력"에서 이 코드를 입력하면 됩니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-4">
                      아직 초대 코드가 생성되지 않았습니다
                    </p>
                    <p className="text-xs text-gray-500">
                      그룹 설정에서 초대 코드를 활성화해주세요
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default InviteModal;
