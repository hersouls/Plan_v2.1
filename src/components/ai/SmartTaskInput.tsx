import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Wand2, Clock, Hash, CheckCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { GlassCard } from '../ui/GlassCard';
import { useClaudeAI } from '../../lib/claude';
import { TaskPriority, TaskCategory } from '../../types/task';
import { cn } from '../../lib/utils';

export interface SmartTaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onSmartSuggestion?: (suggestion: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    estimatedMinutes?: number;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SmartTaskInput({
  value,
  onChange,
  onSmartSuggestion,
  placeholder = "할일을 입력하세요...",
  disabled = false,
  className
}: SmartTaskInputProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    isAvailable, 
    categorizeTask, 
    improveTaskDescription, 
    estimateTaskDuration, 
    suggestTaskPriority 
  } = useClaudeAI();

  // Auto-enhance when user stops typing
  useEffect(() => {
    if (!value.trim() || !isAvailable) {
      setShowSuggestions(false);
      setSuggestion(null);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (value.trim().length > 10) { // Only enhance meaningful input
        await handleAutoEnhance(value.trim());
      }
    }, 1500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, isAvailable]);

  const handleAutoEnhance = useCallback(async (input: string) => {
    if (!isAvailable || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const [category, description, duration, priority] = await Promise.all([
        categorizeTask(input),
        improveTaskDescription(input),
        estimateTaskDuration(input),
        suggestTaskPriority(input)
      ]);

      const enhancedSuggestion = {
        title: input,
        description: description !== input ? description : undefined,
        category: category as TaskCategory,
        priority: priority as TaskPriority,
        estimatedMinutes: duration
      };

      setSuggestion(enhancedSuggestion);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Smart task input enhancement error:', error);
    } finally {
      setIsEnhancing(false);
    }
  }, [isAvailable, isEnhancing, categorizeTask, improveTaskDescription, estimateTaskDuration, suggestTaskPriority]);

  const handleManualEnhance = useCallback(async () => {
    if (!value.trim() || !isAvailable) return;
    await handleAutoEnhance(value.trim());
  }, [value, isAvailable, handleAutoEnhance]);

  const handleApplySuggestion = useCallback(() => {
    if (suggestion && onSmartSuggestion) {
      onSmartSuggestion(suggestion);
      setShowSuggestions(false);
    }
  }, [suggestion, onSmartSuggestion]);

  const handleDismissSuggestion = useCallback(() => {
    setShowSuggestions(false);
    setSuggestion(null);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-12"
        />
        
        {/* Smart enhance button */}
        {isAvailable && value.trim() && (
          <WaveButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleManualEnhance}
            disabled={isEnhancing || disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 h-auto"
            aria-label="AI로 향상시키기"
          >
            {isEnhancing ? (
              <Wand2 size={16} className="animate-pulse text-blue-500" />
            ) : (
              <Sparkles size={16} style={{ color: 'var(--semantic-text-tertiary)' }} className="hover:text-blue-500" />
            )}
          </WaveButton>
        )}
      </div>

      {/* AI Suggestions Popup */}
      {showSuggestions && suggestion && (
        <GlassCard
          variant="medium"
          className="absolute top-full left-0 right-0 mt-2 p-4 z-50 border shadow-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              <Typography.BodySmall className="font-medium font-pretendard" style={{ color: 'var(--semantic-text-primary)' }}>
                AI 추천 향상
              </Typography.BodySmall>
            </div>

            {/* Enhanced description */}
            {suggestion.description && suggestion.description !== suggestion.title && (
              <div>
                <Typography.BodySmall className="font-pretendard mb-1" style={{ color: 'var(--semantic-text-secondary)' }}>
                  향상된 설명:
                </Typography.BodySmall>
                <Typography.Body className="font-pretendard" style={{ color: 'var(--semantic-text-primary)' }}>
                  {suggestion.description}
                </Typography.Body>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs">
              <span className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full font-pretendard",
                suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              )}>
                우선순위: {suggestion.priority === 'high' ? '높음' :
                         suggestion.priority === 'medium' ? '보통' : '낮음'}
              </span>
              
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-pretendard">
                <Hash size={10} />
                {suggestion.category}
              </span>
              
              {suggestion.estimatedMinutes && (
                <span className="flex items-center gap-1 font-pretendard" style={{ color: 'var(--semantic-text-secondary)' }}>
                  <Clock size={10} />
                  ~{suggestion.estimatedMinutes}분
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <WaveButton
                size="sm"
                onClick={handleApplySuggestion}
                className="flex-1"
              >
                <CheckCircle size={14} className="mr-1" />
                적용하기
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleDismissSuggestion}
                className="px-3"
              >
                무시
              </WaveButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Loading indicator */}
      {isEnhancing && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--semantic-text-tertiary)' }}>
            <Wand2 size={12} className="animate-pulse" />
            <span className="font-pretendard" style={{ color: 'var(--semantic-text-tertiary)' }}>AI가 분석 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}