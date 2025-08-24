import React from 'react';
import { Bell, X } from 'lucide-react';
import { Typography } from '../../ui/typography';
import { cn } from '../../../lib/utils';
import { FormData } from './taskForm.types';

const reminderOptions = [
  '10분 전',
  '30분 전',
  '1시간 전',
  '1일 전',
  '1주일 전',
];

interface TaskRemindersProps {
  formData: FormData;
  errors: Record<string, string>;
  onFormDataChange: (field: keyof FormData, value: any) => void;
}

export const TaskReminders: React.FC<TaskRemindersProps> = React.memo(({
  formData,
  errors,
  onFormDataChange,
}) => {
  const handleAddReminder = React.useCallback((reminder: string) => {
    if (!formData.reminders.includes(reminder)) {
      onFormDataChange('reminders', [...formData.reminders, reminder]);
    }
  }, [formData.reminders, onFormDataChange]);

  const handleRemoveReminder = React.useCallback((reminderToRemove: string) => {
    onFormDataChange('reminders', formData.reminders.filter(reminder => reminder !== reminderToRemove));
  }, [formData.reminders, onFormDataChange]);

  return (
    <div className="space-y-6">
      <Typography.H3 className="flex items-center gap-2">
        <Bell className="w-5 h-5" />
        알림 설정
      </Typography.H3>

      <div>
        <Typography.Label className="block mb-3">
          알림 시간 선택
        </Typography.Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {reminderOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAddReminder(option)}
              disabled={formData.reminders.includes(option)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                'hover:bg-blue-50 hover:border-blue-300',
                formData.reminders.includes(option)
                  ? 'bg-blue-100 border-blue-400 text-blue-700 cursor-not-allowed'
                  : 'bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-blue-50'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {formData.reminders.length > 0 && (
        <div>
          <Typography.Label className="block mb-2">
            선택된 알림
          </Typography.Label>
          <div className="space-y-2">
            {formData.reminders.map((reminder) => (
              <div
                key={reminder}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <span className="text-sm text-blue-700">{reminder}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveReminder(reminder)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  aria-label={`${reminder} 알림 제거`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

TaskReminders.displayName = 'TaskReminders';
