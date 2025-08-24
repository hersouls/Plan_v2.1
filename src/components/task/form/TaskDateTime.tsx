import { Calendar, Clock } from 'lucide-react';
import React from 'react';
import { cn } from '../../../lib/utils';
import { Typography } from '../../ui/typography';
import { FormData } from './taskForm.types';

interface TaskDateTimeProps {
  formData: FormData;
  errors: Record<string, string>;
  onFormDataChange: (field: keyof FormData, value: any) => void;
}

export const TaskDateTime: React.FC<TaskDateTimeProps> = React.memo(
  ({ formData, errors, onFormDataChange }) => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (메모이제이션)
    const today = React.useMemo(
      () => new Date().toISOString().split('T')[0],
      []
    );

    // 메모이제이션된 핸들러들
    const handleDueDateChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFormDataChange('dueDate', e.target.value);
      },
      [onFormDataChange]
    );

    const handleDueTimeChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFormDataChange('dueTime', e.target.value);
      },
      [onFormDataChange]
    );

    const handleEstimatedMinutesChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFormDataChange('estimatedMinutes', e.target.value);
      },
      [onFormDataChange]
    );

    const handleLocationChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFormDataChange('location', e.target.value);
      },
      [onFormDataChange]
    );

    return (
      <div className="space-y-6">
        <Typography.H3 className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          날짜 및 시간
        </Typography.H3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 마감일 */}
          <div>
            <Typography.Label htmlFor="dueDate" className="block mb-2">
              마감일
            </Typography.Label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleDueDateChange}
              min={today}
              className={cn(
                'w-full px-4 py-3 rounded-lg border bg-white/80 backdrop-blur-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-all duration-200',
                errors.dueDate ? 'border-red-500' : 'border-gray-300'
              )}
              aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
            />
            {errors.dueDate && (
              <Typography.Small
                id="dueDate-error"
                className="text-red-500 mt-1"
              >
                {errors.dueDate}
              </Typography.Small>
            )}
          </div>

          {/* 마감 시간 */}
          <div>
            <Typography.Label htmlFor="dueTime" className="block mb-2">
              마감 시간
            </Typography.Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={handleDueTimeChange}
                className={cn(
                  'w-full pl-10 pr-4 py-3 rounded-lg border bg-white/80 backdrop-blur-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'transition-all duration-200',
                  errors.dueTime ? 'border-red-500' : 'border-gray-300'
                )}
                aria-describedby={errors.dueTime ? 'dueTime-error' : undefined}
              />
            </div>
            {errors.dueTime && (
              <Typography.Small
                id="dueTime-error"
                className="text-red-500 mt-1"
              >
                {errors.dueTime}
              </Typography.Small>
            )}
          </div>
        </div>

        {/* 예상 소요 시간 */}
        <div>
          <Typography.Label htmlFor="estimatedMinutes" className="block mb-2">
            예상 소요 시간 (분)
          </Typography.Label>
          <input
            id="estimatedMinutes"
            type="number"
            value={formData.estimatedMinutes}
            onChange={handleEstimatedMinutesChange}
            min="1"
            max="1440"
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-white/80 backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200',
              errors.estimatedMinutes ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="예: 30"
            aria-describedby={
              errors.estimatedMinutes ? 'estimatedMinutes-error' : undefined
            }
          />
          {errors.estimatedMinutes && (
            <Typography.Small
              id="estimatedMinutes-error"
              className="text-red-500 mt-1"
            >
              {errors.estimatedMinutes}
            </Typography.Small>
          )}
        </div>

        {/* 위치 */}
        <div>
          <Typography.Label htmlFor="location" className="block mb-2">
            위치
          </Typography.Label>
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={handleLocationChange}
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-white/80 backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200',
              errors.location ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="예: 회사, 집, 카페 등"
            aria-describedby={errors.location ? 'location-error' : undefined}
          />
          {errors.location && (
            <Typography.Small id="location-error" className="text-red-500 mt-1">
              {errors.location}
            </Typography.Small>
          )}
        </div>
      </div>
    );
  }
);

TaskDateTime.displayName = 'TaskDateTime';
