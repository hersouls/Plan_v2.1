import React, { useState } from 'react';
import { Plus, X, CheckSquare, Users, Calendar } from 'lucide-react';
import { WaveButton } from '../ui/WaveButton';

interface FloatingAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FloatingAction[];
  onMainAction?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'md' | 'lg';
  hidden?: boolean;
}

const defaultActions: FloatingAction[] = [
  {
    id: 'task',
    label: '할일 추가',
    icon: <CheckSquare size={20} />,
    onClick: () => {},
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'invite',
    label: '멤버 초대',
    icon: <Users size={20} />,
    onClick: () => {},
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'calendar',
    label: '일정 보기',
    icon: <Calendar size={20} />,
    onClick: () => {},
    color: 'bg-purple-500 hover:bg-purple-600'
  }
];

const positionClasses = {
  'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
  'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2 sm:bottom-6'
};

export function FloatingActionButton({
  actions = defaultActions,
  onMainAction,
  position = 'bottom-right',
  size = 'md',
  hidden = false
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainAction = () => {
    if (onMainAction) {
      onMainAction();
      return;
    }

    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleActionClick = (action: FloatingAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  if (hidden) {
    return null;
  }

  const buttonSize = size === 'lg' ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-12 h-12 sm:w-14 sm:h-14';
  const iconSize = size === 'lg' ? 20 : 18;

  return (
    <div className={`fixed z-40 ${positionClasses[position]}`}>
      {/* Action Items */}
      {isExpanded && actions.length > 0 && (
        <div className="flex flex-col items-center space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-2 sm:gap-3 animate-fade-in"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              {/* Label */}
              <div className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg whitespace-nowrap font-pretendard" style={{ background: 'var(--glass-strong)', color: 'var(--semantic-text-inverse)' }}>
                {action.label}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleActionClick(action)}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg text-white transition-transform
                  hover:scale-110 active:scale-95 touch-comfortable
                  ${action.color || 'bg-primary-500 hover:bg-primary-600'}
                `}
              >
                {React.cloneElement(action.icon as React.ReactElement, { 
                  size: 16,
                  className: 'sm:w-5 sm:h-5'
                })}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={handleMainAction}
        className={`
          ${buttonSize} rounded-full shadow-lg
          bg-primary-500 hover:bg-primary-600 text-white
          transition-all duration-300 hover:scale-110 active:scale-95
          flex items-center justify-center
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {isExpanded ? (
          <X size={iconSize} className="transition-transform duration-300" />
        ) : (
          <Plus size={iconSize} className="transition-transform duration-300" />
        )}
      </button>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export default FloatingActionButton;

// Speed dial variant with different styling
export function SpeedDial({
  actions = defaultActions,
  direction = 'up',
  onClose
}: {
  actions?: FloatingAction[];
  direction?: 'up' | 'down' | 'left' | 'right';
  onClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (!newState && onClose) {
      onClose();
    }
  };

  const directionClasses = {
    up: 'flex-col-reverse',
    down: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row'
  };

  const spacingClasses = {
    up: 'space-y-3',
    down: 'space-y-3',
    left: 'space-x-3',
    right: 'space-x-3'
  };

  return (
    <div className={`flex ${directionClasses[direction]} ${spacingClasses[direction]} items-center`}>
      {/* Actions */}
      {isOpen && actions.map((action, index) => (
        <WaveButton
          key={action.id}
          onClick={() => {
            action.onClick();
            setIsOpen(false);
          }}
          size="sm"
          className={`
            animate-slide-up shadow-lg
            ${action.color || 'bg-white hover:bg-gray-50'}" style={{ color: 'var(--semantic-text-primary)' }}
          `}
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'both'
          }}
        >
          {action.icon}
          <span className="ml-2">{action.label}</span>
        </WaveButton>
      ))}

      {/* Toggle Button */}
      <WaveButton
        onClick={handleToggle}
        className="shadow-lg"
        size="md"
      >
        {isOpen ? <X size={20} /> : <Plus size={20} />}
      </WaveButton>
    </div>
  );
}

// Quick actions that appear on hover/focus
export function QuickActions({
  actions = defaultActions.slice(0, 2),
  trigger,
  className = ''
}: {
  actions?: FloatingAction[];
  trigger: React.ReactNode;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {trigger}
      
      {isVisible && (
        <div className="absolute top-full left-0 mt-2 flex gap-2 z-10">
          {actions.map(action => (
            <WaveButton
              key={action.id}
              onClick={action.onClick}
              size="sm"
              variant="ghost"
              className="shadow-md bg-white/90 backdrop-blur-sm"
            >
              {action.icon}
              <span className="sr-only">{action.label}</span>
            </WaveButton>
          ))}
        </div>
      )}
    </div>
  );
}