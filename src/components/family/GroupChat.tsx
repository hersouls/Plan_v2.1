// Timestamp 타입/값 둘 다 사용
import { useVirtualizer } from '@tanstack/react-virtual';
import { Timestamp } from 'firebase/firestore';
import {
  Camera,
  FileText,
  Image,
  Maximize2,
  Paperclip,
  Pin,
  Search,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { cn, logger } from '../../lib/utils';
import type { ChatMessage, ChatSearchResult } from '../../types/chat';
import { useSettingsContext } from '../settings/contexts/SettingsContextBase';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Typography } from '../ui/typography';
import { useToast } from '../ui/useToast';
import { ChatSearch } from './ChatSearch';
import { MessageActions } from './MessageActions';
import { PinnedMessages } from './PinnedMessages';
import { TypingIndicator } from './TypingIndicator';

interface GroupChatProps {
  groupId: string;
  groupName: string;
  members: Array<{
    userId: string;
    displayName?: string;
    userName?: string;
    avatar?: string;
  }>;
  onOpenFullscreen?: (data: {
    groupId: string;
    groupName: string;
    members: Array<{
      userId: string;
      displayName?: string;
      userName?: string;
      avatar?: string;
    }>;
  }) => void;
}

// 이모지 데이터
const EMOJI_DATA = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '😋',
  '😛',
  '😝',
  '😜',
  '🤪',
  '🤨',
  '🧐',
  '🤓',
  '😎',
  '🤩',
  '🥳',
  '😏',
  '😒',
  '😞',
  '😔',
  '😟',
  '😕',
  '🙁',
  '☹️',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😠',
  '😡',
  '🤬',
  '🤯',
  '😳',
  '🥵',
  '🥶',
  '😱',
  '😨',
  '😰',
  '😥',
  '😓',
  '🤗',
  '🤔',
  '🤭',
  '🤫',
  '🤥',
  '😶',
  '😐',
  '😑',
  '😯',
  '😦',
  '😧',
  '😮',
  '😲',
  '🥱',
  '😴',
  '🤤',
  '😪',
  '😵',
  '🤐',
  '🥴',
  '🤢',
  '🤮',
  '🤧',
  '😷',
  '🤒',
  '🤕',
  '🤑',
  '🤠',
  '💩',
  '👻',
  '💀',
  '☠️',
  '👽',
  '👾',
  '🤖',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '😽',
];

export function GroupChat({
  groupId,
  groupName,
  members,
  onOpenFullscreen,
}: GroupChatProps) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  // const { user: _currentUserProfile } = useUser({ userId: user?.uid });
  const { success: showSuccess, error: showError, info: showInfo } = useToast();
  const { settings } = useSettingsContext();

  // 새로운 채팅 훅 사용
  const {
    messages,
    isLoading,
    error,
    typingUsers,
    sendMessage,
    deleteMessage,
    editMessage,
    replyToMessage: replyToMessageFn,
    togglePinMessage,
    searchMessages,
    markMessageAsRead,
    // getMessagePermissions: _getMessagePermissions,
    startTyping,
    stopTyping,
    clearError,
  } = useChat({
    groupId,
    limit: 100,
    enableTyping: true,
    enableReadReceipts: true,
  });

  // UI 상태 관리
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(
    null
  );
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 중복 읽음 처리 방지
  const markedReadRef = useRef<Set<string>>(new Set());

  // 파일 업로드 관련
  const [attachments, setAttachments] = useState<
    Array<{
      type: 'image' | 'file' | 'video';
      url: string;
      name: string;
      size?: number;
      file?: File;
      uploadProgress?: number;
    }>
  >([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listParentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // 메시지 리스트 가상화 설정
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 112,
    overscan: 8,
  });

  // 타이핑 이벤트 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    // 디바운스: 입력 시 즉시 startTyping, 이후 일정 시간 입력 없으면 stopTyping
    try {
      if (value.length > 0) {
        startTyping();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          stopTyping();
          typingTimeoutRef.current = null;
        }, 1500);
      } else {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        stopTyping();
      }
    } catch (err) {
      logger.warn('GroupChat', 'typing indicator update failed', err);
    }
  };

  // 메시지 전송
  const revokeAllAttachmentUrls = () => {
    try {
      attachments.forEach(att => {
        if (att.url && att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url);
        }
      });
    } catch (err) {
      logger.warn('GroupChat', 'failed to revoke object URLs', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      if (replyToMessage) {
        await replyToMessageFn(replyToMessage.id, newMessage);
      } else {
        await sendMessage(newMessage, attachments);
      }
      // 정리 및 초기화
      setNewMessage('');
      revokeAllAttachmentUrls();
      setAttachments([]);
      setReplyToMessage(null);
      setShowEmojiPicker(false);
      inputRef.current?.focus();
      // 전송 후 자동 스크롤 하단 이동
      rowVirtualizer.scrollToIndex(messages.length, { align: 'end' });
    } catch (error) {
      logger.error('GroupChat', 'Failed to send message', error);
      showError('메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (
    files: FileList | null,
    type: 'image' | 'file' | 'video'
  ) => {
    if (!files || files.length === 0) return;
    if (!user?.uid) {
      showInfo(t('chat.loginRequired'));
      return;
    }

    const file = files[0];

    try {
      const tempUrl = URL.createObjectURL(file);
      setAttachments(prev => [
        ...prev,
        {
          type,
          url: tempUrl,
          name: file.name,
          size: file.size,
          file,
          uploadProgress: 0,
        },
      ]);
    } catch (error) {
      logger.error('GroupChat', 'file process failed', error);
      showError(t('chat.errorFileProcessFailed'));
    }
  };

  // 첨부파일 제거
  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // 이모지 선택
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // 메시지 액션 핸들러들
  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyToMessage(message);
      inputRef.current?.focus();
    }
  };

  const handleEdit = async (messageId: string, newMessage: string) => {
    try {
      await editMessage(messageId, newMessage);
    } catch (error) {
      logger.error('GroupChat', 'Failed to edit message', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      logger.error('GroupChat', 'Failed to delete message', error);
    }
  };

  const handlePin = async (messageId: string) => {
    try {
      await togglePinMessage(messageId);
    } catch (error) {
      logger.error('GroupChat', 'Failed to pin message', error);
    }
  };

  const handleCopy = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(message);
      setTimeout(() => setCopiedMessage(null), 2000);
      showSuccess('메시지가 복사되었습니다');
    } catch (err) {
      logger.error('GroupChat', 'clipboard write failed', err);
      showError(t('chat.toastCopyFailed'));
    }
  };

  // 검색 결과 선택
  const handleSearchResultSelect = (result: ChatSearchResult) => {
    const index = messages.findIndex(m => m.id === result.messageId);
    if (index >= 0) {
      rowVirtualizer.scrollToIndex(index, { align: 'center' });
      setTimeout(() => {
        const el = document.getElementById(`message-${result.messageId}`);
        if (el) {
          el.classList.add('highlight-message');
          setTimeout(() => el.classList.remove('highlight-message'), 3000);
        }
      }, 50);
    }
  };

  // 고정된 메시지 클릭
  const handlePinnedMessageClick = (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index >= 0) {
      rowVirtualizer.scrollToIndex(index, { align: 'center' });
    }
  };

  // 시간 포맷팅
  const formatTime = (
    timestamp:
      | Timestamp
      | Date
      | number
      | { toDate?: () => Date }
      | null
      | undefined
  ) => {
    if (!timestamp) return '';

    let date: Date | null = null;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (
      typeof timestamp === 'object' &&
      typeof timestamp.toDate === 'function'
    ) {
      date = timestamp.toDate();
    }

    if (!date) return '';

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 현재 사용자의 메시지인지 확인
  const isOwnMessage = (messageUserId: string) => {
    return messageUserId === user?.uid;
  };

  // ESC 키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        }
        if (showSearch) {
          setShowSearch(false);
        }
        if (replyToMessage) {
          setReplyToMessage(null);
        }
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        }
        // ESC 시 typing 중지
        try {
          stopTyping();
        } catch {
          // no-op
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // stopTyping는 안정적인 훅 함수로 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, showSearch, replyToMessage, showEmojiPicker]);

  // 메시지 읽음 처리
  useEffect(() => {
    if (!user?.uid || messages.length === 0) return;

    const unreadMessages = messages.filter(m => {
      if (m.userId === user.uid) return false;
      if (markedReadRef.current.has(m.id)) return false;
      const alreadyRead = m.readBy?.[user.uid];
      return !alreadyRead;
    });

    unreadMessages.forEach(m => {
      markedReadRef.current.add(m.id);
      markMessageAsRead(m.id);
    });
  }, [messages, user?.uid, markMessageAsRead]);

  // 그룹 변경 시 캐시 초기화
  useEffect(() => {
    markedReadRef.current.clear();
  }, [groupId]);

  // 메시지 변경 시 자동 스크롤 하단 이동
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
    // rowVirtualizer는 안정적인 인스턴스
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      revokeAllAttachmentUrls();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
    // revokeAllAttachmentUrls는 안정적인 내부 함수이며 의존성으로 포함하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GlassCard
      variant="light"
      hover={false}
      className="p-6 lg:p-8 active:scale-100 sm:active:scale-100 h-full flex flex-col"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography.H3 className="text-white font-pretendard">
            {t('chat.title')}
          </Typography.H3>
          <Typography.Caption className="text-white/60">
            {t('chat.subtitle')}
          </Typography.Caption>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Typography.Caption className="text-white/60">
              {t('chat.realtime')}
            </Typography.Caption>
          </div>

          {/* 검색 버튼 */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t('chat.search')}
            aria-label={t('chat.search')}
          >
            <Search size={16} className="text-white/70" />
          </button>

          {/* 고정된 메시지 버튼 */}
          <button
            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t('chat.pinned')}
            aria-label={t('chat.pinned')}
          >
            <Pin size={16} className="text-white/70" />
          </button>

          {/* 전체화면 버튼 */}
          <button
            onClick={() => {
              if (onOpenFullscreen) {
                onOpenFullscreen({ groupId, groupName, members });
              } else {
                const event = new CustomEvent('groupChatFullscreenOpen', {
                  detail: { groupId, groupName, members },
                });
                window.dispatchEvent(event);
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t('chat.fullscreenOpen')}
            aria-label={t('chat.fullscreenOpen')}
          >
            <Maximize2 size={16} className="text-white/70" />
          </button>

          {/* 닫기 버튼 (전체화면 모드에서만) */}
          {onOpenFullscreen && (
            <button
              onClick={() => {
                const event = new CustomEvent('groupChatFullscreenClose');
                window.dispatchEvent(event);
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={t('chat.fullscreenClose')}
              aria-label={t('chat.fullscreenClose')}
            >
              <X size={16} className="text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* 검색 컴포넌트 */}
      {showSearch && (
        <div className="mb-4">
          <ChatSearch
            onSearch={searchMessages}
            onSelectResult={handleSearchResultSelect}
            onClose={() => setShowSearch(false)}
          />
        </div>
      )}

      {/* 고정된 메시지 */}
      {showPinnedMessages && (
        <div className="mb-4">
          <PinnedMessages
            groupId={groupId}
            onMessageClick={handlePinnedMessageClick}
          />
        </div>
      )}

      {/* 답장 미리보기 */}
      {replyToMessage && (
        <div className="mb-4 p-3 bg-white/10 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Typography.Caption className="text-white/60 text-xs">
                {t('chat.replyingTo', { name: replyToMessage.userName })}
              </Typography.Caption>
              <Typography.Body className="text-white/80 text-sm mt-1 line-clamp-2">
                {replyToMessage.message}
              </Typography.Body>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>
        </div>
      )}

      {/* 채팅 메시지 영역 */}
      <div className="h-full min-h-[576px] bg-white/5 rounded-lg border border-white/10 overflow-hidden flex flex-col flex-1">
        {/* 메시지 목록 */}
        <div ref={listParentRef} className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Typography.Body className="text-white/60">
                채팅을 불러오는 중...
              </Typography.Body>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Typography.Body className="text-white/60 mb-2">
                  {t('chat.noMessages')}
                </Typography.Body>
                <Typography.Caption className="text-white/40">
                  {t('chat.sendFirst')}
                </Typography.Caption>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(vRow => {
                const message = messages[vRow.index];
                const own = isOwnMessage(message.userId);
                const myAvatarFromSettings =
                  settings?.profile?.avatar || user?.photoURL || undefined;
                const avatarSrc = own
                  ? myAvatarFromSettings || message.userAvatar
                  : message.userAvatar;
                return (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={cn(
                      'absolute top-0 left-0 w-full py-2 flex gap-3 transition-all duration-300',
                      own ? 'flex-row-reverse' : 'flex-row'
                    )}
                    style={{ transform: `translateY(${vRow.start}px)` }}
                  >
                    {/* 아바타 */}
                    <div className="flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        {avatarSrc ? (
                          <AvatarImage src={avatarSrc} alt={message.userName} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {message.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* 메시지 내용 */}
                    <div
                      className={cn(
                        'flex flex-col max-w-xs lg:max-w-md',
                        own ? 'items-end' : 'items-start'
                      )}
                    >
                      {/* 사용자 이름 */}
                      <Typography.Caption
                        className={cn(
                          'text-xs mb-1 font-semibold',
                          own ? 'text-white/70' : 'text-white/90'
                        )}
                      >
                        {own ? '나' : message.userName}
                      </Typography.Caption>

                      {/* 메시지 버블 */}
                      <div
                        className={cn(
                          'px-4 py-3 rounded-2xl break-words shadow-lg backdrop-blur-sm relative group',
                          own
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-black border border-primary-500/30'
                            : 'bg-white/20 text-white border border-white/30 shadow-md'
                        )}
                      >
                        {/* 답장 정보 */}
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-white/10 rounded border-l-2 border-blue-400">
                            <Typography.Caption className="text-white/60 text-xs">
                              {t('chat.replyingTo', {
                                name: message.replyTo.userName,
                              })}
                            </Typography.Caption>
                            <Typography.Caption className="text-white/80 text-xs block mt-1 line-clamp-1">
                              {message.replyTo.message}
                            </Typography.Caption>
                          </div>
                        )}

                        {/* 메시지 텍스트 */}
                        {message.message && (
                          <Typography.Body
                            className={cn(
                              'text-sm mb-2 font-medium leading-relaxed',
                              isOwnMessage(message.userId)
                                ? 'text-black'
                                : 'text-white'
                            )}
                          >
                            {message.message}
                          </Typography.Body>
                        )}

                        {/* 첨부파일 */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="bg-white/15 rounded-lg p-3 border border-white/20 backdrop-blur-sm"
                                >
                                  {attachment.type === 'image' ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      style={{ maxHeight: '200px' }}
                                      onClick={() =>
                                        setSelectedImage(attachment.url)
                                      }
                                    />
                                  ) : attachment.type === 'video' ? (
                                    <video
                                      src={attachment.url}
                                      controls
                                      className="max-w-full h-auto rounded"
                                      style={{ maxHeight: '200px' }}
                                    />
                                  ) : (
                                    <div
                                      className="flex items-center gap-2 cursor-pointer hover:bg-white/20 p-2 rounded transition-colors"
                                      onClick={() => {
                                        const link =
                                          document.createElement('a');
                                        link.href = attachment.url;
                                        link.download = attachment.name;
                                        link.click();
                                      }}
                                      title="클릭하여 다운로드"
                                    >
                                      <FileText size={16} />
                                      <div className="flex-1 min-w-0">
                                        <Typography.Caption
                                          className={cn(
                                            'text-xs truncate font-medium',
                                            isOwnMessage(message.userId)
                                              ? 'text-black/80'
                                              : 'text-white'
                                          )}
                                        >
                                          {attachment.name}
                                        </Typography.Caption>
                                        {attachment.size && (
                                          <Typography.Caption
                                            className={cn(
                                              'text-xs font-medium',
                                              isOwnMessage(message.userId)
                                                ? 'text-black/60'
                                                : 'text-white/60'
                                            )}
                                          >
                                            {formatFileSize(attachment.size)}
                                          </Typography.Caption>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        {/* 메시지 액션 버튼 */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MessageActions
                            message={message}
                            permissions={{
                              canEdit: isOwnMessage(message.userId),
                              canDelete: isOwnMessage(message.userId),
                              canPin: true,
                              canReact: true,
                              canReply: true,
                              canForward: true,
                            }}
                            onReply={handleReply}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPin={handlePin}
                            onCopy={handleCopy}
                          />
                        </div>

                        {/* 편집/고정 표시 */}
                        <div className="absolute -top-6 left-0 right-0 flex justify-between">
                          {message.isEdited && (
                            <Typography.Caption className="text-white/50 text-xs">
                              {t('chat.edited')}
                            </Typography.Caption>
                          )}
                          {message.isPinned && (
                            <div className="flex items-center gap-1">
                              <Pin className="w-3 h-3 text-yellow-400" />
                              <Typography.Caption className="text-yellow-400 text-xs">
                                {t('chat.pinnedMark')}
                              </Typography.Caption>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 시간 */}
                      <Typography.Caption
                        className={cn(
                          'text-xs mt-1 font-medium',
                          own ? 'text-white/50' : 'text-white/60'
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </Typography.Caption>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 타이핑 인디케이터 */}
        <TypingIndicator typingUsers={typingUsers} className="mx-4 mb-2" />

        {/* 첨부파일 미리보기 */}
        {attachments.length > 0 && (
          <div className="border-t border-white/10 p-3 bg-white/5">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="relative bg-white/10 rounded-lg p-2 max-w-32"
                >
                  {attachment.type === 'image' ? (
                    <div className="relative">
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(attachment.url)}
                      />
                      {attachment.uploadProgress !== undefined &&
                        attachment.uploadProgress < 100 && (
                          <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                            <div className="text-white text-xs">
                              {attachment.uploadProgress}%
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <div className="flex-1 min-w-0">
                        <Typography.Caption className="text-xs truncate">
                          {attachment.name}
                        </Typography.Caption>
                        {attachment.uploadProgress !== undefined &&
                          attachment.uploadProgress < 100 && (
                            <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                              <div
                                className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                                style={{
                                  width: `${attachment.uploadProgress}%`,
                                }}
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 메시지 입력 영역 */}
        <div className="border-t border-white/10 p-4">
          {authLoading ? (
            <div className="text-center py-4">
              <Typography.Body className="text-white/60">
                {t('chat.authChecking')}
              </Typography.Body>
            </div>
          ) : !user?.uid ? (
            <div className="text-center py-4">
              <Typography.Body className="text-white/60">
                {t('chat.loginToSend')}
              </Typography.Body>
            </div>
          ) : (
            <>
              {/* 첨부 버튼들 */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="이모지"
                  aria-label="이모지 열기"
                >
                  <Smile size={16} className="text-white/70" />
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="카메라"
                  aria-label="카메라 열기"
                >
                  <Camera size={16} className="text-white/70" />
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="사진"
                  aria-label="사진 추가"
                >
                  <Image size={16} className="text-white/70" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="파일"
                  aria-label="파일 첨부"
                >
                  <Paperclip size={16} className="text-white/70" />
                </button>
              </div>

              {/* 이모지 선택기 */}
              {showEmojiPicker && (
                <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20">
                  <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                    {EMOJI_DATA.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="p-1 hover:bg-white/20 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                  disabled={isSending}
                  maxLength={500}
                />
                <WaveButton
                  onClick={handleSendMessage}
                  disabled={
                    (!newMessage.trim() && attachments.length === 0) ||
                    isSending
                  }
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  <Send size={16} className="text-white" />
                </WaveButton>
              </div>
              <div className="flex justify-between items-center mt-2">
                <Typography.Caption className="text-white/40">
                  Enter로 전송, Shift+Enter로 줄바꿈
                </Typography.Caption>
                <Typography.Caption className="text-white/40">
                  {newMessage.length}/500
                </Typography.Caption>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 숨겨진 파일 입력들 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => handleFileUpload(e.target.files, 'image')}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={e => handleFileUpload(e.target.files, 'image')}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        onChange={e => handleFileUpload(e.target.files, 'file')}
        className="hidden"
      />

      {/* 구성원 목록 - 전체화면 모달이 아닐 때만 표시 */}
      {!onOpenFullscreen && (
        <div className="mt-4">
          <Typography.Caption className="text-white/60 mb-2 block">
            현재 접속 중인 구성원 ({members.length}명)
          </Typography.Caption>
          <div className="flex flex-wrap gap-2">
            {members.map(member => (
              <div
                key={member.userId}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20"
              >
                <Avatar className="w-5 h-5">
                  {(
                    member.userId === user?.uid
                      ? settings?.profile?.avatar ||
                        user?.photoURL ||
                        member.avatar
                      : member.avatar
                  ) ? (
                    <AvatarImage
                      src={
                        member.userId === user?.uid
                          ? ((settings?.profile?.avatar ||
                              user?.photoURL ||
                              member.avatar) as string)
                          : (member.avatar as string)
                      }
                      alt={member.displayName || member.userName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                    {(member.displayName || member.userName || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Typography.Caption className="text-white/80 text-xs">
                  {member.displayName || member.userName}
                </Typography.Caption>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 확대 보기 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
            <img
              src={selectedImage}
              alt="확대된 이미지"
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {copiedMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <Typography.Caption>메시지가 복사되었습니다</Typography.Caption>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <Typography.Caption>{error}</Typography.Caption>
            <button
              onClick={clearError}
              className="ml-2 hover:bg-red-600 rounded p-1"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
