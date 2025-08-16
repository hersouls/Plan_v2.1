import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Camera,
  FileText,
  Image,
  Maximize2,
  Paperclip,
  Send,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { uploadChatAttachment } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Typography } from '../ui/typography';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: any;
  attachments?: Array<{
    type: 'image' | 'file' | 'video';
    url: string;
    name: string;
    size?: number;
  }>;
}

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
    members: any[];
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

  // 현재 사용자의 프로필 정보 가져오기
  const { user: currentUserProfile } = useUser({ userId: user?.uid });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<
    string | null
  >(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 전체화면 모달 열기 핸들러
  const handleOpenFullscreenModal = () => {
    console.log('전체화면 모달 열기 시도:', { groupId, groupName, members });
    if (onOpenFullscreen) {
      onOpenFullscreen({ groupId, groupName, members });
    } else {
      // fallback: 이벤트 방식
      const event = new CustomEvent('groupChatFullscreenOpen', {
        detail: { groupId, groupName, members },
      });
      window.dispatchEvent(event);
    }
    console.log('전체화면 모달 이벤트 발생 완료');
  };

  // 롱프레스 핸들러
  const handleLongPress = (messageId: string) => {
    const timer = setTimeout(() => {
      setSelectedMessageForDelete(messageId);
    }, 500); // 0.5초 롱프레스
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 메시지 삭제 핸들러
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const db = getFirestore();
      const messageRef = doc(db, 'groups', groupId, 'chat', messageId);
      await deleteDoc(messageRef);
      setSelectedMessageForDelete(null);
    } catch (error) {
      console.error('메시지 삭제 실패:', error);
    }
  };

  // 삭제 모드 취소
  const cancelDeleteMode = () => {
    setSelectedMessageForDelete(null);
  };
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 채팅 메시지 실시간 구독
  useEffect(() => {
    console.log('채팅 구독 시작:', { groupId });

    if (!groupId) {
      console.log('groupId가 없어서 구독 중단');
      return;
    }

    const db = getFirestore();
    const chatRef = collection(db, 'groups', groupId, 'chat');
    const q = query(chatRef, orderBy('timestamp', 'asc'));

    console.log('Firestore 쿼리 생성:', q);

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        console.log('채팅 메시지 스냅샷 받음:', snapshot.size, '개 메시지');
        const chatMessages: ChatMessage[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log('메시지 데이터:', { id: doc.id, data });
          chatMessages.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            message: data.message,
            timestamp: data.timestamp,
            attachments: data.attachments || [],
          });
        });
        setMessages(chatMessages);
        setIsLoading(false);
      },
      error => {
        console.error('채팅 메시지 로드 실패:', error);
        console.error('오류 상세:', {
          code: error?.code,
          message: error?.message,
          details: error?.details,
        });
        setIsLoading(false);
      }
    );

    return () => {
      console.log('채팅 구독 해제');
      unsubscribe();
    };
  }, [groupId]);

  // 새 메시지가 추가되면 자동 스크롤 (비활성화)
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  // ESC 키로 이미지 모달 닫기 및 삭제 모드 취소
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        }
        if (selectedMessageForDelete) {
          setSelectedMessageForDelete(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedMessageForDelete]);

  // 이모지 선택
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // 파일 업로드 처리
  const handleFileUpload = async (
    files: FileList | null,
    type: 'image' | 'file' | 'video'
  ) => {
    if (!files || files.length === 0) return;
    if (!user?.uid) {
      alert('로그인이 필요합니다.');
      return;
    }

    const file = files[0];

    try {
      // 임시 URL 생성 (미리보기용)
      const tempUrl = URL.createObjectURL(file);

      // 첨부파일 목록에 추가
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
      console.error('파일 처리 실패:', error);
      alert('파일 처리에 실패했습니다.');
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

  // 메시지 전송
  const handleSendMessage = async () => {
    console.log('메시지 전송 시도:', {
      user: user?.uid,
      message: newMessage,
      groupId,
      attachments: attachments.length,
    });

    if (
      !user?.uid ||
      (!newMessage.trim() && attachments.length === 0) ||
      isSending
    ) {
      console.log('전송 조건 미충족:', {
        user: !!user?.uid,
        message: newMessage.trim(),
        attachments: attachments.length,
        isSending,
      });
      return;
    }

    setIsSending(true);
    try {
      const db = getFirestore();
      const chatRef = collection(db, 'groups', groupId, 'chat');
      console.log('Firestore 참조 생성:', chatRef.path);

      const currentMember = members.find(m => m.userId === user.uid);
      const userName =
        currentUserProfile?.displayName ||
        currentMember?.displayName ||
        currentMember?.userName ||
        user.displayName ||
        user.email ||
        '알 수 없음';
      const userAvatar =
        currentUserProfile?.photoURL || currentMember?.avatar || user.photoURL;

      // Firebase Storage에 파일 업로드
      const uploadedAttachments = await Promise.all(
        attachments.map(async (attachment, index) => {
          if (attachment.file) {
            try {
              const uploadResult = await uploadChatAttachment(
                attachment.file,
                groupId,
                user.uid,
                progress => {
                  // 업로드 진행률 업데이트
                  setAttachments(prev =>
                    prev.map((att, i) =>
                      i === index ? { ...att, uploadProgress: progress } : att
                    )
                  );
                }
              );

              // 업로드 완료 후 진행률을 100%로 설정
              setAttachments(prev =>
                prev.map((att, i) =>
                  i === index ? { ...att, uploadProgress: 100 } : att
                )
              );

              return {
                type: attachment.type,
                url: uploadResult.downloadUrl,
                name: attachment.name,
                size: attachment.size,
              };
            } catch (error) {
              console.error('파일 업로드 실패:', error);
              throw new Error(
                `파일 "${attachment.name}" 업로드에 실패했습니다.`
              );
            }
          } else {
            // 이미 업로드된 파일인 경우
            return {
              type: attachment.type,
              url: attachment.url,
              name: attachment.name,
              size: attachment.size,
            };
          }
        })
      );

      const messageData = {
        userId: user.uid,
        userName,
        userAvatar,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        attachments: uploadedAttachments,
      };

      console.log('전송할 메시지 데이터:', messageData);

      const docRef = await addDoc(chatRef, messageData);
      console.log('메시지 전송 성공:', docRef.id);

      setNewMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      console.error('오류 상세:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        details: (error as any)?.details,
      });
      alert(`메시지 전송에 실패했습니다: ${(error as any)?.message || error}`);
    } finally {
      setIsSending(false);
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

  return (
    <GlassCard
      variant="light"
      hover={false}
      className="p-6 lg:p-8 active:scale-100 sm:active:scale-100 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography.H3 className="text-white font-pretendard">
            그룹 채팅
          </Typography.H3>
          <Typography.Caption className="text-white/60">
            {groupName} 구성원들과 실시간으로 소통하세요
          </Typography.Caption>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <Typography.Caption className="text-white/60">
              실시간
            </Typography.Caption>
          </div>
          <button
            onClick={handleOpenFullscreenModal}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="전체화면으로 보기"
          >
            <Maximize2 size={16} className="text-white/70" />
          </button>
          {onOpenFullscreen && (
            <button
              onClick={() => {
                console.log('GroupChat에서 모달 닫기 요청');
                // 부모 컴포넌트에 모달 닫기 이벤트 전달
                const event = new CustomEvent('groupChatFullscreenClose');
                window.dispatchEvent(event);
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="전체화면 닫기"
            >
              <X size={16} className="text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="h-full min-h-[576px] bg-white/5 rounded-lg border border-white/10 overflow-hidden flex flex-col flex-1">
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  아직 메시지가 없습니다
                </Typography.Body>
                <Typography.Caption className="text-white/40">
                  첫 번째 메시지를 보내보세요!
                </Typography.Caption>
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  isOwnMessage(message.userId) ? 'flex-row-reverse' : 'flex-row'
                )}
                onTouchStart={() => handleLongPress(message.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseDown={() => handleLongPress(message.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                {/* 아바타 */}
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    {message.userAvatar ? (
                      <AvatarImage
                        src={message.userAvatar}
                        alt={message.userName}
                      />
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
                    isOwnMessage(message.userId) ? 'items-end' : 'items-start'
                  )}
                >
                  {/* 사용자 이름 */}
                  <Typography.Caption
                    className={cn(
                      'text-xs mb-1 font-semibold',
                      isOwnMessage(message.userId)
                        ? 'text-white/70'
                        : 'text-white/90'
                    )}
                  >
                    {isOwnMessage(message.userId) ? '나' : message.userName}
                  </Typography.Caption>

                  {/* 메시지 버블 */}
                  <div
                    className={cn(
                      'px-4 py-3 rounded-2xl break-words shadow-lg backdrop-blur-sm relative',
                      isOwnMessage(message.userId)
                        ? 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-black border border-yellow-500/30'
                        : 'bg-white/20 text-white border border-white/30 shadow-white/10',
                      selectedMessageForDelete === message.id &&
                        'ring-2 ring-red-500 ring-opacity-50'
                    )}
                  >
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

                    {/* 삭제 버튼 */}
                    {selectedMessageForDelete === message.id && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                        <button
                          onClick={cancelDeleteMode}
                          className="p-1 bg-gray-500 hover:bg-gray-600 rounded-full transition-colors"
                          title="취소"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    )}

                    {/* 첨부파일 */}
                    {message.attachments && message.attachments.length > 0 && (
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
                                onClick={() => setSelectedImage(attachment.url)}
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
                                  const link = document.createElement('a');
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
                  </div>

                  {/* 시간 */}
                  <Typography.Caption
                    className={cn(
                      'text-xs mt-1 font-medium',
                      isOwnMessage(message.userId)
                        ? 'text-white/50'
                        : 'text-white/60'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </Typography.Caption>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

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
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
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
                인증 상태를 확인하는 중...
              </Typography.Body>
            </div>
          ) : !user?.uid ? (
            <div className="text-center py-4">
              <Typography.Body className="text-white/60">
                메시지를 보내려면 로그인이 필요합니다.
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
                >
                  <Smile size={16} className="text-white/70" />
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="카메라"
                >
                  <Camera size={16} className="text-white/70" />
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="사진"
                >
                  <Image size={16} className="text-white/70" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="파일"
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
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  disabled={isSending}
                  maxLength={500}
                />
                <WaveButton
                  onClick={handleSendMessage}
                  disabled={
                    (!newMessage.trim() && attachments.length === 0) ||
                    isSending
                  }
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
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
                  {member.avatar ? (
                    <AvatarImage
                      src={member.avatar}
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
    </GlassCard>
  );
}
