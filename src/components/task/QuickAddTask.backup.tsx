import React, { useState, useRef, KeyboardEvent } from 'react';
import { Plus, Calendar, Flag, User, Lightbulb } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { TaskPriority, TaskCategory } from '@/types/task';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { WaveButton } from '@/components/ui/WaveButton';

interface QuickAddTaskProps {
  onAdd: (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string;
    assigneeId?: string;
    tags: string[];
  }) => void;
  groupMembers?: Array<{ id: string; name: string; avatar?: string }>;
  className?: string;
  placeholder?: string;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  onAdd,
  groupMembers = [],
  className,
  placeholder = "빠른 할일 추가... (예: 내일까지 장보기 #쇼핑 !높음)"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [dueDate, setDueDate] = useState<Date>();
  const [assigneeId, setAssigneeId] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const parseNaturalLanguage = (text: string) => {
    let parsedTitle = text;
    let parsedPriority: TaskPriority = 'medium';
    let parsedCategory: TaskCategory = 'personal';
    const parsedTags: string[] = [];

    // Priority 파싱
    if (text.includes('!높음') || text.includes('!!!')) {
      parsedPriority = 'high';
      parsedTitle = parsedTitle.replace(/!높음|!!!/g, '').trim();
    } else if (text.includes('!중간') || text.includes('!!')) {
      parsedPriority = 'medium';
      parsedTitle = parsedTitle.replace(/!중간|!!/g, '').trim();
    } else if (text.includes('!낮음') || text.includes('!')) {
      parsedPriority = 'low';
      parsedTitle = parsedTitle.replace(/!낮음|!/g, '').trim();
    }

    // Category 파싱
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

    // Tags 파싱
    const tagMatches = text.match(/#\S+/g);
    if (tagMatches) {
      tagMatches.forEach(tag => {
        parsedTags.push(tag.substring(1));
        parsedTitle = parsedTitle.replace(tag, '').trim();
      });
    }

    // Due date 파싱 (간단한 버전)
    let parsedDueDate: Date | undefined;
    if (text.includes('오늘')) {
      parsedDueDate = new Date();
      parsedTitle = parsedTitle.replace('오늘', '').trim();
    } else if (text.includes('내일')) {
      parsedDueDate = new Date();
      parsedDueDate.setDate(parsedDueDate.getDate() + 1);
      parsedTitle = parsedTitle.replace('내일', '').trim();
    } else if (text.includes('모레')) {
      parsedDueDate = new Date();
      parsedDueDate.setDate(parsedDueDate.getDate() + 2);
      parsedTitle = parsedTitle.replace('모레', '').trim();
    }

    // "까지" 제거
    parsedTitle = parsedTitle.replace(/까지/g, '').trim();

    return {
      title: parsedTitle,
      priority: parsedPriority,
      category: parsedCategory,
      tags: parsedTags,
      dueDate: parsedDueDate
    };
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    if (isExpanded) {
      // 확장 모드: 수동 입력 사용
      onAdd({
        title: input,
        priority,
        category,
        dueDate: dueDate?.toISOString(),
        assigneeId,
        tags: [...tags, currentTag].filter(Boolean)
      });
    } else {
      // 간단 모드: 자연어 파싱
      const parsed = parseNaturalLanguage(input);
      onAdd({
        title: parsed.title,
        priority: parsed.priority,
        category: parsed.category,
        dueDate: parsed.dueDate?.toISOString(),
        tags: parsed.tags
      });
    }

    // Reset
    setInput('');
    setPriority('medium');
    setCategory('personal');
    setDueDate(undefined);
    setAssigneeId(undefined);
    setTags([]);
    setCurrentTag('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (currentTag.trim()) {
        setTags([...tags, currentTag.trim()]);
        setCurrentTag('');
      }
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div className="space-y-4 sm:space-y-5 lg:space-y-6 xl:space-y-8">
        {/* Main Input - GlassCard 스타일 */}
        <GlassCard variant="light" className="p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const parsed = parseNaturalLanguage(e.target.value);
                  setPriority(parsed.priority);
                  setCategory(parsed.category);
                  setTags(parsed.tags);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl bg-background/90 backdrop-blur-sm border-border rounded-xl lg:rounded-2xl xl:rounded-3xl focus:ring-2 focus:ring-primary focus:border-primary font-pretendard shadow-lg hover:shadow-xl transition-all duration-200"
              />
            </div>
            <WaveButton
              onClick={handleSubmit}
              disabled={!input.trim()}
              variant="primary"
              size="lg"
              className="h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20 px-4 sm:px-6 lg:px-8 xl:px-10 text-sm sm:text-base lg:text-lg xl:text-xl"
            >
              <Plus size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 mr-2" />
              추가
            </WaveButton>
          </div>
        </GlassCard>

        {/* 자연어 입력 도움말 - GlassCard 스타일 */}
        {!isExpanded && input.length === 0 && (
          <GlassCard variant="light" className="p-3 sm:p-4 lg:p-5 xl:p-6">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 text-sm sm:text-base lg:text-lg xl:text-xl text-foreground/80 font-pretendard">
              <div className="p-2 sm:p-2.5 lg:p-3 xl:p-4 rounded-lg bg-warning-light">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-yellow-500" />
              </div>
              <span className="break-keep-ko leading-ko-normal">
                💡 팁: "내일까지 장보기 #쇼핑 !높음" 같이 자연스럽게 입력해보세요
              </span>
            </div>
          </GlassCard>
        )}

        {/* Expanded Options - GlassCard 스타일 */}
        {isExpanded && (
          <GlassCard variant="medium" className="p-6 lg:p-8 space-y-6 lg:space-y-8">
            {/* Priority Selection */}
            <div className="space-y-3">
              <label className="text-sm lg:text-base font-semibold text-foreground font-pretendard tracking-ko-tight">
                우선순위
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <WaveButton
                    key={p}
                    variant={priority === p ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'h-12 lg:h-14 text-sm lg:text-base font-pretendard transition-all duration-200',
                      priority === p 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' 
                        : 'bg-background/50 hover:bg-background/70 text-foreground/70 border border-border'
                    )}
                  >
                    <Flag size={16} className="mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">
                      {p === 'low' ? '낮음' : p === 'medium' ? '중간' : '높음'}
                    </span>
                    <span className="sm:hidden">
                      {p === 'low' ? '낮음' : p === 'medium' ? '중간' : '높음'}
                    </span>
                  </WaveButton>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm lg:text-base font-semibold text-foreground font-pretendard tracking-ko-tight">
                카테고리
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['personal', 'work', 'household', 'shopping', 'other'] as const).map((c) => (
                  <WaveButton
                    key={c}
                    variant={category === c ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={() => setCategory(c)}
                    className={cn(
                      'h-12 lg:h-14 text-sm lg:text-base font-pretendard transition-all duration-200',
                      category === c 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg' 
                        : 'bg-background/50 hover:bg-background/70 text-foreground/70 border border-border'
                    )}
                  >
                    <span className="hidden sm:inline">
                      {c === 'personal' ? '개인' : 
                       c === 'work' ? '업무' : 
                       c === 'household' ? '집안일' : 
                       c === 'shopping' ? '쇼핑' : '기타'}
                    </span>
                    <span className="sm:hidden">
                      {c === 'personal' ? '개인' : 
                       c === 'work' ? '업무' : 
                       c === 'household' ? '집안일' : 
                       c === 'shopping' ? '쇼핑' : '기타'}
                    </span>
                  </WaveButton>
                ))}
              </div>
            </div>

            {/* Due Date Selection */}
            <div className="space-y-3">
              <label className="text-sm lg:text-base font-semibold text-foreground font-pretendard tracking-ko-tight">
                마감일
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <WaveButton 
                    variant="secondary"
                    size="lg"
                    className="w-full justify-start text-left font-normal h-12 lg:h-14 bg-background/50 hover:bg-background/70 text-foreground border border-border font-pretendard transition-all duration-200"
                  >
                    <Calendar className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">
                      {dueDate ? format(dueDate, 'PPP', { locale: ko }) : '마감일 선택'}
                    </span>
                  </WaveButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border rounded-xl shadow-lg">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assignee Selection */}
            {groupMembers.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm lg:text-base font-semibold text-foreground font-pretendard tracking-ko-tight">
                  담당자
                </label>
                <div className="flex flex-wrap gap-3">
                  <WaveButton
                    variant={!assigneeId ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={() => setAssigneeId(undefined)}
                    className={cn(
                      'h-12 lg:h-14 text-sm lg:text-base font-pretendard transition-all duration-200',
                      !assigneeId 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg' 
                        : 'bg-background/50 hover:bg-background/70 text-foreground/70 border border-border'
                    )}
                  >
                    나
                  </WaveButton>
                  {groupMembers.map((member) => (
                    <WaveButton
                      key={member.id}
                      variant={assigneeId === member.id ? 'primary' : 'secondary'}
                      size="lg"
                      onClick={() => setAssigneeId(member.id)}
                      className={cn(
                        'h-12 lg:h-14 text-sm lg:text-base font-pretendard transition-all duration-200',
                        assigneeId === member.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg' 
                          : 'bg-background/50 hover:bg-background/70 text-foreground/70 border border-border'
                      )}
                    >
                      <User size={16} className="mr-2" />
                      {member.name}
                    </WaveButton>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm lg:text-base font-semibold text-foreground font-pretendard tracking-ko-tight">
                태그
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer bg-muted text-foreground border border-border hover:bg-muted/80 transition-all duration-200 font-pretendard" 
                      onClick={() => removeTag(index)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="태그 입력..."
                    className="h-10 w-32 lg:w-40 bg-background/50 text-foreground border border-border placeholder:text-muted-foreground font-pretendard focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default QuickAddTask;