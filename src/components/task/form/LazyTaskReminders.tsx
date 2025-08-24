import React, { Suspense } from 'react';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { FormData } from './taskForm.types';

// 지연 로딩을 위한 동적 import
const TaskReminders = React.lazy(() =>
  import('./TaskReminders').then(module => ({ default: module.TaskReminders }))
);

interface LazyTaskRemindersProps {
  formData: FormData;
  errors: Record<string, string>;
  onFormDataChange: (field: keyof FormData, value: any) => void;
}

export const LazyTaskReminders: React.FC<LazyTaskRemindersProps> = React.memo(
  props => {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-500">
              알림 설정 로딩 중...
            </span>
          </div>
        }
      >
        <TaskReminders {...props} />
      </Suspense>
    );
  }
);

LazyTaskReminders.displayName = 'LazyTaskReminders';
