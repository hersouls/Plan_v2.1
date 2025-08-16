import React, { useState, useCallback } from 'react';
import { MessageSquare, Sparkles, Send, X, Loader2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { Input } from '../ui/input';
import { useClaudeAI } from '../../lib/claude';
import { cn } from '../../lib/utils';

export interface ClaudeAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSuggestion?: (suggestion: any) => void;
  placeholder?: string;
  className?: string;
}

export function ClaudeAssistant({ 
  isOpen, 
  onClose, 
  onTaskSuggestion,
  placeholder = "어떤 도움이 필요하신가요?",
  className 
}: ClaudeAssistantProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { isAvailable, generateTaskSuggestions } = useClaudeAI();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !isAvailable) return;

    setLoading(true);
    try {
      const taskSuggestions = await generateTaskSuggestions(input.trim());
      setSuggestions(taskSuggestions);
    } catch (error) {
      console.error('Claude Assistant error:', error);
    } finally {
      setLoading(false);
    }
  }, [input, loading, isAvailable, generateTaskSuggestions]);

  const handleSuggestionSelect = useCallback((suggestion: any) => {
    onTaskSuggestion?.(suggestion);
    setInput('');
    setSuggestions([]);
    onClose();
  }, [onTaskSuggestion, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassCard 
        variant="medium" 
        className={cn(
          "w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <Typography.H4 className="text-white font-pretendard">
                Claude AI 어시스턴트
              </Typography.H4>
              <Typography.BodySmall className="text-white/80 font-pretendard">
                {isAvailable ? 'AI 도움이 준비되었습니다' : 'AI 서비스를 사용할 수 없습니다'}
              </Typography.BodySmall>
            </div>
          </div>
          <WaveButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="닫기"
            className="text-white/80 hover:text-white"
          >
            <X size={20} />
          </WaveButton>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={loading || !isAvailable}
              className="flex-1"
            />
            <WaveButton
              type="submit"
              disabled={!input.trim() || loading || !isAvailable}
              size="sm"
              aria-label="전송"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </WaveButton>
          </div>
        </form>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <Typography.H5 className="text-white mb-4 font-pretendard">
              추천 할일들
            </Typography.H5>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <GlassCard
                  key={index}
                  variant="light"
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <Typography.Body className="text-gray-800 font-medium font-pretendard mb-1">
                        {suggestion.title}
                      </Typography.Body>
                      {suggestion.description && (
                        <Typography.BodySmall className="text-gray-600 font-pretendard mb-2">
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
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-pretendard">
                          {suggestion.category}
                        </span>
                        {suggestion.estimatedMinutes && (
                          <span className="text-gray-500 font-pretendard">
                            ~{suggestion.estimatedMinutes}분
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {suggestions.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-white/50 mx-auto mb-3" />
              <Typography.Body className="text-white/80 font-pretendard">
                무엇을 도와드릴까요?
              </Typography.Body>
              <Typography.BodySmall className="text-white/60 font-pretendard mt-1">
                예: "주말 청소 계획을 세워줘", "요리 레시피 할일을 만들어줘"
              </Typography.BodySmall>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={48} className="text-white/50 mx-auto mb-3 animate-spin" />
              <Typography.Body className="text-white/80 font-pretendard">
                AI가 생각하고 있어요...
              </Typography.Body>
            </div>
          </div>
        )}

        {/* Unavailable State */}
        {!isAvailable && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-white/30 mx-auto mb-3" />
              <Typography.Body className="text-white/60 font-pretendard">
                Claude AI 서비스를 사용할 수 없습니다
              </Typography.Body>
              <Typography.BodySmall className="text-white/40 font-pretendard mt-1">
                API 키를 확인해주세요
              </Typography.BodySmall>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}