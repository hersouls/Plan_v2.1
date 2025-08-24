import { useAuth } from '@/contexts/AuthContext';
import { ChatService } from '@/lib/chatService';
import { groupService } from '@/lib/firestore';
import logger from '@/lib/logger';
import type {
  ChatMessage,
  ChatSearchResult,
  MessagePermissions,
  TypingStatus,
} from '@/types/chat';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatOptions {
  groupId: string;
  limit?: number;
  enableTyping?: boolean;
  enableReadReceipts?: boolean;
}

interface UseChatReturn {
  // 메시지 관련
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // 타이핑 관련
  typingUsers: TypingStatus[];

  // 메시지 액션
  sendMessage: (
    message: string,
    attachments?: ChatMessage['attachments']
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newMessage: string) => Promise<void>;
  replyToMessage: (replyToMessageId: string, message: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;

  // 검색 관련
  searchMessages: (query: string) => Promise<ChatSearchResult[]>;
  searchResults: ChatSearchResult[];
  isSearching: boolean;

  // 읽음 확인
  markMessageAsRead: (messageId: string) => Promise<void>;

  // 권한 확인
  getMessagePermissions: (messageId: string) => Promise<MessagePermissions>;

  // 타이핑 상태 관리
  startTyping: () => void;
  stopTyping: () => void;

  // 유틸리티
  clearError: () => void;
}

export function useChat({
  groupId,
  limit = 100,
  enableTyping = true,
  enableReadReceipts = true,
}: UseChatOptions): UseChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [searchResults, setSearchResults] = useState<ChatSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGroupMember, setIsGroupMember] = useState<boolean | null>(null);

  // 타이핑 관련 타이머들
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 그룹 멤버십 확인
  useEffect(() => {
    if (!groupId || !user?.uid) return;

    const checkMembership = async () => {
      try {
        const group = await groupService.getGroup(groupId);
        if (group && group.memberIds?.includes(user.uid)) {
          setIsGroupMember(true);
        } else {
          setIsGroupMember(false);
          setError('이 그룹의 멤버가 아닙니다.');
        }
      } catch (err) {
        logger.error('useChat', 'Failed to check group membership', err);
        setIsGroupMember(false);
        setError('그룹 멤버십을 확인할 수 없습니다.');
      }
    };

    checkMembership();
  }, [groupId, user?.uid]);

  // 메시지 구독
  useEffect(() => {
    if (!groupId || !isGroupMember) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = ChatService.subscribeToMessages(
      groupId,
      newMessages => {
        setMessages(newMessages);
        setIsLoading(false);
      },
      { limit }
    );

    return () => {
      unsubscribe();
    };
  }, [groupId, limit, isGroupMember]);

  // 타이핑 상태 구독
  useEffect(() => {
    if (!groupId || !enableTyping || !isGroupMember) return;

    const unsubscribe = ChatService.subscribeToTypingStatus(
      groupId,
      newTypingUsers => {
        // 현재 사용자 제외
        const filteredUsers = newTypingUsers.filter(
          typingUser => typingUser.userId !== user?.uid
        );
        setTypingUsers(filteredUsers);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [groupId, enableTyping, user?.uid, isGroupMember]);

  // 타이핑 상태 정리 (주기적)
  useEffect(() => {
    if (!groupId || !enableTyping || !isGroupMember) return;

    const cleanupInterval = setInterval(() => {
      ChatService.cleanupTypingStatus(groupId);
    }, 30000); // 30초마다 정리

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [groupId, enableTyping, isGroupMember]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (message: string, attachments?: ChatMessage['attachments']) => {
      if (!user?.uid || !message.trim() || !isGroupMember) return;

      try {
        setError(null);

        const messageData = {
          userId: user.uid,
          userName: user.displayName || user.email || '알 수 없음',
          userAvatar: user.photoURL,
          message: message.trim(),
          attachments: attachments || [],
        };

        await ChatService.sendMessage(groupId, messageData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '메시지 전송에 실패했습니다.';
        setError(errorMessage);
        logger.error('useChat', 'Failed to send message', err);
      }
    },
    [groupId, user, isGroupMember]
  );

  // 메시지 삭제
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user?.uid) return;

      try {
        setError(null);
        await ChatService.deleteMessage(groupId, messageId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '메시지 삭제에 실패했습니다.';
        setError(errorMessage);
        logger.error('useChat', 'Failed to delete message', err);
      }
    },
    [groupId, user?.uid]
  );

  // 메시지 편집
  const editMessage = useCallback(
    async (messageId: string, newMessage: string) => {
      if (!user?.uid || !newMessage.trim()) return;

      try {
        setError(null);
        await ChatService.editMessage(
          groupId,
          messageId,
          newMessage.trim(),
          user.uid
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '메시지 편집에 실패했습니다.';
        setError(errorMessage);
        logger.error('useChat', 'Failed to edit message', err);
      }
    },
    [groupId, user?.uid]
  );

  // 메시지 답장
  const replyToMessage = useCallback(
    async (replyToMessageId: string, message: string) => {
      if (!user?.uid || !message.trim()) return;

      try {
        setError(null);

        const messageData = {
          userId: user.uid,
          userName: user.displayName || user.email || '알 수 없음',
          userAvatar: user.photoURL,
          message: message.trim(),
          attachments: [],
        };

        await ChatService.replyToMessage(
          groupId,
          replyToMessageId,
          messageData
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '답장 전송에 실패했습니다.';
        setError(errorMessage);
        logger.error('useChat', 'Failed to reply to message', err);
      }
    },
    [groupId, user]
  );

  // 메시지 고정/고정 해제
  const togglePinMessage = useCallback(
    async (messageId: string) => {
      if (!user?.uid) return;

      try {
        setError(null);
        const userName = user.displayName || user.email || '알 수 없음';
        await ChatService.togglePinMessage(
          groupId,
          messageId,
          user.uid,
          userName
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '메시지 고정에 실패했습니다.';
        setError(errorMessage);
        logger.error('useChat', 'Failed to toggle message pin', err);
      }
    },
    [groupId, user]
  );

  // 메시지 검색
  const searchMessages = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return [];
      }

      try {
        setIsSearching(true);
        setError(null);

        const results = await ChatService.searchMessages(groupId, query, {
          limit: 20,
        });
        setSearchResults(results);
        return results;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '메시지 검색에 실패했습니다.';
        setError(errorMessage);
        logger.error('useChat', 'Failed to search messages', err);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [groupId]
  );

  // 메시지 읽음 처리
  const markMessageAsRead = useCallback(
    async (messageId: string) => {
      if (!user?.uid || !enableReadReceipts || !isGroupMember) return;

      try {
        await ChatService.markMessageAsRead(groupId, messageId, user.uid);
      } catch (err) {
        // 권한 오류인 경우 조용히 처리 (사용자가 그룹에서 나갔을 수 있음)
        if (err instanceof Error && err.message.includes('permission')) {
          logger.debug(
            'useChat',
            'Permission denied for markMessageAsRead - user may have left group'
          );
          return;
        }
        logger.error('useChat', 'Failed to mark message as read', err);
      }
    },
    [groupId, user?.uid, enableReadReceipts, isGroupMember]
  );

  // 메시지 권한 확인
  const getMessagePermissions = useCallback(
    async (messageId: string): Promise<MessagePermissions> => {
      if (!user?.uid) {
        return {
          canEdit: false,
          canDelete: false,
          canPin: false,
          canReact: true,
          canReply: true,
          canForward: true,
        };
      }

      try {
        return await ChatService.getMessagePermissions(
          groupId,
          messageId,
          user.uid
        );
      } catch (err) {
        logger.error('useChat', 'Failed to get message permissions', err);
        return {
          canEdit: false,
          canDelete: false,
          canPin: false,
          canReact: true,
          canReply: true,
          canForward: true,
        };
      }
    },
    [groupId, user?.uid]
  );

  // 타이핑 시작
  const startTyping = useCallback(() => {
    if (!user?.uid || !enableTyping || !isGroupMember) return;

    // 기존 타이머 정리
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // 타이핑 시작
    ChatService.startTyping(
      groupId,
      user.uid,
      user.displayName || user.email || '알 수 없음'
    );

    // 타이핑 종료 타이머 설정
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 5000); // 5초 후 자동 종료
  }, [groupId, user, enableTyping, isGroupMember]);

  // 타이핑 종료
  const stopTyping = useCallback(() => {
    if (!user?.uid || !enableTyping || !isGroupMember) return;

    // 타이머 정리
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    // 타이핑 종료 (오류는 ChatService에서 처리됨)
    ChatService.stopTyping(groupId, user.uid);
  }, [groupId, user?.uid, enableTyping, isGroupMember]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 컴포넌트 언마운트 시 타이핑 상태 정리
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return {
    // 메시지 관련
    messages,
    isLoading,
    error,

    // 타이핑 관련
    typingUsers,

    // 메시지 액션
    sendMessage,
    deleteMessage,
    editMessage,
    replyToMessage,
    togglePinMessage,

    // 검색 관련
    searchMessages,
    searchResults,
    isSearching,

    // 읽음 확인
    markMessageAsRead,

    // 권한 확인
    getMessagePermissions,

    // 타이핑 상태 관리
    startTyping,
    stopTyping,

    // 유틸리티
    clearError,
  };
}
