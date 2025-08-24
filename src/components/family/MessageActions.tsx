import {
  Reply,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Copy,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { useState } from 'react';
import logger from '../../lib/logger';
import { cn } from '../../lib/utils';
import { Typography } from '../ui/typography';
import type { ChatMessage, MessagePermissions } from '../../types/chat';

interface MessageActionsProps {
  message: ChatMessage;
  permissions: MessagePermissions;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string, newMessage: string) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onCopy: (message: string) => void;
  className?: string;
}

export function MessageActions({
  message,
  permissions,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onCopy,
  className,
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(message.message);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = async () => {
    if (!editMessage.trim() || editMessage === message.message) {
      setIsEditing(false);
      return;
    }

    try {
      await onEdit(message.id, editMessage);
      setIsEditing(false);
    } catch (error) {
      logger.error('MessageActions', 'Failed to edit message', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(message.id);
    } catch (error) {
      logger.error('MessageActions', 'Failed to delete message', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = async () => {
    try {
      await onPin(message.id);
    } catch (error) {
      logger.error('MessageActions', 'Failed to pin message', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.message);
    onCopy(message.message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditMessage(message.message);
    }
  };

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        <textarea
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
          rows={Math.min(3, editMessage.split('\n').length)}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs transition-colors"
          >
            <Check className="w-3 h-3" />
            저장
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditMessage(message.message);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 rounded text-white text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* 액션 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-white/10 rounded transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-white/70" />
      </button>

      {/* 액션 메뉴 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white/95 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl z-50 min-w-32">
          <div className="py-1">
            {/* 답장 */}
            {permissions.canReply && (
              <button
                onClick={() => {
                  onReply(message.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/20 transition-colors text-sm"
              >
                <Reply className="w-4 h-4" />
                <Typography.Caption>답장</Typography.Caption>
              </button>
            )}

            {/* 편집 */}
            {permissions.canEdit && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/20 transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                <Typography.Caption>편집</Typography.Caption>
              </button>
            )}

            {/* 고정/고정 해제 */}
            {permissions.canPin && (
              <button
                onClick={() => {
                  handlePin();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/20 transition-colors text-sm"
              >
                {message.isPinned ? (
                  <>
                    <PinOff className="w-4 h-4" />
                    <Typography.Caption>고정 해제</Typography.Caption>
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4" />
                    <Typography.Caption>고정</Typography.Caption>
                  </>
                )}
              </button>
            )}

            {/* 복사 */}
            <button
              onClick={() => {
                handleCopy();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/20 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              <Typography.Caption>복사</Typography.Caption>
            </button>

            {/* 삭제 */}
            {permissions.canDelete && (
              <button
                onClick={() => {
                  handleDelete();
                  setIsOpen(false);
                }}
                disabled={isDeleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-500/20 transition-colors text-sm text-red-500 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <Typography.Caption>
                  {isDeleting ? '삭제 중...' : '삭제'}
                </Typography.Caption>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 편집 표시 */}
      {message.isEdited && (
        <div className="absolute -top-6 left-0">
          <Typography.Caption className="text-white/50 text-xs">
            편집됨
          </Typography.Caption>
        </div>
      )}

      {/* 고정 표시 */}
      {message.isPinned && (
        <div className="absolute -top-6 right-0">
          <div className="flex items-center gap-1">
            <Pin className="w-3 h-3 text-yellow-400" />
            <Typography.Caption className="text-yellow-400 text-xs">
              고정됨
            </Typography.Caption>
          </div>
        </div>
      )}
    </div>
  );
}
