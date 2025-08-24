import { useState, useCallback } from 'react';
import { FormData } from './taskForm.types';

export const useTaskForm = (initialData?: Partial<FormData>) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    taskType: 'personal',
    selectedGroupId: '',
    assigneeId: '',
    priority: 'medium',
    category: 'other',
    dueDate: '',
    dueTime: '',
    tags: [],
    recurring: {
      enabled: false,
      frequency: 'daily',
      interval: 1,
      endDate: '',
    },
    reminders: [],
    estimatedMinutes: '',
    location: '',
    attachments: [],
    urls: [],
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // 에러가 있으면 해당 필드의 에러를 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const updateRecurring = useCallback((field: keyof FormData['recurring'], value: any) => {
    setFormData(prev => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [field]: value,
      },
    }));
  }, []);

  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
      setTagInput('');
    }
  }, [formData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  const addReminder = useCallback((reminder: string) => {
    if (!formData.reminders.includes(reminder)) {
      setFormData(prev => ({
        ...prev,
        reminders: [...prev.reminders, reminder],
      }));
    }
  }, [formData.reminders]);

  const removeReminder = useCallback((reminderToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(reminder => reminder !== reminderToRemove),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      taskType: 'personal',
      selectedGroupId: '',
      assigneeId: '',
      priority: 'medium',
      category: 'other',
      dueDate: '',
      dueTime: '',
      tags: [],
      recurring: {
        enabled: false,
        frequency: 'daily',
        interval: 1,
        endDate: '',
      },
      reminders: [],
      estimatedMinutes: '',
      location: '',
      attachments: [],
      urls: [],
      ...initialData,
    });
    setErrors({});
    setTagInput('');
  }, [initialData]);

  return {
    formData,
    errors,
    tagInput,
    setTagInput,
    updateFormData,
    updateRecurring,
    addTag,
    removeTag,
    addReminder,
    removeReminder,
    setErrors,
    resetForm,
  };
};
