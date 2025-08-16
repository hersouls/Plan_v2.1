import React from 'react';
import { cn } from '../../../lib/utils';
import { ResponsiveGrid } from './ResponsiveGrid';
import { ResponsiveText } from './ResponsiveText';
import { GlassCard } from '../GlassCard';

interface StatItem {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
  borderColor?: string;
}

interface ResponsiveStatsProps {
  stats: StatItem[];
  className?: string;
  showProgress?: boolean;
  progressValue?: number;
  progressColor?: string;
}

export const ResponsiveStats: React.FC<ResponsiveStatsProps> = ({
  stats,
  className,
  showProgress = false,
  progressValue = 0,
  progressColor = 'from-blue-500 to-purple-600',
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 통계 그리드 */}
      <ResponsiveGrid type="stats" gap="md">
        {stats.map((stat, index) => (
          <GlassCard
            key={index}
            variant="light"
            className={cn(
              'text-center rounded-xl bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-out',
              stat.borderColor && `border-l-4 ${stat.borderColor}`
            )}
          >
            <div className="p-4 sm:p-5 lg:p-6 xl:p-8">
              {/* 아이콘 */}
              {stat.icon && (
                <div className="flex justify-center mb-2">
                  {stat.icon}
                </div>
              )}
              
              {/* 값 */}
              <ResponsiveText
                type="title"
                weight="bold"
                color={stat.color || 'text-blue-600'}
                className="mb-1"
              >
                {stat.value}
              </ResponsiveText>
              
              {/* 라벨 */}
              <ResponsiveText
                type="caption"
                color="text-gray-600"
              >
                {stat.label}
              </ResponsiveText>
            </div>
          </GlassCard>
        ))}
      </ResponsiveGrid>

      {/* 진행률 바 */}
      {showProgress && (
        <div className="space-y-3 lg:space-y-4 xl:space-y-6">
          <div className="flex items-center justify-between">
            <ResponsiveText
              type="caption"
              weight="medium"
              color="text-white"
            >
              완료율
            </ResponsiveText>
            <ResponsiveText
              type="caption"
              weight="bold"
              color="text-white"
            >
              {progressValue}%
            </ResponsiveText>
          </div>

          <div className="w-full bg-gray-700/50 rounded-full h-3 sm:h-4 lg:h-5 xl:h-6 overflow-hidden">
            <div
              className={cn(
                'bg-gradient-to-r h-3 sm:h-4 lg:h-5 xl:h-6 rounded-full transition-all duration-500 ease-out',
                progressColor
              )}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
