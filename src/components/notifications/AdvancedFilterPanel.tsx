import { useState } from 'react';
import { Calendar, Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/typography';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { AdvancedFilters } from '../../types/notification';

interface AdvancedFilterPanelProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AdvancedFilterPanel = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onToggle,
}: AdvancedFilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  const handleFilterChange = (key: keyof AdvancedFilters, value: string | string[] | { start: Date | null; end: Date | null }) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: AdvancedFilters = {
      dateRange: { start: null, end: null },
      priority: [],
      type: [],
      status: [],
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setLocalFilters(defaultFilters);
    onClearFilters();
  };

  const hasActiveFilters = () => {
    return (
      localFilters.search.trim() !== '' ||
      localFilters.priority.length > 0 ||
      localFilters.type.length > 0 ||
      localFilters.status.length > 0 ||
      localFilters.dateRange.start !== null ||
      localFilters.dateRange.end !== null
    );
  };

  const priorityOptions = [
    { value: 'high', label: '높음' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '낮음' },
  ];

  const typeOptions = [
    { value: 'task', label: '할일' },
    { value: 'group', label: '그룹' },
    { value: 'system', label: '시스템' },
    { value: 'reminder', label: '리마인더' },
  ];

  const statusOptions = [
    { value: 'unread', label: '읽지 않음' },
    { value: 'read', label: '읽음' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: '생성일' },
    { value: 'priority', label: '우선순위' },
    { value: 'type', label: '타입' },
  ];

  return (
    <GlassCard variant="light" className="mb-6">
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white/80" />
            <Typography.H4 className="text-white font-pretendard text-lg">
              고급 필터
            </Typography.H4>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
                <span className="ml-1">초기화</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white/80 hover:text-white"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              placeholder="알림 검색..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {isOpen && (
          <div className="space-y-4">
            {/* 날짜 범위 */}
            <div>
              <Typography.Label className="text-white/80 mb-2 block">
                날짜 범위
              </Typography.Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal bg-white/10 border-white/20 text-white',
                        !localFilters.dateRange.start && 'text-white/60'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.start ? (
                        format(localFilters.dateRange.start, 'PPP', { locale: ko })
                      ) : (
                        <span>시작일 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.dateRange.start}
                      onSelect={(date) =>
                        handleFilterChange('dateRange', {
                          ...localFilters.dateRange,
                          start: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal bg-white/10 border-white/20 text-white',
                        !localFilters.dateRange.end && 'text-white/60'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.end ? (
                        format(localFilters.dateRange.end, 'PPP', { locale: ko })
                      ) : (
                        <span>종료일 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.dateRange.end}
                      onSelect={(date) =>
                        handleFilterChange('dateRange', {
                          ...localFilters.dateRange,
                          end: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 필터 옵션들 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 우선순위 */}
              <div>
                <Typography.Label className="text-white/80 mb-2 block">
                  우선순위
                </Typography.Label>
                <div className="space-y-2">
                  {priorityOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.priority.includes(option.value)}
                        onChange={(e) => {
                          const newPriority = e.target.checked
                            ? [...localFilters.priority, option.value]
                            : localFilters.priority.filter((p) => p !== option.value);
                          handleFilterChange('priority', newPriority);
                        }}
                        className="mr-2"
                      />
                      <span className="text-white/80 text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 타입 */}
              <div>
                <Typography.Label className="text-white/80 mb-2 block">
                  타입
                </Typography.Label>
                <div className="space-y-2">
                  {typeOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.type.includes(option.value)}
                        onChange={(e) => {
                          const newType = e.target.checked
                            ? [...localFilters.type, option.value]
                            : localFilters.type.filter((t) => t !== option.value);
                          handleFilterChange('type', newType);
                        }}
                        className="mr-2"
                      />
                      <span className="text-white/80 text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 상태 */}
              <div>
                <Typography.Label className="text-white/80 mb-2 block">
                  상태
                </Typography.Label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.status.includes(option.value)}
                        onChange={(e) => {
                          const newStatus = e.target.checked
                            ? [...localFilters.status, option.value]
                            : localFilters.status.filter((s) => s !== option.value);
                          handleFilterChange('status', newStatus);
                        }}
                        className="mr-2"
                      />
                      <span className="text-white/80 text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 정렬 */}
              <div>
                <Typography.Label className="text-white/80 mb-2 block">
                  정렬
                </Typography.Label>
                <div className="space-y-2">
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={localFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="desc">내림차순</option>
                    <option value="asc">오름차순</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 적용 버튼 */}
            <div className="flex justify-end pt-4 border-t border-white/20">
              <Button
                onClick={handleApplyFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                필터 적용
              </Button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
