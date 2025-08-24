import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Briefcase,
  Calendar,
  Check,
  Clock,
  FileText,
  Flag,
  Home,
  MapPin,
  RepeatIcon,
  Save,
  ShoppingCart,
  Tag,
  User,
  UserIcon,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSettingsContext } from '../components/settings/contexts/SettingsContextBase';
import { AttachmentSection } from '../components/task/FileAttachment';
import type { FormData as TaskFormData } from '../components/task/form/taskForm.types';
import { useTaskValidation } from '../components/task/form/useTaskValidation';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Badge } from '../components/ui/badge';
import { Typography } from '../components/ui/typography';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../contexts/AuthContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useTask } from '../hooks/useTask';
import { useTasks } from '../hooks/useTasks';
import logger from '../lib/logger';
import { cn } from '../lib/utils';
import type { FamilyRole } from '../types/family';
import type { GroupMember as GroupMemberType } from '../types/group';
import {
  CreateTaskInput,
  FileAttachment,
  TaskCategory,
  TaskPriority,
  UpdateTaskInput,
  UrlAttachment,
} from '../types/task';
import type { MemberRole } from '../types/user';
import { parseReminderToMinutes, toDate } from '../utils/dateHelpers';
import { getRoleDisplayName } from '../utils/family';

const categories: Array<{
  value: TaskCategory;
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  {
    value: 'household',
    label: '집안일',
    icon: Home,
    color: 'from-blue-400 to-blue-600',
  },
  {
    value: 'shopping',
    label: '쇼핑',
    icon: ShoppingCart,
    color: 'from-green-400 to-green-600',
  },
  {
    value: 'work',
    label: '업무',
    icon: Briefcase,
    color: 'from-purple-400 to-purple-600',
  },
  {
    value: 'personal',
    label: '개인',
    icon: UserIcon,
    color: 'from-pink-400 to-pink-600',
  },
  {
    value: 'travel',
    label: '여행',
    icon: MapPin,
    color: 'from-orange-400 to-orange-600',
  },
  {
    value: 'other',
    label: '기타',
    icon: FileText,
    color: 'from-gray-400 to-gray-600',
  },
];

const priorities: Array<{
  value: TaskPriority;
  label: string;
  gradient: string;
  borderColor: string;
}> = [
  {
    value: 'low',
    label: '낮음',
    gradient: 'from-green-400 to-green-500',
    borderColor: 'border-green-400',
  },
  {
    value: 'medium',
    label: '보통',
    gradient: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-400',
  },
  {
    value: 'high',
    label: '높음',
    gradient: 'from-red-400 to-red-500',
    borderColor: 'border-red-400',
  },
];

// QuickAddTask와 동일한 자연어 파싱 패턴
const DATE_PATTERNS = {
  today: /오늘|today/gi,
  tomorrow: /내일|tomorrow/gi,
  nextWeek: /다음\s?주|next\s?week/gi,
  thisWeek: /이번\s?주|this\s?week/gi,
  afterDays: /(\d+)일\s?후|in\s?(\d+)\s?days?/gi,
  specificDate: /(\d{1,2})월\s?(\d{1,2})일|(\d{1,2})\/(\d{1,2})/gi,
};

const PRIORITY_PATTERNS = {
  high: /긴급|중요|urgent|important|high|!{2,}/gi,
  medium: /보통|normal|medium|!/gi,
  low: /낮음|나중|later|low/gi,
};

const CATEGORY_PATTERNS = {
  household: /집안일|청소|요리|household|clean|cook/gi,
  shopping: /쇼핑|구매|장보기|shopping|buy|purchase/gi,
  work: /업무|회사|일|work|office|job/gi,
  personal: /개인|운동|공부|personal|exercise|study/gi,
};

interface TaskCreateProps {
  mode?: 'create' | 'edit';
}

type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface FormData {
  title: string;
  description: string;
  taskType: 'personal' | 'group'; // 개인 또는 그룹 할일
  selectedGroupId: string; // 선택된 그룹 ID
  assigneeId: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  dueTime: string;
  tags: string[];
  recurring: {
    enabled: boolean;
    frequency: RecurringFrequency;
    interval: number;
    endDate: string;
  };
  reminders: string[];
  estimatedMinutes: string;
  location: string;
  attachments: FileAttachment[];
  urls: UrlAttachment[];
}

function TaskCreate({ mode = 'create' }: TaskCreateProps) {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { user } = useAuth();
  const { settings } = useSettingsContext();
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
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    taskType: 'personal', // 기본값: 개인 할일
    selectedGroupId: firstGroup?.id || '', // 첫 번째 그룹을 기본값으로
    assigneeId: '',
    priority: 'medium',
    category: 'other',
    dueDate: '',
    dueTime: '',
    tags: [],
    recurring: {
      enabled: false,
      frequency: 'daily',
      interval: 1,
      endDate: '',
    },
    reminders: [],
    estimatedMinutes: '',
    location: '',
    attachments: [],
    urls: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [showRecurring, setShowRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { validateForm: validateFormSchema } = useTaskValidation();

  // 제목 입력의 자연어 파싱 결과 및 제안
  const [titleParsed, setTitleParsed] = useState<{
    priority?: TaskPriority;
    category?: TaskCategory;
    dueDate?: Date;
    tags: string[];
  }>({ tags: [] });
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  const parseTitleNaturalLanguage = (text: string) => {
    let parsedTitle = text;
    let parsedPriority: TaskPriority | undefined;
    let parsedCategory: TaskCategory | undefined;
    let parsedDueDate: Date | undefined;
    const parsedTags: string[] = [];

    Object.entries(PRIORITY_PATTERNS).forEach(([priorityLevel, pattern]) => {
      if (pattern.test(text)) {
        parsedPriority = priorityLevel as TaskPriority;
        parsedTitle = parsedTitle.replace(pattern, '').trim();
      }
    });

    Object.entries(CATEGORY_PATTERNS).forEach(([categoryType, pattern]) => {
      if (pattern.test(text)) {
        parsedCategory = categoryType as TaskCategory;
        parsedTitle = parsedTitle.replace(pattern, '').trim();
      }
    });

    if (text.includes('@집안일')) {
      parsedCategory = 'household';
      parsedTitle = parsedTitle.replace('@집안일', '').trim();
    } else if (text.includes('@업무')) {
      parsedCategory = 'work';
      parsedTitle = parsedTitle.replace('@업무', '').trim();
    } else if (text.includes('@쇼핑')) {
      parsedCategory = 'shopping';
      parsedTitle = parsedTitle.replace('@쇼핑', '').trim();
    } else if (text.includes('@개인')) {
      parsedCategory = 'personal';
      parsedTitle = parsedTitle.replace('@개인', '').trim();
    }

    Object.entries(DATE_PATTERNS).forEach(([dateType, pattern]) => {
      if (pattern.test(text)) {
        const today = new Date();
        switch (dateType) {
          case 'today':
            parsedDueDate = today;
            break;
          case 'tomorrow':
            parsedDueDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'nextWeek':
            parsedDueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'afterDays': {
            const match = text.match(/(\d+)일\s?후|in\s?(\d+)\s?days?/gi);
            if (match) {
              const days = parseInt(match[0].match(/\d+/)?.[0] || '1');
              parsedDueDate = new Date(
                today.getTime() + days * 24 * 60 * 60 * 1000
              );
            }
            break;
          }
        }
        parsedTitle = parsedTitle.replace(pattern, '').trim();
      }
    });

    if (text.includes('모레')) {
      parsedDueDate = new Date();
      parsedDueDate.setDate(parsedDueDate.getDate() + 2);
      parsedTitle = parsedTitle.replace('모레', '').trim();
    }

    const tagMatches = text.match(/#\S+/g);
    if (tagMatches) {
      tagMatches.forEach(tag => {
        parsedTags.push(tag.substring(1));
        parsedTitle = parsedTitle.replace(tag, '').trim();
      });
    }

    parsedTitle = parsedTitle.replace(/까지/g, '').trim();

    return {
      title: parsedTitle,
      priority: parsedPriority,
      category: parsedCategory,
      dueDate: parsedDueDate,
      tags: parsedTags,
    };
  };

  const generateTitleSuggestions = (text: string) => {
    if (text.length < 2) return [] as string[];
    const suggestions: string[] = [];
    if (!text.includes('오늘') && !text.includes('내일')) {
      suggestions.push(`${text} 오늘까지`);
      suggestions.push(`${text} 내일까지`);
    }
    if (
      !text.includes('!') &&
      !text.includes('긴급') &&
      !text.includes('중요')
    ) {
      suggestions.push(`${text} !중요`);
    }
    if (!text.includes('#') && !text.includes('@')) {
      suggestions.push(`${text} @개인`);
      suggestions.push(`${text} @업무`);
    }
    return suggestions.slice(0, 3);
  };

  useEffect(() => {
    const t = formData.title;
    if (t && t.trim().length > 0) {
      const parsed = parseTitleNaturalLanguage(t);
      setTitleParsed(parsed);
      setTitleSuggestions(generateTitleSuggestions(t));
    } else {
      setTitleParsed({ tags: [] });
      setTitleSuggestions([]);
    }
  }, [formData.title]);

  // 현재 선택된 그룹의 멤버들 가져오기
  const firstGroupId = firstGroup?.id || null;
  const { members: selectedGroupMembers } = useGroup({
    groupId: formData.selectedGroupId || firstGroupId,
  });

  // 그룹이 없으면 개인 할일로 자동 설정
  useEffect(() => {
    if (!firstGroupId && formData.taskType === 'group') {
      setFormData(prev => ({
        ...prev,
        taskType: 'personal',
        selectedGroupId: '',
        assigneeId: user?.uid || '',
      }));
    }
  }, [firstGroupId, formData.taskType, user?.uid]);

  // 현재 선택된 그룹의 멤버들 또는 개인 할일일 때는 현재 사용자만
  const groupMembers =
    formData.taskType === 'group' && selectedGroupMembers?.length > 0
      ? selectedGroupMembers.map((member: GroupMemberType) => ({
          id: member.userId,
          name: member.userName || member.displayName || 'Unknown',
          avatar: member.avatar || member.userAvatar || null,
          role: member.role as MemberRole,
        }))
      : [
          // 개인 할일일 때는 현재 사용자만 표시
          {
            id: user?.uid || 'current-user',
            name: user?.displayName || '나',
            avatar: settings?.profile?.avatar || user?.photoURL,
            role: 'member' as MemberRole,
          },
        ];

  // Load task data for edit mode
  useEffect(() => {
    if (mode === 'edit' && existingTask) {
      // Convert task data to form format
      let dueDateTime: Date | null = null;
      if (existingTask.dueDate) {
        dueDateTime = toDate(existingTask.dueDate);
      }

      setFormData({
        title: existingTask.title,
        description: existingTask.description || '',
        taskType: existingTask.groupId ? 'group' : 'personal',
        selectedGroupId: existingTask.groupId || firstGroupId || '',
        assigneeId: existingTask.assigneeId,
        priority: existingTask.priority,
        category: existingTask.category,
        dueDate: dueDateTime ? dueDateTime.toISOString().split('T')[0] : '',
        dueTime: dueDateTime ? dueDateTime.toTimeString().slice(0, 5) : '',
        tags: existingTask.tags,
        recurring: {
          enabled: existingTask.recurring?.enabled || false,
          frequency:
            (existingTask.recurring?.frequency as RecurringFrequency) ||
            'daily',
          interval: existingTask.recurring?.interval || 1,
          endDate: existingTask.recurring?.endDate || '',
        },
        reminders:
          existingTask.reminders
            ?.map(r => (typeof r === 'string' ? r : r.time || ''))
            .filter(Boolean) || [],
        estimatedMinutes: existingTask.estimatedMinutes?.toString() || '',
        location:
          typeof existingTask.location === 'string'
            ? existingTask.location
            : '',
        attachments: existingTask.attachments || [],
        urls: existingTask.urls || [],
      });
      setShowRecurring(existingTask.recurring?.enabled || false);
    }
  }, [mode, existingTask, firstGroupId]);

  const validateForm = () => {
    const newErrors = validateFormSchema(formData as unknown as TaskFormData);
    if (formData.taskType === 'group') {
      if (!formData.selectedGroupId || formData.selectedGroupId.trim() === '') {
        newErrors.selectedGroupId = '그룹을 선택해주세요';
      }
      if (!formData.assigneeId || formData.assigneeId.trim() === '') {
        newErrors.assigneeId = '담당자를 선택해주세요';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // 인증 가드: 사용자 정보가 없으면 저장 중단
    if (!user?.uid) {
      error('로그인이 필요합니다.');
      return;
    }

    if (!validateForm() || saving) return;

    setSaving(true);
    try {
      // Combine date and time for dueDate with timezone safety
      let dueDate: Timestamp | undefined;
      if (formData.dueDate) {
        const date = new Date(formData.dueDate);
        if (formData.dueTime) {
          const [hours, minutes] = formData.dueTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
        }
        // Preserve local timezone instead of converting to UTC
        dueDate = Timestamp.fromDate(date);
      }

      const taskData: Partial<CreateTaskInput & UpdateTaskInput> = {
        title: formData.title.trim(),
        assigneeId: formData.assigneeId,
        priority: formData.priority,
        category: formData.category,
        tags: formData.tags || [],
        attachments: formData.attachments || [],
        urls: formData.urls || [],
        reminders:
          formData.reminders.length > 0
            ? formData.reminders.map(reminder => ({
                offsetMinutes: parseReminderToMinutes(reminder),
                method: 'push' as const,
              }))
            : [],
      };

      // Only add fields if they have values
      if (formData.description.trim()) {
        taskData.description = formData.description.trim();
      }

      if (dueDate) {
        taskData.dueDate = dueDate;
      }

      if (formData.recurring.enabled) {
        taskData.recurring = {
          enabled: formData.recurring.enabled,
          frequency: formData.recurring.frequency,
          interval: formData.recurring.interval,
          endDate: formData.recurring.endDate || undefined,
        };
      }

      if (formData.estimatedMinutes && formData.estimatedMinutes.trim()) {
        const minutes = parseInt(formData.estimatedMinutes);
        if (!isNaN(minutes) && minutes > 0) {
          taskData.estimatedMinutes = minutes;
        }
      }

      // 위치는 문자열 입력만 받으므로 구조화되지 않은 경우 저장 생략

      if (mode === 'edit' && taskId) {
        await updateTask(taskId, taskData as UpdateTaskInput);
      } else {
        // 개인 할일일 때는 현재 사용자를 담당자로 설정
        const finalAssigneeId =
          formData.taskType === 'personal'
            ? user?.uid || ''
            : taskData.assigneeId || '';

        const createData: CreateTaskInput = {
          ...taskData,
          taskType: formData.taskType,
          title: taskData.title || '',
          groupId:
            formData.taskType === 'group' && formData.selectedGroupId
              ? formData.selectedGroupId
              : undefined,
          userId: user?.uid || '',
          assigneeId: finalAssigneeId,
        } as CreateTaskInput;

        logger.info('TaskCreate', 'creating task', createData);
        const taskId = await createTask(createData);

        // Show success message and navigate to the created task detail page
        success('할일이 성공적으로 생성되었습니다!');
        navigate(`/tasks/${taskId}`);
      }
    } catch (err) {
      logger.error('TaskCreate', 'Failed to save task', err);
      const message =
        (err as any)?.message || (err as any)?.code || '알 수 없는 오류입니다';
      error(`할일 저장 중 오류가 발생했습니다: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleAddReminder = (time: string) => {
    if (time && !formData.reminders.includes(time)) {
      setFormData(prev => ({
        ...prev,
        reminders: [...prev.reminders, time],
      }));
    }
  };

  if (mode === 'edit' && taskLoading) {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner
            size="lg"
            variant="wave"
            text="할일 정보를 불러오는 중..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-task-create">
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
        noValidate
      >
        <div
          className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16 fixed-header-spacing"
          style={{ paddingTop: '120px' }}
        >
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Typography.H2 className="text-white mb-2">
                  {mode === 'edit' ? '할일 수정' : '새 할일 만들기'}
                </Typography.H2>
                <Typography.Body className="text-white/90">
                  할일의 세부사항을 입력해주세요
                </Typography.Body>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10">
            {/* Task Type Selection Section */}
            <GlassCard
              variant="medium"
              className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-4 sm:mb-6 md:mb-8 flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                  <User size={14} className="sm:w-4 sm:h-4 text-white" />
                </div>
                할일 유형 선택
              </Typography.H3>

              <div className="space-y-6">
                <Typography.Label className="text-white/90 mb-4 flex items-center gap-2">
                  <User size={16} />
                  할일을 등록할 유형을 선택하세요
                  <span className="text-red-400">*</span>
                </Typography.Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {/* 개인 할일 옵션 */}
                  <WaveButton
                    variant={
                      formData.taskType === 'personal' ? 'primary' : 'ghost'
                    }
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        taskType: 'personal',
                        assigneeId: user?.uid || '', // 개인 할일로 변경 시 현재 사용자로 자동 설정
                      }));
                      // 에러 상태 초기화
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.assigneeId;
                        return newErrors;
                      });
                    }}
                    className={cn(
                      'relative p-6 h-auto justify-start border-2 transition-all duration-300',
                      formData.taskType === 'personal'
                        ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                        : 'border-slate-300 hover:border-slate-400 bg-white/95 backdrop-blur-sm shadow-md hover:shadow-lg'
                    )}
                    aria-label="개인 할일 선택"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md',
                          'bg-gradient-to-br',
                          formData.taskType === 'personal'
                            ? 'from-indigo-500 to-indigo-700'
                            : 'from-slate-200 to-slate-300'
                        )}
                      >
                        <User
                          size={20}
                          className={
                            formData.taskType === 'personal'
                              ? 'text-white'
                              : 'text-slate-700'
                          }
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <Typography.BodySmall
                          className={cn(
                            'font-semibold text-lg',
                            formData.taskType === 'personal'
                              ? 'text-primary-700'
                              : 'text-slate-800'
                          )}
                        >
                          나만 보는 할일
                        </Typography.BodySmall>
                        <Typography.Caption
                          className={cn(
                            formData.taskType === 'personal'
                              ? 'text-primary-600'
                              : 'text-slate-600'
                          )}
                        >
                          개인적으로 관리하는 할일입니다
                        </Typography.Caption>
                      </div>
                      {formData.taskType === 'personal' && (
                        <Check size={20} className="text-primary-600" />
                      )}
                    </div>
                  </WaveButton>

                  {/* 그룹 할일 옵션 */}
                  <WaveButton
                    variant={
                      formData.taskType === 'group' ? 'primary' : 'ghost'
                    }
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        taskType: 'group',
                        assigneeId: '', // 그룹 할일로 변경 시 담당자 재선택 필요
                      }));
                    }}
                    disabled={!groups || groups.length === 0}
                    className={cn(
                      'relative p-6 h-auto justify-start border-2 transition-all duration-300',
                      formData.taskType === 'group'
                        ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                        : 'border-slate-300 hover:border-slate-400 bg-white/95 backdrop-blur-sm shadow-md hover:shadow-lg',
                      (!groups || groups.length === 0) &&
                        'opacity-50 cursor-not-allowed'
                    )}
                    aria-label="그룹 할일 선택"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md',
                          'bg-gradient-to-br',
                          formData.taskType === 'group'
                            ? 'from-green-500 to-green-700'
                            : 'from-slate-200 to-slate-300'
                        )}
                      >
                        <UserIcon
                          size={20}
                          className={
                            formData.taskType === 'group'
                              ? 'text-white'
                              : 'text-slate-700'
                          }
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <Typography.BodySmall
                          className={cn(
                            'font-semibold text-lg',
                            formData.taskType === 'group'
                              ? 'text-primary-700'
                              : 'text-slate-800'
                          )}
                        >
                          그룹에 등록할 할일
                        </Typography.BodySmall>
                        <Typography.Caption
                          className={cn(
                            formData.taskType === 'group'
                              ? 'text-primary-600'
                              : 'text-slate-600'
                          )}
                        >
                          그룹 구성원들과 공유하는 할일입니다
                        </Typography.Caption>
                      </div>
                      {formData.taskType === 'group' && (
                        <Check size={20} className="text-primary-600" />
                      )}
                    </div>
                  </WaveButton>
                </div>

                {/* 그룹이 없을 때 안내 메시지 */}
                {(!groups || groups.length === 0) && (
                  <div className="p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-xl border-2 border-yellow-400/30">
                    <Typography.Caption className="text-white flex items-center gap-3">
                      <UserIcon size={16} className="text-yellow-400" />
                      그룹 할일을 등록하려면 먼저 그룹을 생성해야 합니다.
                      <WaveButton
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/family')}
                        className="text-yellow-400 hover:text-yellow-300 underline"
                      >
                        그룹 관리 페이지로 이동
                      </WaveButton>
                    </Typography.Caption>
                  </div>
                )}

                {/* 그룹 선택 (그룹 할일일 때만 표시) */}
                {formData.taskType === 'group' &&
                  groups &&
                  groups.length > 0 && (
                    <div className="space-y-4">
                      <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                        <UserIcon size={16} />
                        그룹 선택
                        <span className="text-red-400">*</span>
                      </Typography.Label>

                      {errors.selectedGroupId && (
                        <Typography.Caption className="text-red-400 mt-2 flex items-center gap-1">
                          <X size={12} />
                          {errors.selectedGroupId}
                        </Typography.Caption>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                        {groups.map(group => (
                          <WaveButton
                            key={group.id}
                            variant={
                              formData.selectedGroupId === group.id
                                ? 'primary'
                                : 'ghost'
                            }
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                selectedGroupId: group.id,
                                assigneeId: '', // 그룹 변경 시 담당자 재선택 필요
                              }));
                            }}
                            className={cn(
                              'relative p-4 h-auto justify-start border-2 transition-all duration-200',
                              formData.selectedGroupId === group.id
                                ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                                : 'border-slate-300 hover:border-slate-400 bg-white/95 backdrop-blur-sm shadow-md'
                            )}
                            aria-label={`${group.name} 그룹 선택`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md',
                                  'bg-gradient-to-br',
                                  formData.selectedGroupId === group.id
                                    ? 'from-green-500 to-green-700'
                                    : 'from-slate-200 to-slate-300'
                                )}
                              >
                                <span
                                  className={cn(
                                    formData.selectedGroupId === group.id
                                      ? 'text-white'
                                      : 'text-slate-700'
                                  )}
                                >
                                  {group.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 text-left">
                                <Typography.BodySmall
                                  className={cn(
                                    'font-semibold',
                                    formData.selectedGroupId === group.id
                                      ? 'text-primary-700'
                                      : 'text-slate-800'
                                  )}
                                >
                                  {group.name}
                                </Typography.BodySmall>
                                <Typography.Caption
                                  className={cn(
                                    formData.selectedGroupId === group.id
                                      ? 'text-primary-600'
                                      : 'text-slate-600'
                                  )}
                                >
                                  그룹 구성원
                                </Typography.Caption>
                              </div>
                              {formData.selectedGroupId === group.id && (
                                <Check size={16} className="text-primary-600" />
                              )}
                            </div>
                          </WaveButton>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </GlassCard>

            {/* Basic Information Section */}
            <GlassCard
              variant="medium"
              className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-4 sm:mb-6 md:mb-8 flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <FileText size={14} className="sm:w-4 sm:h-4 text-white" />
                </div>
                기본 정보
              </Typography.H3>

              <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
                {/* Title Input with Enhanced Design */}
                <div className="group">
                  <Typography.Label className="text-white/90 mb-2 sm:mb-3 flex items-center gap-2">
                    할일 제목
                    <span className="text-red-400">*</span>
                  </Typography.Label>
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="할일 제목을 입력하세요"
                      className={cn(
                        'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                        'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                        '!text-gray-900 dark:!text-foreground placeholder-gray-600 dark:placeholder-muted-foreground caret-gray-900 dark:caret-white',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                        'group-hover:shadow-md',
                        errors.title
                          ? 'border-red-400 bg-red-50/95'
                          : 'border-border'
                      )}
                      aria-invalid={!!errors.title}
                      aria-describedby={
                        errors.title ? 'error-title' : undefined
                      }
                    />
                    {formData.title && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check size={16} className="text-green-500" />
                      </div>
                    )}
                  </div>
                  {/* QuickAddTask 스타일의 파싱 배지 표시 */}
                  {formData.title &&
                    (titleParsed.priority ||
                      titleParsed.category ||
                      titleParsed.dueDate) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {titleParsed.priority && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs px-2 py-1',
                              'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                              'shadow-sm hover:shadow-md transition-all duration-200',
                              'text-foreground'
                            )}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            {priorities.find(
                              p => p.value === titleParsed.priority
                            )?.label || '우선순위'}
                          </Badge>
                        )}
                        {titleParsed.category && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs px-2 py-1',
                              'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                              'shadow-sm hover:shadow-md transition-all duration-200',
                              'text-foreground'
                            )}
                          >
                            {categories.find(
                              c => c.value === titleParsed.category
                            )?.label || '카테고리'}
                          </Badge>
                        )}
                        {titleParsed.dueDate && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs px-2 py-1',
                              'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                              'shadow-sm hover:shadow-md transition-all duration-200',
                              'text-foreground'
                            )}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(titleParsed.dueDate, 'M월 d일', {
                              locale: ko,
                            })}
                          </Badge>
                        )}
                      </div>
                    )}
                  {/* 제안 버튼 */}
                  {formData.title && titleSuggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {titleSuggestions.map((s, idx) => (
                        <WaveButton
                          key={idx}
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData(prev => ({ ...prev, title: s }))
                          }
                          className={cn(
                            'text-xs font-pretendard',
                            'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                            'shadow-sm hover:shadow-md transition-all duration-200',
                            'text-foreground hover:text-foreground/80'
                          )}
                        >
                          {s}
                        </WaveButton>
                      ))}
                    </div>
                  )}
                  {errors.title && (
                    <Typography.Caption
                      id="error-title"
                      className="text-red-400 mt-2 flex items-center gap-1"
                    >
                      <X size={12} />
                      {errors.title}
                    </Typography.Caption>
                  )}
                </div>

                {/* Description Textarea with Enhanced Design */}
                <div className="group">
                  <Typography.Label className="text-white/90 mb-2 sm:mb-3 flex items-center gap-2">
                    설명
                    <Typography.Caption className="text-white/60">
                      (선택사항)
                    </Typography.Caption>
                  </Typography.Label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="할일에 대한 자세한 설명을 입력하세요"
                      rows={3}
                      className={cn(
                        'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                        'bg-card backdrop-blur-sm',
                        '!text-foreground placeholder-muted-foreground caret-white',
                        'transition-all duration-200 resize-none',
                        'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                        'group-hover:shadow-md'
                      )}
                    />
                    <Typography.Caption className="absolute bottom-3 right-3 text-muted-foreground">
                      {formData.description.length}/500
                    </Typography.Caption>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Assignment & Priority Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                {formData.taskType === 'personal'
                  ? '담당자 및 우선순위'
                  : '할당 및 우선순위'}
              </Typography.H3>

              <div className="space-y-6">
                {/* Assignee Selection with Enhanced Design */}
                <div>
                  <Typography.Label className="text-white/90 mb-4 flex items-center gap-2">
                    <User size={16} />
                    {formData.taskType === 'personal'
                      ? '담당자'
                      : '담당자 선택'}
                    <span className="text-red-400">*</span>
                  </Typography.Label>

                  {/* 개인 할일일 때는 담당자 정보만 표시 */}
                  {formData.taskType === 'personal' ? (
                    <div className="p-4 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 backdrop-blur-sm rounded-xl border-2 border-indigo-400/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md">
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || '나'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white">
                              {(user?.displayName || '나').charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <Typography.BodySmall className="text-white font-semibold text-lg">
                            {user?.displayName || '나'}
                          </Typography.BodySmall>
                          <Typography.Caption className="text-white/80">
                            개인 할일 담당자
                          </Typography.Caption>
                        </div>
                        <Check size={20} className="text-indigo-400 ml-auto" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                        {groupMembers.map(member => (
                          <WaveButton
                            key={member.id}
                            variant={
                              formData.assigneeId === member.id
                                ? 'primary'
                                : 'ghost'
                            }
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                assigneeId: member.id,
                              }));
                              // 담당자 선택 시 에러 상태 즉시 초기화
                              if (errors.assigneeId) {
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.assigneeId;
                                  return newErrors;
                                });
                              }
                            }}
                            className={cn(
                              'relative p-4 h-auto justify-start',
                              'border-2 transition-all duration-200',
                              formData.assigneeId === member.id
                                ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                                : 'border-border hover:border-border bg-card backdrop-blur-sm shadow-md',
                              errors.assigneeId &&
                                formData.assigneeId !== member.id &&
                                'border-red-300'
                            )}
                            aria-label={`${member.name} 선택`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md',
                                  'bg-gradient-to-br',
                                  formData.assigneeId === member.id
                                    ? 'from-primary-500 to-primary-700'
                                    : 'bg-card'
                                )}
                              >
                                {member.avatar ? (
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      formData.assigneeId === member.id
                                        ? 'text-white'
                                        : 'text-foreground'
                                    )}
                                  >
                                    {member.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <Typography.BodySmall
                                  className={cn(
                                    'font-semibold',
                                    formData.assigneeId === member.id
                                      ? 'text-primary-700'
                                      : 'text-foreground'
                                  )}
                                >
                                  {member.name}
                                </Typography.BodySmall>
                                <Typography.Caption
                                  className={cn(
                                    formData.assigneeId === member.id
                                      ? 'text-primary-600'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {getRoleDisplayName(
                                    member.role as FamilyRole
                                  )}
                                </Typography.Caption>
                              </div>
                              {formData.assigneeId === member.id && (
                                <Check size={16} className="text-primary-600" />
                              )}
                            </div>
                          </WaveButton>
                        ))}
                      </div>

                      {errors.assigneeId && (
                        <Typography.Caption className="text-red-400 mt-3 flex items-center gap-1">
                          <X size={12} />
                          {errors.assigneeId}
                        </Typography.Caption>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <WaveButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const currentUserId = user?.uid || 'current-user';
                            setFormData(prev => ({
                              ...prev,
                              assigneeId: currentUserId,
                            }));
                            // 에러 상태 초기화
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.assigneeId;
                              return newErrors;
                            });
                          }}
                          className="text-xs px-4 py-2 border-2 border-primary-300 hover:border-primary-400 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium"
                        >
                          나에게 할당
                        </WaveButton>
                        <WaveButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, assigneeId: '' }));
                            // 에러 상태 초기화
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.assigneeId;
                              return newErrors;
                            });
                          }}
                          className="text-xs px-4 py-2 border-2 border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
                        >
                          선택 해제
                        </WaveButton>
                      </div>
                    </>
                  )}
                </div>

                {/* Priority Selection with Enhanced Design */}
                <div>
                  <Typography.Label className="text-white/90 mb-4">
                    우선순위
                  </Typography.Label>
                  <div className="flex gap-3">
                    {priorities.map(priority => (
                      <WaveButton
                        key={priority.value}
                        variant={'ghost'}
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            priority: priority.value,
                          }))
                        }
                        className={cn(
                          'flex-1 relative overflow-hidden transition-all duration-300 border-2',
                          'focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 outline-none',
                          // 선택 상태: ring 제거, 가벼운 그림자만 유지
                          formData.priority === priority.value && 'shadow-md',
                          formData.priority === priority.value &&
                            priority.borderColor,
                          // 비선택 상태: 과한 hover 테두리/그림자 제거, 은은한 배경만 유지
                          formData.priority !== priority.value &&
                            'bg-white/95 border-slate-300'
                        )}
                        aria-label={`우선순위 ${priority.label} 선택`}
                      >
                        <div
                          className={cn(
                            'absolute inset-0 opacity-15',
                            formData.priority === priority.value &&
                              `bg-gradient-to-r ${priority.gradient}`
                          )}
                        />
                        <span
                          className={cn(
                            'relative z-10 font-semibold',
                            formData.priority === priority.value
                              ? 'text-white'
                              : 'text-slate-800'
                          )}
                        >
                          {priority.label}
                        </span>
                      </WaveButton>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Selection with Icons */}
              <div className="mt-6">
                <Typography.Label className="text-white/90 mb-4 flex items-center gap-2">
                  <Tag size={16} />
                  카테고리
                </Typography.Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <WaveButton
                        key={category.value}
                        variant={
                          formData.category === category.value
                            ? 'primary'
                            : 'ghost'
                        }
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            category: category.value,
                          }))
                        }
                        className={cn(
                          'relative flex flex-col items-center p-4 h-auto',
                          'border-2 transition-all duration-300',
                          formData.category === category.value
                            ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg'
                            : 'border-slate-300 hover:border-slate-400 bg-white/95 backdrop-blur-sm hover:bg-white shadow-md'
                        )}
                        aria-label={`카테고리 ${category.label} 선택`}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center mb-2',
                            'bg-gradient-to-br shadow-md transition-transform',
                            formData.category === category.value
                              ? category.color + ' scale-110'
                              : 'from-slate-200 to-slate-300'
                          )}
                        >
                          <Icon
                            size={20}
                            className={cn(
                              formData.category === category.value
                                ? 'text-white'
                                : 'text-slate-700'
                            )}
                          />
                        </div>
                        <Typography.Caption
                          className={cn(
                            'font-semibold',
                            formData.category === category.value
                              ? 'text-primary-700'
                              : 'text-slate-800'
                          )}
                        >
                          {category.label}
                        </Typography.Caption>
                      </WaveButton>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Due Date & Time Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Calendar size={16} className="text-white" />
                </div>
                일정
              </Typography.H3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                <div className="group">
                  <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                    <Calendar size={16} />
                    마감일
                  </Typography.Label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                        className={cn(
                          'w-full px-4 lg:px-6 py-3 lg:py-4 pr-12',
                          'border-2 border-gray-200/50 dark:border-gray-600/50 rounded-xl',
                          'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm',
                          'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                          'transition-all duration-300 ease-in-out',
                          'focus:outline-none focus:ring-4 focus:ring-green-400/30 focus:border-green-400',
                          'hover:border-green-300/70 dark:hover:border-green-400/70',
                          'group-hover:shadow-lg group-hover:scale-[1.02]',
                          'cursor-pointer'
                        )}
                        aria-invalid={!!errors.dueDate}
                        aria-describedby={
                          errors.dueDate ? 'error-dueDate' : undefined
                        }
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {formData.dueDate && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    {formData.dueDate && (
                      <div className="mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar
                            size={14}
                            className="text-green-600 dark:text-green-400"
                          />
                          <span className="text-green-700 dark:text-green-300 font-medium">
                            {new Date(formData.dueDate).toLocaleDateString(
                              'ko-KR',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long',
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.dueDate && (
                    <Typography.Caption
                      id="error-dueDate"
                      className="text-red-400 mt-2 flex items-center gap-1"
                    >
                      <X size={12} />
                      {errors.dueDate}
                    </Typography.Caption>
                  )}
                </div>

                <div className="group">
                  <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    시간
                  </Typography.Label>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="time"
                        id="dueTime"
                        name="dueTime"
                        value={formData.dueTime}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            dueTime: e.target.value,
                          }))
                        }
                        className={cn(
                          'w-full px-4 lg:px-6 py-3 lg:py-4 pr-12',
                          'border-2 border-gray-200/50 dark:border-gray-600/50 rounded-xl',
                          'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm',
                          'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                          'transition-all duration-300 ease-in-out',
                          'focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400',
                          'hover:border-blue-300/70 dark:hover:border-blue-400/70',
                          'group-hover:shadow-lg group-hover:scale-[1.02]',
                          'cursor-pointer'
                        )}
                        aria-invalid={!!errors.dueTime}
                        aria-describedby={
                          errors.dueTime ? 'error-dueTime' : undefined
                        }
                      />
                      {formData.dueTime && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    {formData.dueTime && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock
                            size={14}
                            className="text-blue-600 dark:text-blue-400"
                          />
                          <span className="text-blue-700 dark:text-blue-300 font-medium">
                            {formData.dueTime}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.dueTime && (
                    <Typography.Caption
                      id="error-dueTime"
                      className="text-red-400 mt-2 flex items-center gap-1"
                    >
                      <X size={12} />
                      {errors.dueTime}
                    </Typography.Caption>
                  )}
                </div>
              </div>

              {/* Date & Time Preview */}
              {(formData.dueDate || formData.dueTime) && (
                <div className="mt-4 p-3 bg-background/10 backdrop-blur-sm rounded-lg">
                  <Typography.Caption className="text-white/80 flex items-center gap-2">
                    <Calendar size={14} />
                    {formData.dueDate &&
                      new Date(formData.dueDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    {formData.dueTime && ` ${formData.dueTime}`}
                  </Typography.Caption>
                </div>
              )}
            </GlassCard>

            {/* Recurring Settings Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <div className="flex items-center justify-between mb-6">
                <Typography.H3 className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                    <RepeatIcon size={16} className="text-white" />
                  </div>
                  반복 설정
                </Typography.H3>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showRecurring}
                    onChange={e => {
                      setShowRecurring(e.target.checked);
                      setFormData(prev => ({
                        ...prev,
                        recurring: {
                          ...prev.recurring,
                          enabled: e.target.checked,
                        },
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <Typography.Caption className="ml-3 text-white/80">
                    반복 할일로 설정
                  </Typography.Caption>
                </label>
              </div>

              {showRecurring && (
                <div className="space-y-4 p-5 bg-background/10 backdrop-blur-sm rounded-xl animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                    <div className="group">
                      <Typography.Label className="text-white/90 mb-3">
                        반복 주기
                      </Typography.Label>
                      <select
                        value={formData.recurring.frequency}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            recurring: {
                              ...prev.recurring,
                              frequency: e.target.value as RecurringFrequency,
                            },
                          }))
                        }
                        className={cn(
                          'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                          'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                          '!text-gray-900 dark:!text-foreground',
                          'transition-all duration-200',
                          'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                          'group-hover:shadow-md'
                        )}
                      >
                        <option value="daily">매일</option>
                        <option value="weekly">매주</option>
                        <option value="monthly">매월</option>
                        <option value="yearly">매년</option>
                      </select>
                    </div>

                    <div className="group">
                      <Typography.Label className="text-white/90 mb-3">
                        반복 간격
                      </Typography.Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.recurring.interval}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              recurring: {
                                ...prev.recurring,
                                interval: parseInt(e.target.value) || 1,
                              },
                            }))
                          }
                          className={cn(
                            'flex-1 px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                            'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                            '!text-gray-900 dark:!text-foreground caret-gray-900 dark:caret-white',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                            'group-hover:shadow-md'
                          )}
                        />
                        <Typography.Body className="text-white/80">
                          {formData.recurring.frequency === 'daily' && '일'}
                          {formData.recurring.frequency === 'weekly' && '주'}
                          {formData.recurring.frequency === 'monthly' && '개월'}
                          {formData.recurring.frequency === 'yearly' && '년'}
                          마다
                        </Typography.Body>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <Typography.Label className="text-white/90 mb-3">
                      반복 종료일
                      <Typography.Caption className="text-white/60 ml-2">
                        (선택사항)
                      </Typography.Caption>
                    </Typography.Label>
                    <input
                      type="date"
                      value={formData.recurring.endDate}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          recurring: {
                            ...prev.recurring,
                            endDate: e.target.value,
                          },
                        }))
                      }
                      className={cn(
                        'w-full md:w-1/2 px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                        'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                        '!text-gray-900 dark:!text-foreground caret-gray-900 dark:caret-white',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                        'group-hover:shadow-md'
                      )}
                    />
                    <Typography.Caption className="text-white/70 mt-2">
                      비워두면 무한 반복됩니다
                    </Typography.Caption>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/20">
                    <Typography.Body className="text-white flex items-center gap-2">
                      <RepeatIcon size={16} className="animate-spin-slow" />
                      <strong>미리보기:</strong>
                      {formData.recurring.interval}{' '}
                      {formData.recurring.frequency === 'daily' && '일'}
                      {formData.recurring.frequency === 'weekly' && '주'}
                      {formData.recurring.frequency === 'monthly' && '개월'}
                      {formData.recurring.frequency === 'yearly' && '년'}마다
                      반복
                      {formData.recurring.endDate &&
                        ` (${formData.recurring.endDate}까지)`}
                    </Typography.Body>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Notification Settings Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Bell size={16} className="text-white" />
                </div>
                알림 설정
              </Typography.H3>

              <div className="space-y-6">
                {/* 통합된 알림 설정 인터페이스 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Typography.Label className="text-white/90 flex items-center gap-2">
                      <Bell size={16} />
                      알림 시간 설정
                    </Typography.Label>
                    {formData.reminders.length > 0 && (
                      <Typography.Caption className="text-yellow-400 font-medium">
                        {formData.reminders.length}개 설정됨
                      </Typography.Caption>
                    )}
                  </div>

                  {/* 알림 시간 선택 버튼들 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-4">
                    {[
                      { value: '10분 전', priority: 'low' },
                      { value: '30분 전', priority: 'medium' },
                      { value: '1시간 전', priority: 'medium' },
                      { value: '1일 전', priority: 'high' },
                      { value: '1주일 전', priority: 'high' },
                    ].map(({ value, priority: _priority }) => (
                      <WaveButton
                        key={value}
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          if (formData.reminders.includes(value)) {
                            setFormData(prev => ({
                              ...prev,
                              reminders: prev.reminders.filter(
                                r => r !== value
                              ),
                            }));
                          } else {
                            handleAddReminder(value);
                          }
                        }}
                        className={cn(
                          'group relative h-16 flex flex-col items-center justify-center gap-1 transition-all duration-300',
                          'border-2 hover:scale-105 hover:shadow-lg',
                          formData.reminders.includes(value)
                            ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 shadow-lg ring-2 ring-yellow-400/20'
                            : 'border-slate-300 hover:border-yellow-400 bg-white/95 backdrop-blur-sm hover:bg-gradient-to-br hover:from-yellow-50/80 hover:to-orange-50/80'
                        )}
                        aria-label={`${value} 알림 ${
                          formData.reminders.includes(value) ? '해제' : '설정'
                        }`}
                      >
                        <Bell
                          size={16}
                          className={cn(
                            'transition-colors duration-300',
                            formData.reminders.includes(value)
                              ? 'text-yellow-700'
                              : 'text-slate-700 group-hover:text-white group-hover:drop-shadow-sm'
                          )}
                        />
                        <Typography.Caption
                          className={cn(
                            'font-semibold text-center transition-colors duration-300',
                            formData.reminders.includes(value)
                              ? 'text-yellow-800'
                              : 'text-slate-800 group-hover:text-white group-hover:drop-shadow-sm'
                          )}
                        >
                          {value}
                        </Typography.Caption>
                        {formData.reminders.includes(value) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </WaveButton>
                    ))}
                  </div>

                  {/* 설정된 알림 목록 */}
                  {formData.reminders.length > 0 ? (
                    <div className="p-5 bg-gradient-to-r from-yellow-400/15 to-orange-400/15 backdrop-blur-sm rounded-xl border-2 border-yellow-400/30 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Typography.Label className="text-white flex items-center gap-2 font-semibold">
                          <Check size={18} className="text-yellow-500" />
                          설정된 알림 목록
                        </Typography.Label>
                        <WaveButton
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData(prev => ({ ...prev, reminders: [] }))
                          }
                          className="text-xs px-3 py-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 transition-all duration-200"
                          aria-label="모든 알림 삭제"
                        >
                          전체 삭제
                        </WaveButton>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {formData.reminders.map((reminder, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-400/40 to-orange-400/40 backdrop-blur-sm rounded-full border-2 border-yellow-400/40 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                          >
                            <Bell size={16} className="text-yellow-600" />
                            <Typography.Caption className="text-white font-semibold text-sm">
                              {reminder}
                            </Typography.Caption>
                            <WaveButton
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  reminders: prev.reminders.filter(
                                    (_, i) => i !== index
                                  ),
                                }))
                              }
                              className="p-2 h-auto min-h-0 hover:bg-red-500/30 rounded-full transition-all duration-200 hover:scale-110"
                              aria-label={`${reminder} 알림 삭제`}
                            >
                              <X
                                size={14}
                                className="text-red-400 hover:text-red-300 transition-colors duration-200"
                              />
                            </WaveButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-gradient-to-r from-slate-400/15 to-slate-500/15 backdrop-blur-sm rounded-xl border-2 border-slate-400/30">
                      <Typography.Caption className="text-white/80 flex items-center gap-3 font-medium">
                        <Bell size={16} className="text-slate-400" />
                        설정된 알림이 없습니다. 위 버튼을 클릭하여 알림을
                        추가하세요.
                      </Typography.Caption>
                    </div>
                  )}
                </div>

                {/* 알림 정보 안내 */}
                <div className="p-5 bg-gradient-to-r from-yellow-400/15 to-orange-400/15 backdrop-blur-sm rounded-xl border-2 border-yellow-400/30 shadow-md">
                  <Typography.Caption className="text-white flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-yellow-400/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Bell size={14} className="text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-3 text-base">
                        알림 발송 기준
                      </div>
                      <div className="text-sm leading-relaxed space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">•</span>
                          <span>
                            마감일이 설정된 경우: 마감일 기준으로 알림 발송
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">•</span>
                          <span>
                            마감일이 없는 경우: 오늘 오후 6시 기준으로 알림 발송
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">•</span>
                          <span>
                            여러 알림을 설정하면 각각 독립적으로 발송됩니다
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">•</span>
                          <span>
                            동일한 시간의 알림은 중복 설정되지 않습니다
                          </span>
                        </div>
                      </div>
                    </div>
                  </Typography.Caption>
                </div>
              </div>
            </GlassCard>

            {/* Additional Settings Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                  <Clock size={16} className="text-white" />
                </div>
                추가 설정
              </Typography.H3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                <div className="group">
                  <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    예상 소요 시간 (분)
                  </Typography.Label>
                  <div className="relative">
                    <input
                      type="number"
                      id="estimatedMinutes"
                      name="estimatedMinutes"
                      min="1"
                      max="1440"
                      value={formData.estimatedMinutes}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          estimatedMinutes: e.target.value,
                        }))
                      }
                      placeholder="예: 30"
                      className={cn(
                        'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                        'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                        '!text-gray-900 dark:!text-foreground placeholder-gray-600 dark:placeholder-muted-foreground caret-gray-900 dark:caret-white',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                        'group-hover:shadow-md'
                      )}
                      aria-invalid={!!errors.estimatedMinutes}
                      aria-describedby={
                        errors.estimatedMinutes
                          ? 'error-estimatedMinutes'
                          : undefined
                      }
                    />
                    {formData.estimatedMinutes && (
                      <Typography.Caption className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {Math.floor(parseInt(formData.estimatedMinutes) / 60)}
                        시간 {parseInt(formData.estimatedMinutes) % 60}분
                      </Typography.Caption>
                    )}
                  </div>
                  {errors.estimatedMinutes && (
                    <Typography.Caption
                      id="error-estimatedMinutes"
                      className="text-red-400 mt-2 flex items-center gap-1"
                    >
                      <X size={12} />
                      {errors.estimatedMinutes}
                    </Typography.Caption>
                  )}
                </div>

                <div className="group">
                  <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                    <MapPin size={16} />
                    장소
                    <Typography.Caption className="text-white/60">
                      (선택사항)
                    </Typography.Caption>
                  </Typography.Label>
                  <div className="relative">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="예: 마트, 사무실, 집"
                      className={cn(
                        'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                        'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                        '!text-gray-900 dark:!text-foreground placeholder-gray-600 dark:placeholder-muted-foreground caret-gray-900 dark:caret-white',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                        'group-hover:shadow-md'
                      )}
                      aria-invalid={!!errors.location}
                      aria-describedby={
                        errors.location ? 'error-location' : undefined
                      }
                    />
                    {formData.location && (
                      <MapPin
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    )}
                  </div>
                  {errors.location && (
                    <Typography.Caption
                      id="error-location"
                      className="text-red-400 mt-2 flex items-center gap-1"
                    >
                      <X size={12} />
                      {errors.location}
                    </Typography.Caption>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Tags Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <Tag size={16} className="text-white" />
                </div>
                태그
              </Typography.H3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="태그를 입력하고 추가 버튼을 누르세요"
                    className={cn(
                      'flex-1 px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                      'bg-white/95 dark:bg-background/95 backdrop-blur-sm',
                      '!text-gray-900 dark:!text-foreground placeholder-gray-600 dark:placeholder-muted-foreground caret-gray-900 dark:caret-white',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400'
                    )}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <WaveButton
                    variant="primary"
                    onClick={handleAddTag}
                    size="md"
                    className="min-w-[100px]"
                    aria-label="태그 추가"
                  >
                    <Check size={16} className="mr-1" />
                    추가
                  </WaveButton>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 backdrop-blur-sm rounded-full"
                      >
                        <Typography.Body className="text-white font-medium">
                          #{tag}
                        </Typography.Body>
                        <WaveButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTag(tag)}
                          className="p-1 h-auto min-h-0"
                          aria-label={`${tag} 태그 삭제`}
                        >
                          <X
                            size={14}
                            className="text-white/80 hover:text-white"
                          />
                        </WaveButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Attachments Section */}
            <GlassCard
              variant="medium"
              className="p-6 lg:p-8 xl:p-10 transition-all duration-300 hover:shadow-xl"
              hover
            >
              <Typography.H3 className="text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
                첨부파일 및 URL
              </Typography.H3>

              <AttachmentSection
                attachments={formData.attachments}
                urls={formData.urls}
                onAttachmentsChange={attachments =>
                  setFormData(prev => ({ ...prev, attachments }))
                }
                onUrlsChange={urls => setFormData(prev => ({ ...prev, urls }))}
                disabled={saving}
              />
            </GlassCard>

            {/* Save Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 lg:gap-6 pb-8">
              <Typography.Caption className="text-white/60">
                * 표시된 항목은 필수 입력 사항입니다
              </Typography.Caption>

              <div className="flex gap-3 lg:gap-4">
                <WaveButton
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate(-1)}
                  className="min-w-[100px] lg:min-w-[120px] border-2 border-white/20 hover:border-white/40"
                  aria-label="취소하고 돌아가기"
                >
                  <X size={18} className="mr-2" />
                  취소
                </WaveButton>
                <WaveButton
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={saving}
                  className="font-pretendard text-lg px-8 py-4 min-h-[60px]"
                  aria-label={mode === 'edit' ? '할일 수정' : '할일 생성'}
                >
                  {saving ? (
                    <LoadingSpinner size="lg" />
                  ) : (
                    <>
                      <Save size={24} className="mr-3" />
                      {mode === 'edit' ? '수정' : '생성'}
                    </>
                  )}
                </WaveButton>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default TaskCreate;
