import React from 'react';
import { GlassCard } from '../../ui/GlassCard';
import type { SettingsGroupProps } from '../types';

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  description,
  children,
  className = '',
  icon
}) => {
  return (
    <GlassCard variant="light" className={`p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="text-blue-400">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white font-pretendard">
            {title}
          </h3>
        </div>
        {description && (
          <p className="text-sm text-white/70 mt-1 font-pretendard">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </GlassCard>
  );
};