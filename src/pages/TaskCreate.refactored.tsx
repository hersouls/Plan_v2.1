import { Timestamp } from 'firebase/firestore';
import { Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AttachmentSection } from '../components/task/FileAttachment';
import {
  TaskBasicInfo,
  TaskCreateProps,
  TaskDateTime,
  useTaskForm,
  useTaskValidation,
} from '../components/task/form';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../contexts/AuthContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useTask } from '../hooks/useTask';
import { useTasks } from '../hooks/useTasks';
import logger from '../lib/logger';
import { CreateTaskInput, UpdateTaskInput } from '../types/task';
import { parseReminderToMinutes } from '../utils/dateHelpers';

function TaskCreateRefactored({ mode = 'create' }: TaskCreateProps) {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { user } = useAuth();
  const { createTask, updateTask } = useTasks({ realtime: false });
  const { success, error } = useToast();
  const { task: existingTask, loading: taskLoading } = useTask({
    taskId: taskId || '',
    realtime: false,
    includeComments: false,
    includeActivities: false,
  });

  // 사용자의 실제 그룹 데이터 사용
  const { groups } = useUserGroups();
  const firstGroup = groups?.[0];

  const [saving, setSaving] = useState(false);

  // 커스텀 훅 사용
  const { formData, errors, updateFormData, setErrors } = useTaskForm({
    selectedGroupId: firstGroup?.id || '',
    assigneeId: user?.uid || '',
  });

  const { validateForm } = useTaskValidation();

  // 현재 선택된 그룹의 멤버들 가져오기
  const { members: selectedGroupMembers } = useGroup({
    groupId: formData.selectedGroupId || firstGroup?.id || null,
  });

  // 그룹이 없으면 개인 할일로 자동 설정
  useEffect(() => {
    if (!firstGroup && formData.taskType === 'group') {
      updateFormData('taskType', 'personal');
      updateFormData('selectedGroupId', '');
      updateFormData('assigneeId', user?.uid || '');
    }
  }, [firstGroup, formData.taskType, user?.uid, updateFormData]);

  // 현재 선택된 그룹의 멤버들 또는 개인 할일일 때는 현재 사용자만
  const groupMembers =
    formData.taskType === 'group' && selectedGroupMembers?.length > 0
      ? selectedGroupMembers.map(member => ({
          id: member.userId,
          name:
            (member as any).displayName ||
            (member as any).userName ||
            (member as any).email ||
            'Unknown User',
          email: (member as any).email,
          avatar:
            (member as any).avatar ??
            (member as any).userAvatar ??
            (member as any).photoURL ??
            undefined,
        }))
      : [
          {
            id: user?.uid || '',
            name: user?.displayName || user?.email || '나',
            email: user?.email || '',
            avatar: user?.photoURL,
          },
        ];

  // 기존 할일 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && existingTask && !taskLoading) {
      updateFormData('title', existingTask.title);
      updateFormData('description', existingTask.description || '');
      updateFormData('priority', existingTask.priority);
      updateFormData('category', existingTask.category);
      updateFormData(
        'dueDate',
        existingTask.dueDate
          ? new Date(existingTask.dueDate.toDate()).toISOString().split('T')[0]
          : ''
      );
      updateFormData(
        'dueTime',
        existingTask.dueDate
          ? new Date(existingTask.dueDate.toDate()).toTimeString().slice(0, 5)
          : ''
      );
      updateFormData('tags', existingTask.tags || []);
      updateFormData(
        'estimatedMinutes',
        existingTask.estimatedMinutes?.toString() || ''
      );
      updateFormData('location', existingTask.location || '');
      updateFormData('attachments', existingTask.attachments || []);
      updateFormData('urls', existingTask.urls || []);

      if (existingTask.recurring) {
        updateFormData('recurring', {
          enabled: !!existingTask.recurring,
          frequency: existingTask.recurring?.frequency || 'daily',
          interval: existingTask.recurring?.interval || 1,
          endDate: existingTask.recurring?.endDate || '',
        });
      }

      if (existingTask.reminders && existingTask.reminders.length > 0) {
        // 기존 알림을 문자열 형태로 변환
        const reminderStrings = existingTask.reminders.map(reminder => {
          if (typeof reminder === 'string') {
            return reminder;
          }
          // StructuredReminder 형태인 경우
          if ('offsetMinutes' in reminder) {
            const timeMap: Record<number, string> = {
              10: '10분 전',
              30: '30분 전',
              60: '1시간 전',
              1440: '1일 전',
              10080: '1주일 전',
            };
            return (
              timeMap[reminder.offsetMinutes] ||
              `${reminder.offsetMinutes}분 전`
            );
          }
          return '10분 전'; // 기본값
        });
        updateFormData('reminders', reminderStrings);
      }
    }
  }, [mode, existingTask, taskLoading, updateFormData]);

  const handleSave = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);

    try {
      // dueDate를 Timestamp로 변환
      let dueDate: Timestamp | undefined;
      if (formData.dueDate) {
        const date = new Date(formData.dueDate);
        if (formData.dueTime) {
          const [hours, minutes] = formData.dueTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
        }
        dueDate = Timestamp.fromDate(date);
      }

      const taskData: CreateTaskInput | UpdateTaskInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
        tags: formData.tags,
        estimatedMinutes: formData.estimatedMinutes
          ? parseInt(formData.estimatedMinutes)
          : undefined,
        location: formData.location.trim(),
        attachments: formData.attachments,
        urls: formData.urls,
        reminders:
          formData.reminders.length > 0
            ? formData.reminders.map(reminder => ({
                offsetMinutes: parseReminderToMinutes(reminder),
                method: 'push' as const,
              }))
            : [],
      };

      if (dueDate) {
        taskData.dueDate = dueDate;
      }

      if (formData.recurring.enabled) {
        taskData.recurring = {
          frequency: formData.recurring.frequency,
          interval: formData.recurring.interval,
          endDate: formData.recurring.endDate || undefined,
        };
      }

      if (formData.taskType === 'group') {
        taskData.groupId = formData.selectedGroupId;
        taskData.assigneeId = formData.assigneeId;
      } else {
        taskData.groupId = 'personal';
        taskData.assigneeId = user?.uid || '';
      }

      if (mode === 'create') {
        const taskId = await createTask(taskData as CreateTaskInput);
        success('할일이 성공적으로 생성되었습니다!');
        navigate(`/tasks/${taskId}`);
      } else {
        await updateTask(taskId!, taskData as UpdateTaskInput);
        success('할일이 성공적으로 수정되었습니다!');
        navigate(`/tasks/${taskId}`);
      }
    } catch (err) {
      logger.error('TaskCreate.refactored', 'Failed to save task', err);
      error('할일 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (taskLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <Typography.H1 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === 'create' ? '새 할일 만들기' : '할일 수정하기'}
            </Typography.H1>
            <Typography.Body className="text-gray-600">
              {mode === 'create'
                ? '새로운 할일을 생성하고 관리하세요'
                : '기존 할일을 수정하세요'}
            </Typography.Body>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 폼 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 기본 정보 */}
              <GlassCard className="p-6">
                <Typography.H2 className="text-xl font-semibold mb-6">
                  기본 정보
                </Typography.H2>
                <TaskBasicInfo
                  formData={formData}
                  errors={errors}
                  onFormDataChange={updateFormData}
                />
              </GlassCard>

              {/* 날짜 및 시간 */}
              <GlassCard className="p-6">
                <TaskDateTime
                  formData={formData}
                  errors={errors}
                  onFormDataChange={updateFormData}
                />
              </GlassCard>

              {/* 파일 첨부 */}
              <GlassCard className="p-6">
                <Typography.H3 className="text-lg font-semibold mb-4">
                  파일 첨부
                </Typography.H3>
                <AttachmentSection
                  attachments={formData.attachments}
                  urls={formData.urls}
                  onAttachmentsChange={attachments =>
                    updateFormData('attachments', attachments)
                  }
                  onUrlsChange={urls => updateFormData('urls', urls)}
                />
              </GlassCard>
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 그룹 선택 */}
              <GlassCard className="p-6">
                <Typography.H3 className="text-lg font-semibold mb-4">
                  그룹 선택
                </Typography.H3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="taskType"
                        value="personal"
                        checked={formData.taskType === 'personal'}
                        onChange={e =>
                          updateFormData('taskType', e.target.value)
                        }
                        className="text-blue-600"
                      />
                      <span>개인 할일</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="taskType"
                        value="group"
                        checked={formData.taskType === 'group'}
                        onChange={e =>
                          updateFormData('taskType', e.target.value)
                        }
                        className="text-blue-600"
                        disabled={!groups || groups.length === 0}
                      />
                      <span>그룹 할일</span>
                    </label>
                  </div>

                  {formData.taskType === 'group' &&
                    groups &&
                    groups.length > 0 && (
                      <div>
                        <Typography.Label className="block mb-2">
                          그룹 선택
                        </Typography.Label>
                        <select
                          value={formData.selectedGroupId}
                          onChange={e =>
                            updateFormData('selectedGroupId', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">그룹을 선택하세요</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        {errors.selectedGroupId && (
                          <Typography.Small className="text-red-500 mt-1">
                            {errors.selectedGroupId}
                          </Typography.Small>
                        )}
                      </div>
                    )}

                  {formData.taskType === 'group' &&
                    formData.selectedGroupId && (
                      <div>
                        <Typography.Label className="block mb-2">
                          담당자
                        </Typography.Label>
                        <select
                          value={formData.assigneeId}
                          onChange={e =>
                            updateFormData('assigneeId', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">담당자를 선택하세요</option>
                          {groupMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        {errors.assigneeId && (
                          <Typography.Small className="text-red-500 mt-1">
                            {errors.assigneeId}
                          </Typography.Small>
                        )}
                      </div>
                    )}
                </div>
              </GlassCard>

              {/* 액션 버튼 */}
              <div className="flex flex-col space-y-3">
                <WaveButton
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {mode === 'create' ? '할일 생성' : '할일 수정'}
                    </>
                  )}
                </WaveButton>

                <WaveButton
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </WaveButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskCreateRefactored;
