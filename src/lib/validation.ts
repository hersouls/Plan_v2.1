/**
 * Comprehensive validation utilities for forms and data
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate a single field
   */
  validateField(value: any, rules: ValidationRule): string | null {
    // Required validation
    if (rules.required && this.isEmpty(value)) {
      return rules.message || '이 필드는 필수입니다.';
    }

    // Skip other validations if value is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return null;
    }

    // String-based validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `최소 ${rules.minLength}자 이상 입력해주세요.`;
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        return (
          rules.message || `최대 ${rules.maxLength}자까지 입력 가능합니다.`
        );
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.message || '올바른 형식으로 입력해주세요.';
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Validate multiple fields
   */
  validateFields(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): ValidationResult {
    const errors: Record<string, string> = {};

    Object.keys(rules).forEach(fieldName => {
      const value = data[fieldName];
      const fieldRules = rules[fieldName];
      const error = this.validateField(value, fieldRules);

      if (error) {
        errors[fieldName] = error;
      }
    });

    const isValid = Object.keys(errors).length === 0;
    const firstError = isValid ? undefined : errors[Object.keys(errors)[0]];

    return {
      isValid,
      errors,
      firstError,
    };
  }

  /**
   * Profile validation rules
   */
  getProfileValidationRules(): Record<string, ValidationRule> {
    return {
      displayName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: '이름은 2-50자 사이로 입력해주세요.',
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '올바른 이메일 주소를 입력해주세요.',
      },
      phone: {
        required: false,
        pattern: /^[0-9\-\+\(\)\s]+$/,
        message: '올바른 전화번호 형식을 입력해주세요.',
      },
      bio: {
        required: false,
        maxLength: 200,
        message: '자기소개는 200자 이하로 입력해주세요.',
      },
      location: {
        required: false,
        maxLength: 100,
        message: '위치는 100자 이하로 입력해주세요.',
      },
    };
  }

  /**
   * Group validation rules
   */
  getGroupValidationRules(): Record<string, ValidationRule> {
    return {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: '그룹명은 2-50자 사이로 입력해주세요.',
      },
      description: {
        required: false,
        maxLength: 200,
        message: '그룹 설명은 200자 이하로 입력해주세요.',
      },
    };
  }

  /**
   * Task validation rules
   */
  getTaskValidationRules(): Record<string, ValidationRule> {
    return {
      title: {
        required: true,
        minLength: 1,
        maxLength: 100,
        message: '할일 제목은 1-100자 사이로 입력해주세요.',
      },
      description: {
        required: false,
        maxLength: 500,
        message: '할일 설명은 500자 이하로 입력해주세요.',
      },
      category: {
        required: false,
        maxLength: 50,
        message: '카테고리는 50자 이하로 입력해주세요.',
      },
    };
  }

  /**
   * Comment validation rules
   */
  getCommentValidationRules(): Record<string, ValidationRule> {
    return {
      content: {
        required: true,
        minLength: 1,
        maxLength: 500,
        message: '댓글은 1-500자 사이로 입력해주세요.',
      },
    };
  }

  /**
   * Invitation validation rules
   */
  getInvitationValidationRules(): Record<string, ValidationRule> {
    return {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '올바른 이메일 주소를 입력해주세요.',
      },
      message: {
        required: false,
        maxLength: 200,
        message: '초대 메시지는 200자 이하로 입력해주세요.',
      },
    };
  }

  /**
   * Settings validation rules
   */
  getSettingsValidationRules(): Record<string, ValidationRule> {
    return {
      language: {
        required: true,
        pattern: /^[a-z]{2}$/,
        message: '올바른 언어 코드를 선택해주세요.',
      },
      timezone: {
        required: true,
        message: '시간대를 선택해주세요.',
      },
      dateFormat: {
        required: true,
        message: '날짜 형식을 선택해주세요.',
      },
    };
  }

  /**
   * Password validation rules
   */
  getPasswordValidationRules(): Record<string, ValidationRule> {
    return {
      password: {
        required: true,
        minLength: 8,
        pattern:
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        message:
          '비밀번호는 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다.',
      },
      confirmPassword: {
        required: true,
        custom: (value, data) => {
          if (value !== data?.password) {
            return '비밀번호가 일치하지 않습니다.';
          }
          return null;
        },
      },
    };
  }

  /**
   * File validation
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      maxFiles?: number;
    } = {}
  ): string | null {
    const {
      maxSize = Number.MAX_SAFE_INTEGER, // 파일 용량 제한 없음
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    } = options;

    // 파일 용량 제한 없음

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `지원되지 않는 파일 형식입니다. ${allowedTypes.join(
        ', '
      )} 형식만 지원됩니다.`;
    }

    return null;
  }

  /**
   * Email validation
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Phone number validation
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * URL validation
   */
  isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Validate Korean text (useful for Korean names)
   */
  isValidKorean(text: string): boolean {
    const koreanRegex = /^[가-힣\s]+$/;
    return koreanRegex.test(text);
  }

  /**
   * Validate date range
   */
  isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate;
  }

  /**
   * Custom validation for specific business rules
   */
  validateBusinessRules(
    data: any,
    type: 'task' | 'group' | 'user'
  ): ValidationResult {
    const errors: Record<string, string> = {};

    switch (type) {
      case 'task':
        // Task-specific business rules
        if (data.dueDate && new Date(data.dueDate) < new Date()) {
          errors.dueDate = '마감일은 현재 시간 이후여야 합니다.';
        }
        if (
          data.priority &&
          !['low', 'medium', 'high', 'urgent'].includes(data.priority)
        ) {
          errors.priority = '올바른 우선순위를 선택해주세요.';
        }
        break;

      case 'group':
        // Group-specific business rules
        if (data.memberIds && data.memberIds.length > 50) {
          errors.memberIds = '그룹 멤버는 최대 50명까지 가능합니다.';
        }
        break;

      case 'user':
        // User-specific business rules
        if (data.birthDate && new Date(data.birthDate) > new Date()) {
          errors.birthDate = '생년월일은 현재 날짜 이전이어야 합니다.';
        }
        break;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      firstError:
        Object.keys(errors).length > 0
          ? errors[Object.keys(errors)[0]]
          : undefined,
    };
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();

// Default export for convenience
export default validationService;
