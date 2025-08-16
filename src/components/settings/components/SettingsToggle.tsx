import React from 'react';
import type { SettingsToggleProps } from '../types';

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <p className="font-medium text-white">{label}</p>
        {description && (
          <p className="text-sm text-white/70">{description}</p>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
          ${checked ? 'bg-primary-500' : 'bg-gray-300'}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        role="switch"
        aria-checked={checked}
        aria-labelledby={`toggle-${label.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className={`
          absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform top-0.5
          ${checked ? 'translate-x-6' : 'translate-x-0.5'}
        `} />
      </button>
    </div>
  );
};