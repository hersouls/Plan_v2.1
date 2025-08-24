import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { WaveButton } from '@/components/ui/WaveButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/components/ui/utils';
import { StorageService } from '@/lib/storage';
import { FileAttachment, Task, TaskActivity, TaskComment } from '@/types/task';
import { toDate } from '@/utils/dateHelpers';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  CheckCircle2,
  Edit,
  File,
  Info,
  MessageSquare,
  Send,
  Smile,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { AttachmentSection } from './FileAttachment';

interface TaskDetailProps {
  task: Task;
  comments: TaskComment[];
  activities: TaskActivity[];
  onAddComment: (
    taskId: string,
    content: string,
    attachments?: FileAttachment[]
  ) => void;
  onDeleteComment: (commentId: string) => void;
  onAddReaction: (commentId: string, emoji: string) => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  created: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  updated: <Edit className="h-4 w-4 text-blue-400" />,
  completed: <CheckCircle2 className="h-4 w-4 text-purple-400" />,
  commented: <MessageSquare className="h-4 w-4 text-gray-400" />,
  assigned: <CheckCircle2 className="h-4 w-4 text-amber-400" />,
  due_date_changed: <CheckCircle2 className="h-4 w-4 text-red-400" />,
};

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  comments,
  activities,
  onAddComment,
  onDeleteComment,
  onAddReaction,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}) => {
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const handleSubmitComment = () => {
    if (commentText.trim() || attachments.length > 0) {
      onAddComment(task.id, commentText, attachments);
      setCommentText('');
      setAttachments([]);
    }
  };

  const handleFileDownload = async (file: FileAttachment) => {
    try {
      const blob = await StorageService.downloadFile(file);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('task', 'File download failed', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleFileRemove = (fileId: string) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const formatActivityMessage = (activity: TaskActivity): string => {
    switch (activity.action) {
      case 'created':
        return '할일을 생성했습니다';
      case 'updated':
        return '할일을 수정했습니다';
      case 'completed':
        return '할일을 완료했습니다';
      case 'commented':
        return '댓글을 추가했습니다';
      case 'assigned':
        return `${
          activity.details?.assigneeName || '누군가'
        }님에게 할일을 할당했습니다`;
      case 'due_date_changed':
        return `마감일을 ${activity.details?.newDate || '변경'}로 변경했습니다`;
      default:
        return '활동을 수행했습니다';
    }
  };

  const emojis = ['👍', '❤️', '😄', '🎉', '👏', '🔥', '💯', '✨'];

  // 기본 활동 내역 생성 (태스크 생성 정보)
  const defaultActivities = [
    {
      id: 'default-created',
      taskId: task.id,
      userId: task.userId,
      userName: '시스템',
      action: 'created' as const,
      entityType: 'task' as const,
      entityId: task.id,
      details: {},
      metadata: {},
      createdAt: task.createdAt,
    },
  ];

  // 실제 활동 내역과 기본 활동 내역 결합
  const allActivities = [...defaultActivities, ...activities];

  return (
    <div className="space-y-6">
      {/* Comments and Activity Container */}
      <div className="p-6 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
        {/* Tabs */}
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
            <TabsTrigger
              value="comments"
              className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
            >
              <MessageSquare className="h-4 w-4" />
              댓글 ({comments.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
            >
              <Info className="h-4 w-4" />
              활동 내역 ({allActivities.length})
            </TabsTrigger>
          </TabsList>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <div className="space-y-4">
              {/* Comment Input Container */}
              <div className="p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUserAvatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {currentUserName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="댓글을 입력하세요..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        className="min-h-[80px] bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20 rounded-lg shadow-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleSubmitComment();
                          }
                        }}
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <AttachmentSection
                            attachments={attachments}
                            urls={[]}
                            onAttachmentsChange={setAttachments}
                            onUrlsChange={() => {}}
                            disabled={
                              !commentText.trim() && attachments.length === 0
                            }
                          />
                          <span className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-lg">
                            Ctrl+Enter로 전송
                          </span>
                        </div>
                        <WaveButton
                          onClick={handleSubmitComment}
                          disabled={
                            !commentText.trim() && attachments.length === 0
                          }
                          variant="primary"
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          전송
                        </WaveButton>
                      </div>

                      {/* File Attachments Preview */}
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500 font-medium">
                            첨부된 파일:
                          </p>
                          {attachments.map(file => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg"
                            >
                              <File className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700 flex-1">
                                {file.fileName}
                              </span>
                              <WaveButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileDownload(file)}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                다운로드
                              </WaveButton>
                              <WaveButton
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileRemove(file.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </WaveButton>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List Container */}
              <div className="p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-600">아직 댓글이 없습니다.</p>
                        <p className="text-sm text-gray-500">
                          첫 번째 댓글을 작성해보세요!
                        </p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <div
                          key={comment.id}
                          className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.userAvatar || undefined}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {comment.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.userName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {comment.createdAt
                                  ? format(
                                      toDate(comment.createdAt),
                                      'M월 d일 HH:mm',
                                      { locale: ko }
                                    )
                                  : '시간 정보 없음'}
                              </span>
                              {comment.userId === currentUserId && (
                                <WaveButton
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => onDeleteComment(comment.id)}
                                >
                                  삭제
                                </WaveButton>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-700">
                              {comment.content}
                            </p>

                            {/* File Attachments */}
                            {comment.attachments &&
                              comment.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {comment.attachments.map(file => (
                                    <div
                                      key={file.id}
                                      className="flex items-center gap-2 p-2 bg-white/10 rounded-lg"
                                    >
                                      <File className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-700 flex-1">
                                        {file.fileName}
                                      </span>
                                      <WaveButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleFileDownload(file)}
                                        className="text-blue-500 hover:text-blue-600"
                                      >
                                        다운로드
                                      </WaveButton>
                                      {comment.userId === currentUserId && (
                                        <WaveButton
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            // TODO: Implement file removal from comment
                                            logger.info(
                                              'task',
                                              'Remove file from comment',
                                              file.id
                                            );
                                          }}
                                          className="text-red-500 hover:text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </WaveButton>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* Reactions */}
                            <div className="mt-2 flex items-center gap-1">
                              {comment.reactions &&
                                Object.entries(comment.reactions).map(
                                  ([emoji, userIds]) => (
                                    <WaveButton
                                      key={emoji}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        onAddReaction(comment.id, emoji)
                                      }
                                      className={cn(
                                        'px-2 py-1 rounded-full text-xs flex items-center gap-1',
                                        userIds.includes(currentUserId)
                                          ? 'text-purple-600 bg-purple-100'
                                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                      )}
                                    >
                                      <span>{emoji}</span>
                                      <span>{userIds.length}</span>
                                    </WaveButton>
                                  )
                                )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <WaveButton
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  >
                                    <Smile className="h-3 w-3" />
                                  </WaveButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-2 bg-white border border-gray-200 shadow-lg rounded-lg">
                                  <div className="grid grid-cols-4 gap-1">
                                    {emojis.map(emoji => (
                                      <WaveButton
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          onAddReaction(comment.id, emoji)
                                        }
                                        className="p-2 rounded hover:bg-gray-100"
                                      >
                                        {emoji}
                                      </WaveButton>
                                    ))}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <div className="p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {allActivities.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">활동 내역이 없습니다.</p>
                    </div>
                  ) : (
                    allActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="mt-1">
                          {activityIcons[activity.action]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {activity.userName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {activity.createdAt
                                ? format(
                                    toDate(activity.createdAt),
                                    'M월 d일 HH:mm',
                                    { locale: ko }
                                  )
                                : '시간 정보 없음'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {formatActivityMessage(activity)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TaskDetail;
