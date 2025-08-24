import { Timestamp } from 'firebase/firestore';

// 기본 채팅 메시지 인터페이스
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Timestamp | null;
  attachments?: Array<{
    type: 'image' | 'file' | 'video';
    url: string;
    name: string;
    size?: number;
  }>;
  
  // Phase 1 추가 필드들
  replyTo?: {
    messageId: string;
    userName: string;
    message: string;
  };
  threadId?: string;
  threadCount?: number;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: Timestamp;
  readBy?: {
    [userId: string]: {
      readAt: Timestamp;
      readCount: number;
    };
  };
  reactions?: {
    [emoji: string]: string[]; // emoji -> [userId...]
  };
  isEdited?: boolean;
  editedAt?: Timestamp;
  editHistory?: Array<{
    message: string;
    editedAt: Timestamp;
  }>;
}

// 타이핑 상태 인터페이스
export interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
  startedAt: Timestamp;
  lastActivity: Timestamp;
}

// 그룹 채팅 설정
export interface GroupChatSettings {
  groupId: string;
  allowFileUploads: boolean;
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  enableReactions: boolean;
  enableThreading: boolean;
  enablePinning: boolean;
  enableReadReceipts: boolean;
  autoDeleteAfter?: number; // days, null for never
  slowMode?: number; // seconds between messages
}

// 채팅 알림 설정
export interface ChatNotificationSettings {
  userId: string;
  groupId: string;
  mentionNotifications: boolean;
  messageNotifications: boolean;
  typingNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

// 메시지 검색 결과
export interface ChatSearchResult {
  messageId: string;
  groupId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Timestamp;
  highlightIndices: number[]; // 검색어가 포함된 위치
  relevance: number; // 검색 관련도 점수
}

// 채팅 통계
export interface ChatStats {
  groupId: string;
  totalMessages: number;
  totalAttachments: number;
  activeUsers: number;
  averageResponseTime: number; // milliseconds
  peakActivityHour: number; // 0-23
  mostActiveUser: string;
  messageTypes: {
    text: number;
    image: number;
    file: number;
    video: number;
  };
  lastUpdated: Timestamp;
}

// 메시지 액션 타입
export type MessageAction = 
  | 'reply'
  | 'edit'
  | 'delete'
  | 'pin'
  | 'unpin'
  | 'react'
  | 'forward'
  | 'copy';

// 메시지 권한
export interface MessagePermissions {
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  canReact: boolean;
  canReply: boolean;
  canForward: boolean;
}
