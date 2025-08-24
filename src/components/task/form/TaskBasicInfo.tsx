import {
  Briefcase,
  FileText,
  Home,
  MapPin,
  ShoppingCart,
  UserIcon,
} from 'lucide-react';
import React from 'react';
import { cn } from '../../../lib/utils';
import { Typography } from '../../ui/typography';
import { CategoryOption, FormData, PriorityOption } from './taskForm.types';

const categories: CategoryOption[] = [
  {
    value: 'household',
    label: '집안일',
    icon: Home,
    color: 'from-blue-400 to-blue-600',
  },
  {
    value: 'shopping',
    label: '쇼핑',
    icon: ShoppingCart,
    color: 'from-green-400 to-green-600',
  },
  {
    value: 'work',
    label: '업무',
    icon: Briefcase,
    color: 'from-purple-400 to-purple-600',
  },
  {
    value: 'personal',
    label: '개인',
    icon: UserIcon,
    color: 'from-pink-400 to-pink-600',
  },
  {
    value: 'travel',
    label: '여행',
    icon: MapPin,
    color: 'from-orange-400 to-orange-600',
  },
  {
    value: 'other',
    label: '기타',
    icon: FileText,
    color: 'from-gray-400 to-gray-600',
  },
];

const priorities: PriorityOption[] = [
  {
    value: 'low',
    label: '낮음',
    gradient: 'from-green-400 to-green-500',
    borderColor: 'border-green-400',
  },
  {
    value: 'medium',
    label: '보통',
    gradient: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-400',
  },
  {
    value: 'high',
    label: '높음',
    gradient: 'from-orange-400 to-orange-500',
    borderColor: 'border-orange-400',
  },
  {
    value: 'urgent',
    label: '긴급',
    gradient: 'from-red-400 to-red-500',
    borderColor: 'border-red-400',
  },
];

interface TaskBasicInfoProps {
  formData: FormData;
  errors: Record<string, string>;
  onFormDataChange: (field: keyof FormData, value: any) => void;
}

export const TaskBasicInfo: React.FC<TaskBasicInfoProps> = React.memo(
  ({ formData, errors, onFormDataChange }) => {
    // 메모이제이션된 핸들러들
    const handleTitleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFormDataChange('title', e.target.value);
      },
      [onFormDataChange]
    );

    const handleDescriptionChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onFormDataChange('description', e.target.value);
      },
      [onFormDataChange]
    );

    const handleCategoryChange = React.useCallback(
      (category: string) => {
        onFormDataChange('category', category);
      },
      [onFormDataChange]
    );

    const handlePriorityChange = React.useCallback(
      (priority: string) => {
        onFormDataChange('priority', priority);
      },
      [onFormDataChange]
    );
    return (
      <div className="space-y-6">
        {/* 제목 */}
        <div>
          <Typography.Label htmlFor="title" className="block mb-2">
            제목 *
          </Typography.Label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200',
              errors.title ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="할일 제목을 입력하세요"
            aria-describedby={errors.title ? 'title-error' : undefined}
            aria-required="true"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <Typography.Small id="title-error" className="text-red-500 mt-1">
              {errors.title}
            </Typography.Small>
          )}
        </div>

        {/* 설명 */}
        <div>
          <Typography.Label htmlFor="description" className="block mb-2">
            설명
          </Typography.Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            rows={3}
            className={cn(
              'w-full px-4 py-3 rounded-lg border bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200 resize-none'
            )}
            placeholder="할일에 대한 자세한 설명을 입력하세요"
            aria-describedby="description-help"
          />
          <Typography.Small
            id="description-help"
            className="text-gray-500 mt-1"
          >
            할일에 대한 자세한 설명을 입력하세요 (선택사항)
          </Typography.Small>
        </div>

        {/* 카테고리 */}
        <div>
          <Typography.Label className="block mb-3">카테고리</Typography.Label>
          <div
            className="grid grid-cols-3 gap-3"
            role="radiogroup"
            aria-labelledby="category-label"
          >
            <div id="category-label" className="sr-only">
              할일 카테고리 선택
            </div>
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategoryChange(category.value)}
                  className={cn(
                    'flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200',
                    'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    formData.category === category.value
                      ? `border-blue-500 bg-gradient-to-br ${category.color} text-white`
                      : 'border-gray-300 bg-white/80 backdrop-blur-sm hover:border-gray-400 text-gray-900'
                  )}
                  aria-pressed={formData.category === category.value}
                  aria-label={`${category.label} 카테고리 선택`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <Typography.Small className="text-center">
                    {category.label}
                  </Typography.Small>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우선순위 */}
        <div>
          <Typography.Label className="block mb-3">우선순위</Typography.Label>
          <div className="grid grid-cols-4 gap-3">
            {priorities.map(priority => (
              <button
                key={priority.value}
                type="button"
                onClick={() => handlePriorityChange(priority.value)}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200',
                  'focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 outline-none',
                  formData.priority === priority.value
                    ? `border-blue-400 bg-gradient-to-r ${priority.gradient} text-white`
                    : `border-gray-300 bg-white/80 backdrop-blur-sm text-gray-900`
                )}
                aria-pressed={formData.priority === priority.value}
              >
                <Typography.Small className="text-center font-medium">
                  {priority.label}
                </Typography.Small>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

TaskBasicInfo.displayName = 'TaskBasicInfo';
