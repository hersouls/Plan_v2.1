import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Typography } from '../ui/typography';
import type { TypingStatus } from '../../types/chat';

interface TypingIndicatorProps {
  typingUsers: TypingStatus[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setVisible(true);
    } else {
      // 타이핑이 끝나면 잠시 후 숨김
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [typingUsers.length]);

  if (!visible || typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName}님이 입력 중...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName}님과 ${typingUsers[1].userName}님이 입력 중...`;
    } else {
      return `${typingUsers[0].userName}님 외 ${typingUsers.length - 1}명이 입력 중...`;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm',
        'animate-in slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      {/* 타이핑 애니메이션 */}
      <div className="flex items-center gap-1">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
        </div>
      </div>

      {/* 타이핑 텍스트 */}
      <Typography.Caption className="text-white/70 text-sm">
        {getTypingText()}
      </Typography.Caption>
    </div>
  );
}
