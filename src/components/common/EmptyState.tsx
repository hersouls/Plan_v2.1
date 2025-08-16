import { ReactNode } from 'react';
import { 
  Plus, Search, Users, CheckSquare, Calendar,
  FileText, Inbox, AlertCircle, Filter
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';

interface EmptyStateProps {
  icon?: 'tasks' | 'search' | 'users' | 'calendar' | 'files' | 'inbox' | 'error' | 'filter' | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: 'default' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  illustration?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap = {
  tasks: CheckSquare,
  search: Search,
  users: Users,
  calendar: Calendar,
  files: FileText,
  inbox: Inbox,
  error: AlertCircle,
  filter: Filter
};

const sizeStyles = {
  sm: {
    container: 'py-8',
    icon: 32,
    title: 'text-base-ko',
    description: 'text-sm'
  },
  md: {
    container: 'py-12',
    icon: 48,
    title: 'text-lg-ko',
    description: 'text-base'
  },
  lg: {
    container: 'py-16',
    icon: 64,
    title: 'text-xl-ko',
    description: 'text-lg'
  }
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'md'
}: EmptyStateProps) {
  const styles = sizeStyles[size];
  
  const renderIcon = () => {
    if (illustration) {
      return illustration;
    }

    if (typeof icon === 'string') {
      const IconComponent = iconMap[icon as keyof typeof iconMap];
      if (IconComponent) {
        return (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <IconComponent size={styles.icon} className="text-gray-400" />
          </div>
        );
      }
    }

    if (icon) {
      return (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`text-center ${styles.container}`}>
      {renderIcon()}
      
      <h3 className={`font-semibold text-gray-900 mb-2 ${styles.title}`}>
        {title}
      </h3>
      
      <p className={`text-gray-600 mb-6 max-w-md mx-auto ${styles.description}`}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <WaveButton
              onClick={action.onClick}
              variant={action.variant}
            >
              {action.icon}
              {action.label}
            </WaveButton>
          )}
          
          {secondaryAction && (
            <WaveButton
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </WaveButton>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;

// Pre-configured empty states for common scenarios
export function EmptyTasks({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon="tasks"
      title="할일이 없습니다"
      description="첫 번째 할일을 생성해서 시작해보세요"
      action={{
        label: '할일 만들기',
        onClick: onCreateTask,
        icon: <Plus size={16} />
      }}
    />
  );
}

export function EmptySearchResults({ onClearSearch }: { onClearSearch: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="검색 결과가 없습니다"
      description="다른 키워드로 검색하거나 필터를 조정해보세요"
      action={{
        label: '검색 초기화',
        onClick: onClearSearch,
        variant: 'ghost'
      }}
      size="sm"
    />
  );
}

export function EmptyGroupMembers({ onInviteMembers }: { onInviteMembers: () => void }) {
  return (
    <GlassCard variant="light" className="p-8">
      <EmptyState
        icon="users"
        title="그룹에 멤버가 없습니다"
        description="가족이나 친구를 초대해서 함께 할일을 관리해보세요"
        action={{
          label: '멤버 초대하기',
          onClick: onInviteMembers,
          icon: <Plus size={16} />
        }}
        size="sm"
      />
    </GlassCard>
  );
}

export function EmptyCalendar({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon="calendar"
      title="예정된 할일이 없습니다"
      description="일정을 추가해서 계획을 세워보세요"
      action={{
        label: '일정 추가',
        onClick: onCreateTask,
        icon: <Plus size={16} />
      }}
      size="sm"
    />
  );
}

export function ErrorEmptyState({ 
  title = '데이터를 불러올 수 없습니다',
  description = '네트워크 연결을 확인하고 다시 시도해주세요',
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      icon="error"
      title={title}
      description={description}
      action={{
        label: '다시 시도',
        onClick: onRetry,
        icon: <Plus size={16} />
      }}
    />
  );
}

// Skeleton loading state for lists
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <GlassCard key={index} variant="light" className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded"></div>
                <div className="h-3 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}