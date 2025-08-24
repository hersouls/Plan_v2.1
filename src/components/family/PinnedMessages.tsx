import { Pin } from 'lucide-react';
import { useEffect, useState } from 'react';
import logger from '../../lib/logger';
import { cn } from '../../lib/utils';
import { Typography } from '../ui/typography';
import { ChatService } from '../../lib/chatService';
import type { ChatMessage } from '../../types/chat';

interface PinnedMessagesProps {
  groupId: string;
  onMessageClick: (messageId: string) => void;
  className?: string;
}

export function PinnedMessages({
  groupId,
  onMessageClick,
  className,
}: PinnedMessagesProps) {
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadPinnedMessages = async () => {
      try {
        setIsLoading(true);
        const messages = await ChatService.getPinnedMessages(groupId);
        setPinnedMessages(messages);
      } catch (error) {
        logger.error('PinnedMessages', 'Failed to load pinned messages', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPinnedMessages();
  }, [groupId]);

  if (isLoading) {
    return (
      <div className={cn('p-3 bg-white/5 rounded-lg border border-white/10', className)}>
        <Typography.Caption className="text-white/60">
          고정된 메시지를 불러오는 중...
        </Typography.Caption>
      </div>
    );
  }

  if (pinnedMessages.length === 0) {
    return null;
  }

  const displayedMessages = isExpanded ? pinnedMessages : pinnedMessages.slice(0, 2);

  return (
    <div className={cn('bg-white/5 rounded-lg border border-white/10 overflow-hidden', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-yellow-400" />
          <Typography.Caption className="text-white/80 font-semibold">
            고정된 메시지 ({pinnedMessages.length})
          </Typography.Caption>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/60 hover:text-white/80 transition-colors"
        >
          <Typography.Caption>
            {isExpanded ? '접기' : '더보기'}
          </Typography.Caption>
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="max-h-64 overflow-y-auto">
        {displayedMessages.map((message) => (
          <div
            key={message.id}
            className="p-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => onMessageClick(message.id)}
          >
            {/* 사용자 정보 */}
            <div className="flex items-center justify-between mb-1">
              <Typography.Caption className="text-white/80 font-semibold">
                {message.userName}
              </Typography.Caption>
              <Typography.Caption className="text-white/50 text-xs">
                {formatTime(message.timestamp)}
              </Typography.Caption>
            </div>

            {/* 메시지 내용 */}
            <Typography.Body className="text-white/90 text-sm leading-relaxed line-clamp-2">
              {message.message}
            </Typography.Body>

            {/* 답장 정보 */}
            {message.replyTo && (
              <div className="mt-2 p-2 bg-white/10 rounded border-l-2 border-blue-400">
                <Typography.Caption className="text-white/60 text-xs">
                  {message.replyTo.userName}님에게 답장
                </Typography.Caption>
                <Typography.Caption className="text-white/80 text-xs block mt-1 line-clamp-1">
                  {message.replyTo.message}
                </Typography.Caption>
              </div>
            )}

            {/* 첨부파일 정보 */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <Typography.Caption className="text-white/50 text-xs">
                  📎 {message.attachments.length}개 첨부
                </Typography.Caption>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 더보기 버튼 */}
      {pinnedMessages.length > 2 && !isExpanded && (
        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-center py-1 text-white/60 hover:text-white/80 transition-colors"
          >
            <Typography.Caption>
              +{pinnedMessages.length - 2}개 더 보기
            </Typography.Caption>
          </button>
        </div>
      )}
    </div>
  );
}

// 시간 포맷팅 헬퍼 함수
function formatTime(timestamp: Date | string | { toDate: () => Date } | null): string {
  if (!timestamp) return '';
  
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof (timestamp as { toDate: unknown }).toDate === 'function') {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else {
    date = new Date(timestamp as string);
  }
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
}
