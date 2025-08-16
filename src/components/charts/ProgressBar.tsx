import { useMemo } from 'react';
import { CheckCircle, Target, TrendingUp } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  variant?: 'default' | 'gradient' | 'stepped' | 'animated';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showNumbers?: boolean;
  color?: string;
  backgroundColor?: string;
  className?: string;
  steps?: number; // For stepped variant
  animate?: boolean;
}

export function ProgressBar({
  current,
  total,
  label,
  variant = 'default',
  size = 'md',
  showPercentage = true,
  showNumbers = false,
  color,
  backgroundColor,
  className = '',
  steps = 5,
  animate = true
}: ProgressBarProps) {
  const percentage = useMemo(() => {
    if (total === 0) return 0;
    return Math.min((current / total) * 100, 100);
  }, [current, total]);

  const isComplete = current >= total;

  // Size configurations
  const sizeConfig = {
    sm: { height: 'h-2', textSize: 'text-xs', padding: 'p-2' },
    md: { height: 'h-3', textSize: 'text-sm', padding: 'p-3' },
    lg: { height: 'h-4', textSize: 'text-base', padding: 'p-4' }
  };

  const config = sizeConfig[size];

  // Color configurations
  const getProgressColor = () => {
    if (color) return color;
    
    if (isComplete) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getBgColor = () => {
    return backgroundColor || 'bg-gray-200';
  };

  // Render different variants
  const renderProgressBar = () => {
    switch (variant) {
      case 'gradient':
        return (
          <div className={`w-full ${getBgColor()} rounded-full ${config.height} overflow-hidden`}>
            <div
              className={`h-full bg-gradient-to-r from-primary-500 via-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out ${
                animate ? 'animate-progress-fill' : ''
              }`}
              style={{ 
                width: `${percentage}%`,
                transition: animate ? 'width 1s ease-out' : 'none'
              }}
            />
          </div>
        );

      case 'stepped':
        return (
          <div className="flex gap-1">
            {Array.from({ length: steps }, (_, index) => {
              const stepPercentage = ((index + 1) / steps) * 100;
              const isActive = percentage >= stepPercentage;
              const isPartial = percentage > (index / steps) * 100 && percentage < stepPercentage;
              
              return (
                <div
                  key={index}
                  className={`
                    flex-1 ${config.height} rounded-sm transition-all duration-500
                    ${isActive 
                      ? getProgressColor()
                      : isPartial 
                        ? `${getProgressColor()} opacity-50`
                        : getBgColor()
                    }
                  `}
                  style={{
                    animationDelay: animate ? `${index * 0.1}s` : '0s'
                  }}
                />
              );
            })}
          </div>
        );

      case 'animated':
        return (
          <div className={`w-full ${getBgColor()} rounded-full ${config.height} overflow-hidden relative`}>
            <div
              className={`h-full ${getProgressColor()} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
              style={{ width: `${percentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shine" />
              
              {/* Pulse effect for active progress */}
              {!isComplete && percentage > 0 && (
                <div className="absolute right-0 top-0 w-2 h-full bg-white/50 animate-pulse" />
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className={`w-full ${getBgColor()} rounded-full ${config.height} overflow-hidden`}>
            <div
              className={`h-full ${getProgressColor()} rounded-full transition-all duration-500 ease-out ${
                isComplete ? 'animate-pulse' : ''
              }`}
              style={{ 
                width: `${percentage}%`,
                transition: animate ? 'width 0.5s ease-out' : 'none'
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with label and stats */}
      {(label || showPercentage || showNumbers) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {label && (
              <span className={`font-medium text-gray-700 ${config.textSize}`}>
                {label}
              </span>
            )}
            {isComplete && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {showNumbers && (
              <span className={`text-gray-600 ${config.textSize}`}>
                {current}/{total}
              </span>
            )}
            {showPercentage && (
              <span className={`font-semibold ${config.textSize} ${
                isComplete ? 'text-green-600' : 'text-primary-600'
              }`}>
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {renderProgressBar()}

      {/* Status message for completed state */}
      {isComplete && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 font-medium">완료!</span>
        </div>
      )}
    </div>
  );
}

// Specialized progress components
export function TaskProgress({ 
  completed, 
  total, 
  className = '' 
}: { 
  completed: number; 
  total: number; 
  className?: string;
}) {
  return (
    <ProgressBar
      current={completed}
      total={total}
      label="할일 진행률"
      variant="gradient"
      size="md"
      showPercentage={true}
      showNumbers={true}
      className={className}
    />
  );
}

export function GoalProgress({ 
  current, 
  target, 
  label = "목표 달성률",
  className = '' 
}: { 
  current: number; 
  target: number; 
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      
      <ProgressBar
        current={current}
        total={target}
        variant="stepped"
        size="lg"
        showPercentage={true}
        showNumbers={true}
        steps={10}
      />
      
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>0</span>
        <span>{target}</span>
      </div>
    </div>
  );
}

export function StreakProgress({ 
  current, 
  nextMilestone,
  className = '' 
}: { 
  current: number; 
  nextMilestone: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium text-gray-700">다음 목표까지</span>
      </div>
      
      <ProgressBar
        current={current}
        total={nextMilestone}
        variant="animated"
        size="md"
        showNumbers={true}
        color="bg-gradient-to-r from-orange-500 to-red-500"
      />
      
      <div className="mt-2 text-xs text-gray-500">
        {nextMilestone - current}일 남음
      </div>
    </div>
  );
}

export default ProgressBar;