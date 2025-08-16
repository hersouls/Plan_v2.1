import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/components/ui/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { AtSign, X } from 'lucide-react';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

interface MentionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = "댓글을 입력하세요...",
  className,
  disabled = false,
  onKeyDown,
}) => {
  const { user } = useAuth();
  const { currentGroup, groupMembers } = useData();
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // 멘션 가능한 사용자 목록 생성
  const mentionableUsers = React.useMemo(() => {
    const users: MentionUser[] = [];
    
    // 현재 사용자 제외
    if (user) {
      users.push({
        id: user.uid,
        name: user.displayName || user.email || '나',
        email: user.email || '',
        avatar: user.photoURL || undefined,
      });
    }

    // 그룹 멤버 추가
    if (currentGroup && groupMembers) {
      groupMembers.forEach(member => {
        if (member.id !== user?.uid) {
          users.push({
            id: member.id,
            name: member.displayName || member.email || '사용자',
            email: member.email || '',
            avatar: member.photoURL || undefined,
          });
        }
      });
    }

    return users;
  }, [user, currentGroup, groupMembers]);

  // 필터링된 멘션 목록
  const filteredMentions = React.useMemo(() => {
    if (!mentionQuery) return mentionableUsers;
    
    return mentionableUsers.filter(user =>
      user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionableUsers, mentionQuery]);

  // @ 기호 감지 및 멘션 목록 표시
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // @ 기호 감지
    const beforeCursor = newValue.slice(0, cursorPos);
    const match = beforeCursor.match(/@(\w*)$/);
    
    if (match) {
      setShowMentions(true);
      setMentionQuery(match[1]);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [onChange]);

  // 멘션 선택
  const selectMention = useCallback((user: MentionUser) => {
    if (!textareaRef.current) return;

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    
    // @ 기호부터 현재 커서까지의 텍스트를 찾아서 교체
    const beforeMention = beforeCursor.replace(/@\w*$/, '');
    const newValue = beforeMention + `@${user.name} ` + afterCursor;
    
    onChange(newValue);
    setShowMentions(false);
    setMentionQuery('');
    
    // 커서를 멘션 뒤로 이동
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + user.name.length + 2; // @ + name + space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, cursorPosition, onChange]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMentions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMentions.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredMentions[selectedMentionIndex]) {
          selectMention(filteredMentions[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        setMentionQuery('');
      }
    }

    // 기존 onKeyDown 핸들러 호출
    onKeyDown?.(e);
  }, [showMentions, filteredMentions, selectedMentionIndex, selectMention, onKeyDown]);

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionListRef.current &&
        !mentionListRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
        setMentionQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 멘션 목록 스크롤
  useEffect(() => {
    if (showMentions && mentionListRef.current) {
      const selectedElement = mentionListRef.current.children[selectedMentionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [showMentions, selectedMentionIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "min-h-[80px] resize-none pr-8",
            className
          )}
          disabled={disabled}
        />
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            title="멘션 (@)"
          >
            <AtSign className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 멘션 목록 */}
      {showMentions && filteredMentions.length > 0 && (
        <div
          ref={mentionListRef}
          className="absolute z-50 mt-1 w-64 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {filteredMentions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => selectMention(user)}
              className={cn(
                "w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors",
                index === selectedMentionIndex && "bg-blue-50 border-blue-200"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 멘션된 사용자 표시 */}
      {value.includes('@') && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mentionableUsers.map(user => {
            if (value.includes(`@${user.name}`)) {
              return (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="text-xs"
                >
                  @{user.name}
                </Badge>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};
