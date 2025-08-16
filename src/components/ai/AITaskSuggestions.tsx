import { useState, useCallback, useEffect } from 'react';
import { Lightbulb, Plus, RefreshCw, X, Clock, Hash } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { useClaudeAI, TaskSuggestion } from '../../lib/claude';
import { cn } from '../../lib/utils';

export interface AITaskSuggestionsProps {
  context?: string;
  familyMembers?: Array<{ id: string; name: string }>;
  onTaskSelect?: (suggestion: TaskSuggestion) => void;
  onClose?: () => void;
  maxSuggestions?: number;
  className?: string;
}

const contextPrompts = {
  morning: "아침에 할 수 있는 가족 할일들",
  evening: "저녁에 할 수 있는 가족 할일들",
  weekend: "주말에 가족이 함께할 수 있는 활동들",
  household: "집안 관리와 정리를 위한 할일들",
  health: "가족 건강과 운동을 위한 할일들",
  education: "학습과 교육을 위한 할일들",
  fun: "재미있고 창의적인 가족 활동들"
};

export function AITaskSuggestions({
  context = 'general',
  familyMembers = [],
  onTaskSelect,
  onClose,
  maxSuggestions = 5,
  className
}: AITaskSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('morning');
  
  const { isAvailable, generateTaskSuggestions } = useClaudeAI();

  const loadSuggestions = useCallback(async (prompt?: string) => {
    if (!isAvailable) return;

    setLoading(true);
    try {
      const promptText = prompt || contextPrompts[selectedPrompt as keyof typeof contextPrompts] || context;
      const familyContext = familyMembers.length > 0 
        ? `가족 구성원: ${familyMembers.map(m => m.name).join(', ')}`
        : '';
      
      const fullPrompt = `${promptText}. ${familyContext}`;
      const newSuggestions = await generateTaskSuggestions(fullPrompt);
      setSuggestions(newSuggestions.slice(0, maxSuggestions));
    } catch (error) {
      console.error('AI task suggestions error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [isAvailable, selectedPrompt, context, familyMembers, maxSuggestions, generateTaskSuggestions]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleRefresh = useCallback(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handlePromptChange = useCallback((prompt: string) => {
    setSelectedPrompt(prompt);
    loadSuggestions(contextPrompts[prompt as keyof typeof contextPrompts]);
  }, [loadSuggestions]);

  const handleTaskSelect = useCallback((suggestion: TaskSuggestion) => {
    onTaskSelect?.(suggestion);
  }, [onTaskSelect]);

  if (!isAvailable) {
    return (
      <GlassCard variant="light" className={cn("p-6 text-center", className)}>
        <Lightbulb size={32} className="text-gray-400 mx-auto mb-3" />
        <Typography.Body className="text-gray-600 font-pretendard">
          AI 추천 기능을 사용할 수 없습니다
        </Typography.Body>
        <Typography.BodySmall className="text-gray-500 font-pretendard mt-1">
          API 키를 설정해주세요
        </Typography.BodySmall>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="medium" className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
            <Lightbulb size={20} className="text-white" />
          </div>
          <div>
            <Typography.H4 className="text-white font-pretendard">
              AI 할일 추천
            </Typography.H4>
            <Typography.BodySmall className="text-white/80 font-pretendard">
              상황에 맞는 할일을 제안해드려요
            </Typography.BodySmall>
          </div>
        </div>
        <div className="flex gap-2">
          <WaveButton
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="새로고침"
            className="text-white/80 hover:text-white"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </WaveButton>
          {onClose && (
            <WaveButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="닫기"
              className="text-white/80 hover:text-white"
            >
              <X size={16} />
            </WaveButton>
          )}
        </div>
      </div>

      {/* Context Selection */}
      <div className="mb-6">
        <Typography.BodySmall className="text-white/80 font-pretendard mb-3">
          상황 선택:
        </Typography.BodySmall>
        <div className="flex flex-wrap gap-2">
          {Object.entries(contextPrompts).map(([key, label]) => (
            <WaveButton
              key={key}
              variant={selectedPrompt === key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handlePromptChange(key)}
              className="text-xs"
            >
              {label}
            </WaveButton>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={32} className="text-white/50 mx-auto mb-3 animate-spin" />
            <Typography.Body className="text-white/80 font-pretendard">
              AI가 추천을 생성하고 있어요...
            </Typography.Body>
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <GlassCard
              key={index}
              variant="light"
              className="p-4 cursor-pointer hover:bg-white/10 transition-colors group"
              onClick={() => handleTaskSelect(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Typography.Body className="text-gray-800 font-medium font-pretendard mb-1">
                    {suggestion.title}
                  </Typography.Body>
                  {suggestion.description && (
                    <Typography.BodySmall className="text-gray-600 font-pretendard mb-3">
                      {suggestion.description}
                    </Typography.BodySmall>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded-full font-pretendard",
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {suggestion.priority === 'high' ? '높음' :
                       suggestion.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-pretendard">
                      <Hash size={8} />
                      {suggestion.category}
                    </span>
                    {suggestion.estimatedMinutes && (
                      <span className="flex items-center gap-1 text-gray-500 font-pretendard">
                        <Clock size={8} />
                        ~{suggestion.estimatedMinutes}분
                      </span>
                    )}
                  </div>
                </div>
                <WaveButton
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskSelect(suggestion);
                  }}
                  aria-label="할일 추가"
                >
                  <Plus size={16} />
                </WaveButton>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-8">
            <Lightbulb size={32} className="text-white/50 mx-auto mb-3" />
            <Typography.Body className="text-white/80 font-pretendard">
              추천할 할일이 없습니다
            </Typography.Body>
            <Typography.BodySmall className="text-white/60 font-pretendard mt-1">
              다른 상황을 선택해보세요
            </Typography.BodySmall>
          </div>
        )}
      </div>
    </GlassCard>
  );
}