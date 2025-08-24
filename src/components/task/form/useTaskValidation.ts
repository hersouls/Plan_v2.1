import { useCallback } from 'react';
import { FormData } from './taskForm.types';

export const useTaskValidation = () => {
  const validateForm = useCallback((formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    // 제목 검증
    if (!formData.title.trim()) {
      errors.title = '제목을 입력해주세요';
    } else if (formData.title.trim().length > 100) {
      errors.title = '제목은 100자 이하여야 합니다';
    }

    // 설명 검증
    if (formData.description && formData.description.length > 1000) {
      errors.description = '설명은 1000자 이하여야 합니다';
    }

    // 그룹 선택 검증
    if (formData.taskType === 'group' && !formData.selectedGroupId) {
      errors.selectedGroupId = '그룹을 선택해주세요';
    }

    // 담당자 검증
    if (formData.taskType === 'group' && !formData.assigneeId) {
      errors.assigneeId = '담당자를 선택해주세요';
    }

    // 마감일 검증
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.dueDate = '마감일은 오늘 이후여야 합니다';
      }
    }

    // 마감 시간 검증
    if (formData.dueTime && !formData.dueDate) {
      errors.dueTime = '마감일을 먼저 선택해주세요';
    }

    // 예상 소요 시간 검증
    if (formData.estimatedMinutes) {
      const minutes = parseInt(formData.estimatedMinutes);
      if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
        errors.estimatedMinutes = '예상 소요 시간은 1분에서 1440분(24시간) 사이여야 합니다';
      }
    }

    // 반복 설정 검증
    if (formData.recurring.enabled) {
      if (formData.recurring.interval < 1 || formData.recurring.interval > 365) {
        errors.recurringInterval = '반복 간격은 1에서 365 사이여야 합니다';
      }

      if (formData.recurring.endDate) {
        const endDate = new Date(formData.recurring.endDate);
        const dueDate = formData.dueDate ? new Date(formData.dueDate) : new Date();
        
        if (endDate <= dueDate) {
          errors.recurringEndDate = '반복 종료일은 마감일 이후여야 합니다';
        }
      }
    }

    // 태그 검증
    if (formData.tags.length > 10) {
      errors.tags = '태그는 최대 10개까지 추가할 수 있습니다';
    }

    // 위치 검증
    if (formData.location && formData.location.length > 200) {
      errors.location = '위치는 200자 이하여야 합니다';
    }

    return errors;
  }, []);

  const validateField = useCallback((field: keyof FormData, value: any): string | null => {
    switch (field) {
      case 'title':
        if (!value?.trim()) {
          return '제목을 입력해주세요';
        }
        if (value.trim().length > 100) {
          return '제목은 100자 이하여야 합니다';
        }
        break;

      case 'description':
        if (value && value.length > 1000) {
          return '설명은 1000자 이하여야 합니다';
        }
        break;

      case 'selectedGroupId':
        if (value === 'group' && !value) {
          return '그룹을 선택해주세요';
        }
        break;

      case 'assigneeId':
        if (value === 'group' && !value) {
          return '담당자를 선택해주세요';
        }
        break;

      case 'dueDate':
        if (value) {
          const dueDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (dueDate < today) {
            return '마감일은 오늘 이후여야 합니다';
          }
        }
        break;

      case 'estimatedMinutes':
        if (value) {
          const minutes = parseInt(value);
          if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
            return '예상 소요 시간은 1분에서 1440분(24시간) 사이여야 합니다';
          }
        }
        break;

      case 'location':
        if (value && value.length > 200) {
          return '위치는 200자 이하여야 합니다';
        }
        break;
    }

    return null;
  }, []);

  return {
    validateForm,
    validateField,
  };
};
