import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '../../lib/logger';
import { cn } from '../../lib/utils';
import { Typography } from '../ui/typography';
import type { ChatSearchResult } from '../../types/chat';

interface ChatSearchProps {
  onSearch: (query: string) => Promise<ChatSearchResult[]>;
  onSelectResult: (result: ChatSearchResult) => void;
  onClose: () => void;
  className?: string;
}

export function ChatSearch({
  onSearch,
  onSelectResult,
  onClose,
  className,
}: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 검색 실행
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearch(query);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      logger.error('ChatSearch', 'Search failed', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  // 검색어 변경 시 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  // 검색 결과 하이라이트
  const highlightText = (text: string, indices: number[], query: string) => {
    if (indices.length === 0) return text;

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    indices.forEach((index) => {
      // 검색어 이전 텍스트
      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index));
      }
      
      // 하이라이트된 검색어
      parts.push(
        <span key={index} className="bg-yellow-400/50 text-black font-semibold">
          {text.slice(index, index + query.length)}
        </span>
      );
      
      lastIndex = index + query.length;
    });

    // 남은 텍스트
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          onSelectResult(searchResults[selectedIndex]);
          onClose();
        }
        break;
    }
  };

  // 검색 결과 선택
  const handleResultClick = (result: ChatSearchResult) => {
    onSelectResult(result);
    onClose();
  };

  // 시간 포맷팅
  const formatTime = (timestamp: Date | string | { toDate: () => Date } | null) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 검색..."
          className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          autoFocus
        />
        <button
          onClick={onClose}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="text-white/50 w-4 h-4" />
        </button>
      </div>

      {/* 검색 결과 */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl max-h-96 overflow-y-auto z-50"
        >
          {isSearching ? (
            <div className="p-4 text-center">
              <Typography.Body className="text-gray-600">
                검색 중...
              </Typography.Body>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center">
              <Typography.Body className="text-gray-600">
                검색 결과가 없습니다.
              </Typography.Body>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <div
                  key={result.messageId}
                  className={cn(
                    'px-4 py-3 cursor-pointer hover:bg-white/20 transition-colors',
                    selectedIndex === index && 'bg-blue-500/20'
                  )}
                  onClick={() => handleResultClick(result)}
                >
                  {/* 사용자 정보 */}
                  <div className="flex items-center justify-between mb-1">
                    <Typography.Caption className="text-gray-700 font-semibold">
                      {result.userName}
                    </Typography.Caption>
                    <Typography.Caption className="text-gray-500">
                      {formatTime(result.timestamp)}
                    </Typography.Caption>
                  </div>

                  {/* 메시지 내용 */}
                  <Typography.Body className="text-gray-800 text-sm leading-relaxed">
                    {highlightText(result.message, result.highlightIndices, searchQuery)}
                  </Typography.Body>

                  {/* 관련도 점수 */}
                  <div className="mt-1">
                    <Typography.Caption className="text-gray-500">
                      관련도: {result.relevance}%
                    </Typography.Caption>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 키보드 단축키 안내 */}
      {showResults && searchResults.length > 0 && (
        <div className="mt-2 text-center">
          <Typography.Caption className="text-white/50 text-xs">
            <ArrowUp className="inline w-3 h-3 mx-1" />
            <ArrowDown className="inline w-3 h-3 mx-1" />
            키로 이동 • Enter로 선택 • Esc로 닫기
          </Typography.Caption>
        </div>
      )}
    </div>
  );
}
