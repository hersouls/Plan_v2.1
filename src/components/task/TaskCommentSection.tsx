import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/components/ui/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Comment, useComments } from '@/hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  AtSign,
  Check,
  Edit,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Smile,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { MentionInput } from './MentionInput';

interface TaskCommentSectionProps {
  taskId: string;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  replyToId?: string;
  level?: number;
}

const EMOJI_REACTIONS = [
  { emoji: '👍', label: '좋아요', icon: ThumbsUp },
  { emoji: '❤️', label: '하트', icon: Heart },
  { emoji: '👏', label: '박수', icon: Check },
  { emoji: '😊', label: '웃음', icon: Smile },
  { emoji: '🎉', label: '축하', icon: Check },
];

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  replyToId,
  level = 0,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReactions, setShowReactions] = useState(false);
  const isOwner = user?.uid === comment.userId;

  const handleEdit = useCallback(() => {
    if (editContent.trim() !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  }, [comment.id, comment.content, editContent, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(false);
  }, [comment.content]);

  const handleReaction = useCallback(
    (emoji: string) => {
      onReaction(comment.id, emoji);
      setShowReactions(false);
    },
    [comment.id, onReaction]
  );

  const reactionCount = Object.values(comment.reactions || {}).reduce(
    (total, users) => total + users.length,
    0
  );

  const userReactions = Object.entries(comment.reactions || {}).filter(
    ([_, users]) => users.includes(user?.uid || '')
  );

  return (
    <div
      className={cn(
        'space-y-3',
        level > 0 && 'ml-8 border-l-2 border-gray-200 pl-4'
      )}
    >
      <GlassCard className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.userAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {comment.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Typography variant="sm" className="font-medium text-gray-900">
                {comment.userName}
              </Typography>
              <Typography variant="xs" className="text-gray-500">
                {formatDistanceToNow(comment.createdAt.toDate(), {
                  addSuffix: true,
                  locale: ko,
                })}
              </Typography>
              {comment.isEdited && (
                <Badge variant="secondary" className="text-xs">
                  수정됨
                </Badge>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <MentionInput
                  value={editContent}
                  onChange={setEditContent}
                  className="min-h-[80px]"
                  placeholder="댓글을 수정하세요..."
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleEdit}>
                    <Check className="w-4 h-4 mr-1" />
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Typography
                  variant="sm"
                  className="text-gray-800 whitespace-pre-wrap"
                >
                  {comment.content.split(' ').map((word, index) => {
                    if (word.startsWith('@')) {
                      return (
                        <span key={index} className="text-blue-600 font-medium">
                          {word}{' '}
                        </span>
                      );
                    }
                    return word + ' ';
                  })}
                </Typography>

                {/* Reactions */}
                <div className="flex items-center space-x-2">
                  {userReactions.map(([emoji, users]) => (
                    <Badge
                      key={emoji}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji} {users.length}
                    </Badge>
                  ))}

                  <Popover open={showReactions} onOpenChange={setShowReactions}>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 px-2">
                        <Smile className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="flex space-x-1">
                        {EMOJI_REACTIONS.map(({ emoji, label, icon: Icon }) => (
                          <Button
                            key={emoji}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleReaction(emoji)}
                            title={label}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => onReply(comment.id)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    답글
                  </Button>

                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export const TaskCommentSection: React.FC<TaskCommentSectionProps> = ({
  taskId,
  className,
}) => {
  const { user } = useAuth();
  const { currentGroup, groupMembers } = useData();
  const { comments, loading, error, addComment, updateComment, deleteComment } =
    useComments({
      taskId,
      realtime: true,
    });

  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // 멘션된 사용자 추출
      const mentionRegex = /@(\w+)/g;
      const mentions: string[] = [];
      let match;

      while ((match = mentionRegex.exec(commentText)) !== null) {
        const mentionedName = match[1];
        // 그룹 멤버에서 이름으로 ID 찾기
        const mentionedUser = groupMembers?.find(
          member =>
            member.displayName === mentionedName ||
            member.email === mentionedName
        );
        if (mentionedUser) {
          mentions.push(mentionedUser.id);
        }
      }

      await addComment({
        taskId,
        content: commentText.trim(),
        parentId: replyToId || undefined,
        mentions: mentions,
      });
      setCommentText('');
      setReplyToId(null);
    } catch (error) {
      console.error('댓글 추가 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, user, taskId, replyToId, addComment, groupMembers]);

  const handleReply = useCallback((commentId: string) => {
    setReplyToId(commentId);
    textareaRef.current?.focus();
  }, []);

  const handleEdit = useCallback(
    async (commentId: string, content: string) => {
      try {
        await updateComment(commentId, { content });
      } catch (error) {
        console.error('댓글 수정 실패:', error);
      }
    },
    [updateComment]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!confirm('댓글을 삭제하시겠습니까?')) return;

      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
    },
    [deleteComment]
  );

  const handleReaction = useCallback(
    async (commentId: string, emoji: string) => {
      try {
        const comment = comments.find(c => c.id === commentId);
        if (!comment) return;

        const currentReactions = comment.reactions || {};
        const currentUsers = currentReactions[emoji] || [];
        const userId = user?.uid;

        if (!userId) return;

        const newUsers = currentUsers.includes(userId)
          ? currentUsers.filter(id => id !== userId)
          : [...currentUsers, userId];

        const newReactions = {
          ...currentReactions,
          [emoji]: newUsers,
        };

        await updateComment(commentId, { reactions: newReactions });
      } catch (error) {
        console.error('반응 추가 실패:', error);
      }
    },
    [comments, user?.uid, updateComment]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment]
  );

  const cancelReply = useCallback(() => {
    setReplyToId(null);
  }, []);

  // 댓글을 계층 구조로 정리
  const commentTree = comments.reduce((acc, comment) => {
    if (!comment.parentId) {
      acc.push({
        ...comment,
        replies: comments.filter(c => c.parentId === comment.id),
      });
    }
    return acc;
  }, [] as (Comment & { replies: Comment[] })[]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Typography variant="lg" className="font-semibold">
          댓글
        </Typography>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        <Typography variant="lg" className="font-semibold">
          댓글 {comments.length}개
        </Typography>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <Typography variant="sm" className="text-red-600">
            댓글을 불러오는 중 오류가 발생했습니다.
          </Typography>
        </div>
      )}

      {/* 댓글 작성 폼 */}
      <GlassCard className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder={
                  replyToId ? '답글을 입력하세요...' : '댓글을 입력하세요...'
                }
                onKeyDown={handleKeyDown}
                className="min-h-[80px]"
              />
              {replyToId && (
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    답글 작성 중
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={cancelReply}>
                    <X className="w-4 h-4 mr-1" />
                    취소
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" className="h-8 px-2">
                <AtSign className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {commentTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <Typography variant="sm">
              아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
            </Typography>
          </div>
        ) : (
          commentTree.map(comment => (
            <div key={comment.id} className="space-y-3">
              <CommentItem
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReaction={handleReaction}
                level={0}
              />
              {/* 답글들 */}
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReaction={handleReaction}
                  level={1}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
