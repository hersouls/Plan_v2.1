import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type {
  ChatMessage,
  ChatSearchResult,
  ChatStats,
  MessagePermissions,
  TypingStatus,
} from '../types/chat';
import { db } from './firebase';
import logger from './logger';

export class ChatService {
  private static readonly TYPING_TIMEOUT = 5000; // 5초
  private static readonly TYPING_CLEANUP_INTERVAL = 30000; // 30초

  /**
   * 메시지 전송
   */
  static async sendMessage(
    groupId: string,
    messageData: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      const chatRef = collection(db, 'groups', groupId, 'chat');
      const messageWithTimestamp = {
        ...messageData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(chatRef, messageWithTimestamp);
      logger.info('ChatService', 'Message sent successfully', {
        messageId: docRef.id,
      });

      return docRef.id;
    } catch (error) {
      logger.error('ChatService', 'Failed to send message', error);
      throw error;
    }
  }

  /**
   * 메시지 구독 (실시간)
   */
  static subscribeToMessages(
    groupId: string,
    callback: (messages: ChatMessage[]) => void,
    options: { limit?: number } = {}
  ) {
    const { limit: limitCount = 100 } = options;

    const chatRef = collection(db, 'groups', groupId, 'chat');
    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(limitCount));

    return onSnapshot(
      q,
      snapshot => {
        const messages: ChatMessage[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
          } as ChatMessage);
        });

        // 최신 메시지가 아래에 오도록 역순 정렬
        messages.reverse();
        callback(messages);
      },
      error => {
        logger.error('ChatService', 'Error in message subscription', error);
        callback([]);
      }
    );
  }

  /**
   * 타이핑 상태 시작
   */
  static async startTyping(
    groupId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const typingRef = doc(db, 'groups', groupId, 'typing', userId);
      await setDoc(typingRef, {
        userId,
        userName,
        isTyping: true,
        startedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      });
    } catch (error) {
      logger.error('ChatService', 'Failed to start typing', error);
    }
  }

  /**
   * 타이핑 상태 종료
   */
  static async stopTyping(groupId: string, userId: string): Promise<void> {
    try {
      const typingRef = doc(db, 'groups', groupId, 'typing', userId);
      await deleteDoc(typingRef);
    } catch (error) {
      // 권한 오류인 경우 조용히 처리 (사용자가 그룹에서 나갔을 수 있음)
      if (error instanceof Error && error.message.includes('permission')) {
        logger.debug(
          'ChatService',
          'Permission denied for stopTyping - user may have left group'
        );
        return;
      }
      logger.error('ChatService', 'Failed to stop typing', error);
    }
  }

  /**
   * 타이핑 상태 구독
   */
  static subscribeToTypingStatus(
    groupId: string,
    callback: (typingUsers: TypingStatus[]) => void
  ) {
    const typingRef = collection(db, 'groups', groupId, 'typing');
    const q = query(typingRef, orderBy('lastActivity', 'desc'));

    return onSnapshot(
      q,
      snapshot => {
        const typingUsers: TypingStatus[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          typingUsers.push({
            ...data,
          } as TypingStatus);
        });
        callback(typingUsers);
      },
      error => {
        // 권한 오류인 경우 조용히 처리 (사용자가 그룹에서 나갔을 수 있음)
        if (error instanceof Error && error.message.includes('permission')) {
          logger.debug(
            'ChatService',
            'Permission denied for typing subscription - user may have left group'
          );
          callback([]);
          return;
        }
        logger.error('ChatService', 'Error in typing subscription', error);
        callback([]);
      }
    );
  }

  /**
   * 메시지 읽음 처리
   */
  static async markMessageAsRead(
    groupId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'chat', messageId);
      const readRef = doc(messageRef, 'reads', userId);

      await setDoc(readRef, {
        userId,
        readAt: serverTimestamp(),
        readCount: 1,
      });

      // 메시지 문서의 readBy 필드도 업데이트
      await updateDoc(messageRef, {
        [`readBy.${userId}`]: {
          readAt: serverTimestamp(),
          readCount: 1,
        },
      });
    } catch (error) {
      // 권한 오류인 경우 조용히 처리 (사용자가 그룹에서 나갔을 수 있음)
      if (error instanceof Error && error.message.includes('permission')) {
        logger.debug(
          'ChatService',
          'Permission denied for markMessageAsRead - user may have left group'
        );
        return;
      }
      logger.error('ChatService', 'Failed to mark message as read', error);
    }
  }

  /**
   * 메시지 검색
   */
  static async searchMessages(
    groupId: string,
    searchQuery: string,
    options: { limit?: number } = {}
  ): Promise<ChatSearchResult[]> {
    try {
      const { limit: limitCount = 20 } = options;

      if (!searchQuery.trim()) {
        return [];
      }

      const chatRef = collection(db, 'groups', groupId, 'chat');

      // Firestore의 기본 검색은 제한적이므로 클라이언트 사이드 필터링 사용
      const q = query(
        chatRef,
        orderBy('timestamp', 'desc'),
        limit(100) // 검색 범위를 넓게
      );

      const snapshot = await getDocs(q);
      const results: ChatSearchResult[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const message = data.message || '';

        if (message.toLowerCase().includes(searchQuery.toLowerCase())) {
          const highlightIndices = this.findHighlightIndices(
            message,
            searchQuery
          );

          results.push({
            messageId: doc.id,
            groupId,
            userId: data.userId,
            userName: data.userName,
            message,
            timestamp: data.timestamp,
            highlightIndices,
            relevance: this.calculateRelevance(message, searchQuery),
          });
        }
      });

      // 관련도 순으로 정렬
      results.sort((a, b) => b.relevance - a.relevance);

      return results.slice(0, limitCount);
    } catch (error) {
      logger.error('ChatService', 'Failed to search messages', error);
      return [];
    }
  }

  /**
   * 메시지 답장
   */
  static async replyToMessage(
    groupId: string,
    replyToMessageId: string,
    messageData: Omit<ChatMessage, 'id' | 'timestamp' | 'replyTo'>
  ): Promise<string> {
    try {
      // 원본 메시지 정보 가져오기
      const originalMessageRef = doc(
        db,
        'groups',
        groupId,
        'chat',
        replyToMessageId
      );
      const originalMessageDoc = await getDoc(originalMessageRef);

      if (!originalMessageDoc.exists()) {
        throw new Error('Original message not found');
      }

      const originalMessage = originalMessageDoc.data() as ChatMessage;

      // 답장 메시지 생성
      const replyMessageData = {
        ...messageData,
        replyTo: {
          messageId: replyToMessageId,
          userName: originalMessage.userName,
          message: originalMessage.message.substring(0, 100), // 미리보기용
        },
      };

      const messageId = await this.sendMessage(groupId, replyMessageData);

      // 원본 메시지의 threadCount 업데이트
      await updateDoc(originalMessageRef, {
        threadCount: (originalMessage.threadCount || 0) + 1,
      });

      return messageId;
    } catch (error) {
      logger.error('ChatService', 'Failed to reply to message', error);
      throw error;
    }
  }

  /**
   * 메시지 고정/고정 해제
   */
  static async togglePinMessage(
    groupId: string,
    messageId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'chat', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data() as ChatMessage;
      const isCurrentlyPinned = message.isPinned || false;

      await updateDoc(messageRef, {
        isPinned: !isCurrentlyPinned,
        pinnedBy: !isCurrentlyPinned ? userId : null,
        pinnedAt: !isCurrentlyPinned ? serverTimestamp() : null,
      });

      logger.info('ChatService', 'Message pin toggled', {
        messageId,
        isPinned: !isCurrentlyPinned,
      });
    } catch (error) {
      logger.error('ChatService', 'Failed to toggle message pin', error);
      throw error;
    }
  }

  /**
   * 고정된 메시지 가져오기
   */
  static async getPinnedMessages(groupId: string): Promise<ChatMessage[]> {
    try {
      const chatRef = collection(db, 'groups', groupId, 'chat');
      const q = query(
        chatRef,
        where('isPinned', '==', true),
        orderBy('pinnedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const pinnedMessages: ChatMessage[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        pinnedMessages.push({
          id: doc.id,
          ...data,
        } as ChatMessage);
      });

      return pinnedMessages;
    } catch (error) {
      logger.error('ChatService', 'Failed to get pinned messages', error);
      return [];
    }
  }

  /**
   * 메시지 삭제
   */
  static async deleteMessage(
    groupId: string,
    messageId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'chat', messageId);
      await deleteDoc(messageRef);

      logger.info('ChatService', 'Message deleted', { messageId });
    } catch (error) {
      logger.error('ChatService', 'Failed to delete message', error);
      throw error;
    }
  }

  /**
   * 메시지 편집
   */
  static async editMessage(
    groupId: string,
    messageId: string,
    newMessage: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'chat', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data() as ChatMessage;

      // 편집 권한 확인
      if (message.userId !== userId) {
        throw new Error('Permission denied: Only message author can edit');
      }

      // 편집 히스토리 업데이트
      const editHistory = message.editHistory || [];
      editHistory.push({
        message: message.message,
        editedAt: serverTimestamp() as any,
      });

      await updateDoc(messageRef, {
        message: newMessage,
        isEdited: true,
        editedAt: serverTimestamp(),
        editHistory,
        updatedAt: serverTimestamp(),
      });

      logger.info('ChatService', 'Message edited', { messageId });
    } catch (error) {
      logger.error('ChatService', 'Failed to edit message', error);
      throw error;
    }
  }

  /**
   * 메시지 권한 확인
   */
  static async getMessagePermissions(
    groupId: string,
    messageId: string,
    userId: string
  ): Promise<MessagePermissions> {
    try {
      const messageRef = doc(db, 'groups', groupId, 'chat', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        return {
          canEdit: false,
          canDelete: false,
          canPin: false,
          canReact: true,
          canReply: true,
          canForward: true,
        };
      }

      const message = messageDoc.data() as ChatMessage;
      const isAuthor = message.userId === userId;

      return {
        canEdit: isAuthor,
        canDelete: isAuthor,
        canPin: true, // 모든 사용자가 고정 가능
        canReact: true,
        canReply: true,
        canForward: true,
      };
    } catch (error) {
      logger.error('ChatService', 'Failed to get message permissions', error);
      return {
        canEdit: false,
        canDelete: false,
        canPin: false,
        canReact: true,
        canReply: true,
        canForward: true,
      };
    }
  }

  /**
   * 채팅 통계 가져오기
   */
  static async getChatStats(groupId: string): Promise<ChatStats | null> {
    try {
      const statsRef = doc(db, 'groups', groupId, 'stats', 'chat');
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        return statsDoc.data() as ChatStats;
      }

      return null;
    } catch (error) {
      logger.error('ChatService', 'Failed to get chat stats', error);
      return null;
    }
  }

  // 헬퍼 메서드들
  private static findHighlightIndices(
    text: string,
    searchQuery: string
  ): number[] {
    const indices: number[] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    let index = 0;

    while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
      indices.push(index);
      index += 1;
    }

    return indices;
  }

  private static calculateRelevance(text: string, searchQuery: string): number {
    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();

    // 정확한 일치
    if (lowerText === lowerQuery) return 100;

    // 시작 부분 일치
    if (lowerText.startsWith(lowerQuery)) return 90;

    // 단어 경계에서 일치
    const wordBoundaryRegex = new RegExp(`\\b${lowerQuery}`, 'i');
    if (wordBoundaryRegex.test(lowerText)) return 80;

    // 부분 일치
    if (lowerText.includes(lowerQuery)) return 70;

    return 0;
  }

  /**
   * 타이핑 상태 정리 (주기적으로 실행)
   */
  static async cleanupTypingStatus(groupId: string): Promise<void> {
    try {
      const typingRef = collection(db, 'groups', groupId, 'typing');
      const snapshot = await getDocs(typingRef);

      const batch = writeBatch(db);
      const now = new Date();

      snapshot.forEach(doc => {
        const data = doc.data() as TypingStatus;
        const lastActivity = data.lastActivity?.toDate?.() || new Date();
        const timeDiff = now.getTime() - lastActivity.getTime();

        if (timeDiff > this.TYPING_TIMEOUT) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
    } catch (error) {
      logger.error('ChatService', 'Failed to cleanup typing status', error);
    }
  }
}
