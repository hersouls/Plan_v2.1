import React from 'react';
import { cn } from '../../../lib/utils';
import { ResponsiveContainer } from './ResponsiveContainer';
import { ResponsiveText } from './ResponsiveText';
import { ResponsiveButton } from './ResponsiveButton';
import { responsiveLayouts } from '../../../lib/responsive';

interface ResponsiveHeroProps {
  title: string;
  subtitle?: string;
  version?: string;
  greeting?: string;
  date?: string;
  buttons?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'ghost' | 'secondary';
    isActive?: boolean;
  }>;
  className?: string;
  onLogout?: () => void;
}

export const ResponsiveHero: React.FC<ResponsiveHeroProps> = ({
  title,
  subtitle,
  version,
  greeting,
  date,
  buttons = [],
  className,
  onLogout,
}) => {
  return (
    <ResponsiveContainer
      className={cn(
        'relative',
        responsiveLayouts.hero.container,
        className
      )}
    >
      {/* 버튼 그룹 - 절대 위치로 오른쪽 상단 고정 */}
      {buttons.length > 0 && (
        <div className="absolute top-0 right-0 z-10 flex gap-2 sm:gap-3">
          {buttons.map((button, index) => (
            <ResponsiveButton
              key={index}
              variant={button.isActive ? 'primary' : 'ghost'}
              onClick={button.onClick}
              icon={button.icon}
              className={cn(
                'font-pretendard',
                'transition-all duration-300 ease-out',
                'backdrop-blur-sm border border-white/20',
                'shadow-lg',
                button.isActive
                  ? 'bg-blue-500/80 text-white shadow-lg ring-2 ring-blue-400/50'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:shadow-md'
              )}
            >
              {button.label}
            </ResponsiveButton>
          ))}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="mb-6 lg:mb-0">
        {/* 제목 및 버전 배지 */}
        <div className="flex items-center gap-3 lg:gap-4 xl:gap-6 mb-4 lg:mb-6">
          <ResponsiveText
            type="title"
            weight="bold"
            color="text-white"
            className="tracking-ko-tight"
          >
            {title}
          </ResponsiveText>
          
          {version && (
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 rounded-full text-sm lg:text-base xl:text-lg font-medium font-pretendard">
              {version}
            </span>
          )}
        </div>

        {/* 인사말 */}
        {greeting && (
          <div className="mb-2 lg:mb-3 xl:mb-4">
            <ResponsiveText
              type="body"
              color="text-white"
              className="leading-ko-relaxed"
            >
              {greeting}
            </ResponsiveText>
          </div>
        )}

        {/* 날짜 */}
        {date && (
          <ResponsiveText
            type="caption"
            color="text-white/80"
          >
            {date}
          </ResponsiveText>
        )}
      </div>

      {/* 로그아웃 버튼 */}
      {onLogout && (
        <div className="flex justify-end">
          <ResponsiveButton
            variant="ghost"
            onClick={onLogout}
            className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 font-pretendard"
          >
            로그아웃
          </ResponsiveButton>
        </div>
      )}
    </ResponsiveContainer>
  );
};
