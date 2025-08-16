import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/components/ui/utils';
import { WaveButton } from '@/components/ui/WaveButton';
import { TaskCategory, TaskPriority } from '@/types/task';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Briefcase,
  Calendar,
  Flag,
  Home,
  Lightbulb,
  Plus,
  Settings,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react';
import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';

// Enhanced natural language parsing patterns
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

interface QuickAddTaskProps {
  onAdd?: (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string;
    assigneeId?: string;
    tags: string[];
    taskType?: 'personal' | 'group';
    groupId?: string;
  }) => void;
  onTaskCreate?: (task: Omit<any, 'userId' | 'groupId'>) => Promise<void>;
  defaultAssigneeId?: string;
  groupMembers?: Array<{ id: string; name: string; avatar?: string }>;
  groups?: Array<{ id: string; name: string }>;
  className?: string;
  placeholder?: string;
  // New enhanced props
  mode?: 'simple' | 'advanced';
  enhancedParsing?: boolean;
  showSuggestions?: boolean;
  expandable?: boolean;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  onAdd,
  onTaskCreate,
  defaultAssigneeId,
  groupMembers = [],
  groups = [],
  className,
  placeholder = '빠른 할일 추가... (예: 내일까지 장보기 #쇼핑 !높음)',
  // Enhanced props with defaults
  mode = 'simple',
  enhancedParsing = true,
  showSuggestions = true,
  expandable = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [dueDate, setDueDate] = useState<Date>();
  const [assigneeId, setAssigneeId] = useState<string>(defaultAssigneeId || '');
  const [taskType, setTaskType] = useState<'personal' | 'group'>('personal');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<{
    priority?: TaskPriority;
    category?: TaskCategory;
    dueDate?: Date;
    cleanText?: string;
  }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const parseNaturalLanguage = (text: string) => {
    if (!enhancedParsing) {
      return {
        title: text.trim(),
        priority: priority,
        category: category,
        dueDate: dueDate,
        tags: tags,
        taskType: taskType,
        groupId: taskType === 'group' ? selectedGroupId : undefined,
      };
    }

    let parsedTitle = text;
    let parsedPriority: TaskPriority = 'medium';
    let parsedCategory: TaskCategory = 'personal';
    let parsedDueDate: Date | undefined;
    const parsedTags: string[] = [];

    // Enhanced priority extraction using patterns
    Object.entries(PRIORITY_PATTERNS).forEach(([priorityLevel, pattern]) => {
      if (pattern.test(text)) {
        parsedPriority = priorityLevel as TaskPriority;
        parsedTitle = parsedTitle.replace(pattern, '').trim();
      }
    });

    // Enhanced category extraction using patterns
    Object.entries(CATEGORY_PATTERNS).forEach(([categoryType, pattern]) => {
      if (pattern.test(text)) {
        parsedCategory = categoryType as TaskCategory;
        parsedTitle = parsedTitle.replace(pattern, '').trim();
      }
    });

    // Legacy category parsing with @ symbol
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

    // Enhanced date extraction using patterns
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

    // Legacy date parsing
    if (text.includes('모레')) {
      parsedDueDate = new Date();
      parsedDueDate.setDate(parsedDueDate.getDate() + 2);
      parsedTitle = parsedTitle.replace('모레', '').trim();
    }

    // Tags 파싱
    const tagMatches = text.match(/#\S+/g);
    if (tagMatches) {
      tagMatches.forEach(tag => {
        parsedTags.push(tag.substring(1));
        parsedTitle = parsedTitle.replace(tag, '').trim();
      });
    }

    // "까지" 제거
    parsedTitle = parsedTitle.replace(/까지/g, '').trim();

    return {
      title: parsedTitle,
      priority: parsedPriority,
      category: parsedCategory,
      tags: parsedTags,
      dueDate: parsedDueDate,
    };
  };

  // Real-time suggestions based on input
  const generateSuggestions = (text: string) => {
    if (!showSuggestions || text.length < 2) return [];

    const suggestions: string[] = [];

    // Date suggestions
    if (!text.includes('오늘') && !text.includes('내일')) {
      suggestions.push(`${text} 오늘까지`);
      suggestions.push(`${text} 내일까지`);
    }

    // Priority suggestions
    if (
      !text.includes('!') &&
      !text.includes('긴급') &&
      !text.includes('중요')
    ) {
      suggestions.push(`${text} !중요`);
    }

    // Category suggestions
    if (!text.includes('#') && !text.includes('@')) {
      suggestions.push(`${text} @개인`);
      suggestions.push(`${text} @업무`);
    }

    return suggestions.slice(0, 3);
  };

  // Real-time parsing effect
  useEffect(() => {
    if (input && enhancedParsing) {
      const parsed = parseNaturalLanguage(input);
      setParsedData(parsed);

      if (showSuggestions) {
        setSuggestions(generateSuggestions(input));
      }

      // Auto-update form fields if in advanced mode
      if (mode === 'advanced') {
        if (parsed.priority !== priority) setPriority(parsed.priority);
        if (parsed.category !== category) setCategory(parsed.category);
        if (parsed.dueDate && !dueDate) setDueDate(parsed.dueDate);
        if (parsed.tags.length > 0)
          setTags(prev => [...new Set([...prev, ...parsed.tags])]);
      }
    }
  }, [input, enhancedParsing, showSuggestions, mode]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // 그룹 할일 선택 시 그룹이 선택되지 않은 경우 경고
    if (taskType === 'group' && !selectedGroupId) {
      alert('그룹 할일을 선택하셨습니다. 그룹을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      let taskData;

      if (mode === 'advanced' || isExpanded) {
        // Advanced mode: use manual inputs
        taskData = {
          title: input,
          priority,
          category,
          dueDate: dueDate?.toISOString(),
          assigneeId,
          tags: [...tags, currentTag].filter(Boolean),
          taskType,
          groupId: taskType === 'group' ? selectedGroupId : undefined,
        };
      } else {
        // Simple mode: use natural language parsing
        const parsed = parseNaturalLanguage(input);
        taskData = {
          title: parsed.title,
          priority: parsed.priority,
          category: parsed.category,
          dueDate: parsed.dueDate?.toISOString(),
          assigneeId,
          tags: parsed.tags,
          taskType: parsed.taskType,
          groupId: parsed.groupId,
        };
      }

      // Call the appropriate handler
      if (onTaskCreate) {
        await onTaskCreate(taskData);
      } else if (onAdd) {
        onAdd(taskData);
      }

      // Haptic feedback on mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setInput('');
    setPriority('medium');
    setCategory('personal');
    setDueDate(undefined);
    setAssigneeId(defaultAssigneeId || '');
    setTaskType('personal');
    setSelectedGroupId('');
    setTags([]);
    setCurrentTag('');
    setIsExpanded(false);
    setSuggestions([]);
    setParsedData({});
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const priorityConfig = {
    low: { label: '낮음', icon: Flag },
    medium: { label: '중간', icon: Flag },
    high: { label: '높음', icon: Flag },
  };

  const categoryConfig = {
    personal: { label: '개인', icon: User },
    work: { label: '업무', icon: Briefcase },
    household: { label: '집안일', icon: Home },
    shopping: { label: '쇼핑', icon: ShoppingCart },
    other: { label: '기타', icon: Settings },
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 1. 빠른 추가 카드 */}
      <GlassCard variant="medium" className="p-4 sm:p-5 lg:p-6 xl:p-8">
        {/* 2. 입력 컨테이너 */}
        <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
          {/* 3. 메인 입력 필드 */}
          <div className="flex-1">
            {/* 4. 입력 필드 */}
            <Input
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (enhancedParsing) {
                  const parsed = parseNaturalLanguage(e.target.value);
                  setParsedData(parsed);
                  if (parsed.priority) setPriority(parsed.priority);
                  if (parsed.category) setCategory(parsed.category);
                  if (parsed.dueDate) setDueDate(parsed.dueDate);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                'bg-background/95 backdrop-blur-sm',
                'text-foreground placeholder-muted-foreground',
                'transition-all duration-200',
                'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                'group-hover:shadow-md',
                'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl'
              )}
              style={{
                fontSize: 'var(--typography-body-large-fontSize)',
                lineHeight: 'var(--typography-body-large-lineHeight)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            />

            {/* 5. 파싱된 정보 표시 컨테이너 */}
            {enhancedParsing && parsedData.cleanText && (
              <div className="mt-2 flex flex-wrap gap-2">
                {/* 6. 파싱된 우선순위 배지 */}
                {parsedData.priority && (
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
                    {priorityConfig[parsedData.priority].label}
                  </Badge>
                )}
                {/* 7. 파싱된 카테고리 배지 */}
                {parsedData.category && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs px-2 py-1',
                      'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                      'shadow-sm hover:shadow-md transition-all duration-200',
                      'text-foreground'
                    )}
                  >
                    {
                      categoryConfig[
                        parsedData.category as keyof typeof categoryConfig
                      ].label
                    }
                  </Badge>
                )}
                {/* 8. 파싱된 날짜 배지 */}
                {parsedData.dueDate && (
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
                    {format(parsedData.dueDate, 'M월 d일', { locale: ko })}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 9. 액션 버튼 컨테이너 */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* 10. 확장 버튼 */}
            {expandable && (
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 sm:p-2.5 lg:p-3 xl:p-4 backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 ease-out group relative"
                aria-label={
                  isExpanded ? '간단 모드로 전환' : '고급 모드로 전환'
                }
                title={isExpanded ? '간단 모드로 전환' : '고급 옵션 보기'}
              >
                <Lightbulb
                  size={18}
                  className={cn(
                    'transition-all duration-200',
                    isExpanded ? 'text-yellow-400' : 'text-white/60'
                  )}
                />
                {/* 툴팁 */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {isExpanded ? '간단 모드로 전환' : '고급 옵션 보기'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
                </div>
              </WaveButton>
            )}

            {/* 11. 추가 버튼 */}
            <WaveButton
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className={cn(
                'px-4 sm:px-5 lg:px-6 xl:px-8 py-2 sm:py-2.5 lg:py-3 xl:py-4',
                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
                'text-white font-pretendard font-medium',
                'transition-all duration-300 ease-out transform hover:scale-105 active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                'backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl'
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm sm:text-base lg:text-lg xl:text-xl">
                    추가 중...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus
                    size={18}
                    className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7"
                  />
                  <span className="text-sm sm:text-base lg:text-lg xl:text-xl">
                    추가
                  </span>
                </div>
              )}
            </WaveButton>
          </div>
        </div>

        {/* 12. 고급 옵션 컨테이너 */}
        {isExpanded && (
          <div className="mt-4 sm:mt-5 lg:mt-6 xl:mt-8 space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-8">
            {/* 13. 고급 옵션 그리드 컨테이너 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
              {/* 14. 우선순위 선택 컨테이너 */}
              <div className="space-y-2 sm:space-y-3">
                {/* 15. 우선순위 라벨 텍스트 */}
                <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                  우선순위
                </label>
                {/* 16. 우선순위 버튼 그룹 컨테이너 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <WaveButton
                      key={key}
                      variant={priority === key ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setPriority(key as TaskPriority)}
                      className={cn(
                        'w-full px-2 sm:px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 xl:py-3 text-xs sm:text-sm lg:text-base xl:text-lg',
                        'font-pretendard transition-all duration-300 ease-out',
                        'backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:shadow-xl',
                        'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                        'flex flex-col items-center justify-center gap-1 sm:gap-2',
                        'text-center',
                        priority === key
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/50'
                          : 'text-white/80 hover:text-white hover:bg-white/20'
                      )}
                    >
                      <config.icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 flex-shrink-0" />
                      <span className="text-center truncate overflow-hidden w-full font-medium">
                        {config.label}
                      </span>
                    </WaveButton>
                  ))}
                </div>
              </div>

              {/* 17. 카테고리 선택 컨테이너 */}
              <div className="space-y-2 sm:space-y-3">
                {/* 18. 카테고리 라벨 텍스트 */}
                <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                  카테고리
                </label>
                {/* 19. 카테고리 버튼 그룹 컨테이너 */}
                <div className="flex gap-2 sm:gap-3 w-full justify-between">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <WaveButton
                      key={key}
                      variant={category === key ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setCategory(key as TaskCategory)}
                      className={cn(
                        'flex-1 px-2 sm:px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 xl:py-3 text-xs sm:text-sm lg:text-base xl:text-lg',
                        'font-pretendard transition-all duration-300 ease-out',
                        'backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:shadow-xl',
                        'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                        'flex flex-col items-center justify-center gap-1 sm:gap-2',
                        'text-center',
                        'min-w-[60px] sm:min-w-[70px] lg:min-w-[80px] xl:min-w-[90px]',
                        category === key
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/50'
                          : 'text-white/80 hover:text-white hover:bg-white/20'
                      )}
                    >
                      <config.icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 flex-shrink-0" />
                      <span className="text-center truncate overflow-hidden w-full font-medium">
                        {config.label}
                      </span>
                    </WaveButton>
                  ))}
                </div>
              </div>

              {/* 20. 날짜 선택 컨테이너 */}
              <div className="space-y-2 sm:space-y-3 xl:col-span-3 2xl:col-span-3">
                {/* 21. 날짜 라벨 텍스트 */}
                <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                  마감일
                </label>
                {/* 22. 날짜 선택 팝오버 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <WaveButton
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                        'bg-background/95 backdrop-blur-sm',
                        'text-foreground placeholder-muted-foreground',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                        'group-hover:shadow-md',
                        'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl',
                        'justify-start text-left',
                        'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                        'text-white/80 hover:text-white hover:bg-white/20'
                      )}
                    >
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm lg:text-base xl:text-lg font-pretendard truncate overflow-hidden">
                        {dueDate
                          ? format(dueDate, 'M월 d일', { locale: ko })
                          : '날짜 선택'}
                      </span>
                    </WaveButton>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 glass-medium border-white/20"
                    align="start"
                  >
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className="font-pretendard"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 23. 담당자 선택 컨테이너 */}
              {groupMembers.length > 0 && (
                <div className="space-y-2 sm:space-y-3 xl:col-span-3 2xl:col-span-3">
                  {/* 24. 담당자 라벨 텍스트 */}
                  <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                    담당자
                  </label>
                  {/* 25. 담당자 선택 팝오버 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <WaveButton
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                          'bg-background/95 backdrop-blur-sm',
                          'text-foreground placeholder-muted-foreground',
                          'transition-all duration-200',
                          'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                          'group-hover:shadow-md',
                          'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl',
                          'justify-start text-left',
                          'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                          'text-white/80 hover:text-white hover:bg-white/20'
                        )}
                      >
                        <User className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2 sm:mr-3 flex-shrink-0" />
                        <span className="text-xs sm:text-sm lg:text-base xl:text-lg font-pretendard truncate overflow-hidden">
                          {groupMembers.find(m => m.id === assigneeId)?.name ||
                            '담당자 선택'}
                        </span>
                      </WaveButton>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 p-2 glass-medium border-white/20"
                      align="start"
                    >
                      <div className="space-y-1">
                        {groupMembers.map(member => (
                          <WaveButton
                            key={member.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssigneeId(member.id)}
                            className={cn(
                              'w-full justify-start font-pretendard',
                              'px-3 py-2 text-sm',
                              assigneeId === member.id
                                ? 'bg-white/20'
                                : 'hover:bg-white/10'
                            )}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              {member.avatar ? (
                                <AvatarImage
                                  src={member.avatar}
                                  alt={member.name}
                                />
                              ) : null}
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {member.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            {member.name}
                          </WaveButton>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* 26. 태그 입력 컨테이너 */}
            <div className="space-y-2 sm:space-y-3">
              {/* 27. 태그 라벨 텍스트 */}
              <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                태그
              </label>
              {/* 28. 태그 입력 필드 */}
              <div className="flex gap-2 sm:gap-3">
                <Input
                  value={currentTag}
                  onChange={e => setCurrentTag(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && currentTag.trim()) {
                      e.preventDefault();
                      if (!tags.includes(currentTag.trim())) {
                        setTags([...tags, currentTag.trim()]);
                      }
                      setCurrentTag('');
                    }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className={cn(
                    'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                    'bg-background/95 backdrop-blur-sm',
                    'text-foreground placeholder-muted-foreground',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                    'group-hover:shadow-md',
                    'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl'
                  )}
                />
              </div>
              {/* 29. 태그 목록 컨테이너 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={cn(
                        'text-xs px-2 py-1',
                        'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                        'shadow-sm hover:shadow-md transition-all duration-200',
                        'text-foreground font-pretendard'
                      )}
                    >
                      #{tag}
                      <button
                        onClick={() =>
                          setTags(tags.filter((_, i) => i !== index))
                        }
                        className="ml-1 hover:text-red-300 transition-colors"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 26-1. 할일유형 선택 컨테이너 */}
            <div className="space-y-2 sm:space-y-3">
              {/* 27-1. 할일유형 라벨 텍스트 */}
              <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                할일유형
              </label>
              {/* 28-1. 할일유형 선택 버튼 그룹 */}
              <div className="flex gap-2 sm:gap-3">
                {/* 개인 할일 버튼 */}
                <WaveButton
                  variant={taskType === 'personal' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTaskType('personal')}
                  className={cn(
                    'flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4',
                    'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl',
                    'transition-all duration-300 ease-out',
                    'backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:shadow-xl',
                    'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                    'flex items-center justify-center gap-2',
                    taskType === 'personal'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/50'
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  )}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                  <span className="font-medium">개인</span>
                </WaveButton>

                {/* 그룹 할일 버튼 */}
                <WaveButton
                  variant={taskType === 'group' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTaskType('group')}
                  disabled={groups.length === 0}
                  className={cn(
                    'flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4',
                    'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl',
                    'transition-all duration-300 ease-out',
                    'backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg hover:shadow-xl',
                    'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                    'flex items-center justify-center gap-2',
                    taskType === 'group'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-400/50'
                      : 'text-white/80 hover:text-white hover:bg-white/20',
                    groups.length === 0 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                  <span className="font-medium">그룹</span>
                </WaveButton>
              </div>

              {/* 29-1. 그룹 선택 컨테이너 (그룹 할일 선택 시에만 표시) */}
              {taskType === 'group' && (
                <div className="space-y-2 sm:space-y-3">
                  {/* 30-1. 그룹 선택 라벨 텍스트 */}
                  <label className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/80 font-pretendard font-medium">
                    그룹 선택
                  </label>
                  {groups.length > 0 ? (
                    /* 31-1. 그룹 선택 팝오버 */
                    <Popover>
                      <PopoverTrigger asChild>
                        <WaveButton
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 rounded-xl',
                            'bg-background/95 backdrop-blur-sm',
                            'text-foreground placeholder-muted-foreground',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                            'group-hover:shadow-md',
                            'font-pretendard text-sm sm:text-base lg:text-lg xl:text-xl',
                            'justify-start text-left',
                            'min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] xl:min-h-[52px]',
                            'text-white/80 hover:text-white hover:bg-white/20'
                          )}
                        >
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2 sm:mr-3 flex-shrink-0" />
                          <span className="text-xs sm:text-sm lg:text-base xl:text-lg font-pretendard truncate overflow-hidden">
                            {groups.find(g => g.id === selectedGroupId)?.name ||
                              '그룹 선택'}
                          </span>
                        </WaveButton>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 p-2 glass-medium border-white/20"
                        align="start"
                      >
                        <div className="space-y-1">
                          {groups.map(group => (
                            <WaveButton
                              key={group.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGroupId(group.id)}
                              className={cn(
                                'w-full justify-start font-pretendard',
                                'px-3 py-2 text-sm',
                                selectedGroupId === group.id
                                  ? 'bg-white/20'
                                  : 'hover:bg-white/10'
                              )}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {group.name}
                            </WaveButton>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    /* 32-1. 그룹 없음 안내 메시지 */
                    <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-yellow-300">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-pretendard">
                          속한 그룹이 없습니다. 그룹에 가입하거나 그룹을
                          생성해주세요.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 30. 제안 컨테이너 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-4 sm:mt-5 lg:mt-6 xl:mt-8">
            {/* 31. 제안 라벨 텍스트 */}
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/60 font-pretendard mb-2 sm:mb-3">
              제안:
            </p>
            {/* 32. 제안 버튼 그룹 컨테이너 */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {suggestions.map((suggestion, index) => (
                <WaveButton
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput(suggestion)}
                  className={cn(
                    'text-xs sm:text-sm lg:text-base xl:text-lg font-pretendard',
                    'backdrop-blur-sm bg-background/95 border-2 border-white/20',
                    'shadow-sm hover:shadow-md transition-all duration-200',
                    'text-foreground hover:text-foreground/80'
                  )}
                >
                  {suggestion}
                </WaveButton>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// Backward compatibility alias for QuickAddTaskEnhanced
export const QuickAddTaskEnhanced: React.FC<QuickAddTaskProps> = props => (
  <QuickAddTask
    {...props}
    mode="advanced"
    enhancedParsing={true}
    showSuggestions={true}
    expandable={true}
  />
);

QuickAddTaskEnhanced.displayName = 'QuickAddTaskEnhanced';

export { QuickAddTask };
export default QuickAddTask;
