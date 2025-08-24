import {
  Calendar,
  Camera,
  Check,
  Edit3,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import logger from '../../../lib/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { validationService } from '../../../lib/validation';
import { InlineLoading } from '../../common/LoadingSpinner';
import { GlassCard } from '../../ui/GlassCard';
import { WaveButton } from '../../ui/WaveButton';
import { SettingsGroup } from '../components';
import { useSettingsContext } from '../contexts/SettingsContextBase';
import type { SettingsSectionProps } from '../types';
import type { UserProfile } from '../types';
import logger from '../../../lib/logger';

export function ProfileSection({
  isActive,
  settings,
  onUpdate,
  saving = false,
}: SettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuth();
  const { uploadAvatar, deleteAvatar, uploadingAvatar } = useSettingsContext();

  // 단순한 상태 관리 - useEffect 없이
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // editData는 항상 현재 settings.profile을 사용하거나 편집 중일 때만 로컬 상태 사용
    () => (isEditing && localEditData ? localEditData : settings.profile),
    [isEditing, localEditData, settings.profile]
  );

  // 프로필 완성도 계산 최적화
  const profileCompletion = useMemo(() => {
    const fields = [
      settings.profile.displayName,
      settings.profile.email,
      settings.profile.location,
      settings.profile.phone,
      settings.profile.bio,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [settings.profile]);

  // 미완료 필드 목록
  const incompleteFields = useMemo(() => {
      { key: 'displayName', label: '이름', icon: User },
      { key: 'phone', label: '전화번호', icon: Phone },
      { key: 'location', label: '위치', icon: MapPin },
      { key: 'bio', label: '자기소개', icon: Globe },
    ];
    return fields.filter(field => !settings.profile[field.key]);
  }, [settings.profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 기본 파일 형식 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 자동 업로드로 UX 개선
    try {
      setUploadProgress(0);
      const downloadURL = await uploadAvatar(file, progress => {
        setUploadProgress(progress);
      });

      if (isEditing && localEditData) {
        setLocalEditData({ ...localEditData, avatar: downloadURL });
      }
      onUpdate({ type: 'UPDATE_PROFILE', payload: { avatar: downloadURL } });
      setAvatarPreview(null);
      setUploadProgress(0);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : '아바타 업로드에 실패했습니다.'
      );
      setAvatarPreview(null);
      setUploadProgress(0);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // 편집 모드 취소 시 로컬 데이터 제거
      setLocalEditData(null);
      setAvatarPreview(null);
      setFormErrors({});
      setEditingField(null);
    } else {
      // 편집 모드 시작 시 현재 설정으로 로컬 데이터 초기화
      setLocalEditData({ ...settings.profile });
    }
    setIsEditing(!isEditing);
  };

  const handleFieldEdit = (fieldKey: keyof UserProfile) => {
    if (!isEditing) {
      // 편집 모드가 아니면 먼저 편집 모드로 전환
      setLocalEditData({ ...settings.profile });
      setIsEditing(true);
    }
    setEditingField(fieldKey);
  };
    if (!localEditData) return;

    try {
      // 단일 필드 검증
      const validationRules = validationService.getProfileValidationRules();
      const fieldValidation = { [fieldKey]: validationRules[fieldKey] };
      const validationResult = validationService.validateFields(
        { [fieldKey]: localEditData[fieldKey] },
        fieldValidation
      );

      if (!validationResult.isValid) {
        setFormErrors(validationResult.errors);
        return;
      }

      // 로컬 상태 업데이트
      onUpdate({
        type: 'UPDATE_PROFILE',
        payload: { [fieldKey]: localEditData[fieldKey] },
      });

      // 편집 상태 초기화
      setEditingField(null);
      setFormErrors({});
    } catch (error) {
      alert('저장에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!localEditData) return;

    try {
      // Validate profile data using validation service
      const validationRules = validationService.getProfileValidationRules();
      const validationResult = validationService.validateFields(
        localEditData,
        validationRules
      );

      if (!validationResult.isValid) {
        setFormErrors(validationResult.errors);
        alert(validationResult.firstError || '입력값을 확인해주세요.');
        return;
      }

      // Clear any previous errors
      setFormErrors({});

      // 로컬 상태 업데이트
      onUpdate({ type: 'UPDATE_PROFILE', payload: localEditData });

      // 편집 모드 종료
      setLocalEditData(null);
      setIsEditing(false);
      setEditingField(null);
    } catch (error) {
      alert('프로필 저장에 실패했습니다.');
    }
  };

  const getInitials = () => {
    const name = settings.profile.displayName || settings.profile.email;
    if (!name) return 'U';

    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
    label: string,
    icon: React.ComponentType<{ size?: number | string; className?: string }>,
    placeholder: string,
    type: string = 'text'
  ) => {
    const isFieldEditing = editingField === fieldKey;
    const hasError = formErrors[fieldKey];
    const IconComponent = icon;

    return (
      <div className="field-group">
        <label className="block text-sm font-medium text-white/90 mb-2 font-pretendard flex items-center justify-between">
          <div className="flex items-center">
            <IconComponent size={14} className="mr-1" />
            {label}
          </div>
          {!isFieldEditing && fieldKey !== 'email' && (
            <button
              onClick={() => handleFieldEdit(fieldKey)}
              className="text-primary-400 hover:text-primary-300 transition-colors p-1 rounded"
              aria-label={`${label} 편집`}
            >
              <Edit3 size={12} />
            </button>
          )}
        </label>

        {isFieldEditing ? (
          <div className="input-container">
            {type === 'textarea' ? (
              <textarea
                value={value}
                onChange={e =>
                  setLocalEditData(prev => ({
                    [fieldKey]: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none font-pretendard transition-all ${
                  hasError
                    ? 'ring-2 ring-red-400 bg-red-500/10'
                    : 'hover:bg-white/15'
                }`}
                rows={3}
                placeholder={placeholder}
                aria-describedby={hasError ? `${fieldKey}-error` : undefined}
              />
            ) : (
              <input
                type={type}
                value={value}
                onChange={e =>
                  setLocalEditData(prev => ({
                    [fieldKey]: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 font-pretendard transition-all ${
                  hasError
                    ? 'ring-2 ring-red-400 bg-red-500/10'
                    : 'hover:bg-white/15'
                }`}
                placeholder={placeholder}
                aria-describedby={hasError ? `${fieldKey}-error` : undefined}
              />
            )}

            {hasError && (
              <p
                id={`${fieldKey}-error`}
                className="text-red-400 text-xs mt-1 font-pretendard"
                role="alert"
              >
                {hasError}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <WaveButton
                size="sm"
                onClick={() => handleFieldSave(fieldKey)}
                disabled={saving}
                className="flex-1"
              >
                {saving ? <InlineLoading /> : '저장'}
              </WaveButton>
              <WaveButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingField(null);
                  setFormErrors({});
                }}
                className="flex-1"
              >
                취소
              </WaveButton>
            </div>
          </div>
        ) : (
          <div className="field-display">
            <p
              className={`py-2 font-pretendard font-medium ${
                value ? 'text-white/90' : 'text-white/40 italic'
              }`}
            >
              {value || `설정되지 않음`}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* 섹션 제목 */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full" />
        </div>
        <h3 className="text-xl font-semibold text-white font-pretendard">
          프로필 설정
        </h3>
      </div>

      {/* 통합된 프로필 섹션 */}
      <GlassCard variant="medium" className="p-6">
        <div className="space-y-8">
          {/* 프로필 정보 섹션 */}
          <div>
            {/* 헤더 섹션 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold font-pretendard tracking-ko-tight text-white mb-1">
                  프로필 정보
                </h3>
                <p className="text-white/70 text-sm font-pretendard">
                  기본 정보와 프로필 사진을 관리할 수 있습니다
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <WaveButton
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="text-sm font-medium"
                    aria-label="모든 변경사항 저장"
                  >
                    {saving ? (
                      <InlineLoading />
                    ) : (
                      <>
                        <Check size={16} className="mr-1" />
                        저장
                      </>
                    )}
                  </WaveButton>
                )}
                <WaveButton
                  variant="ghost"
                  size="sm"
                  onClick={handleEditToggle}
                  className="text-sm font-medium"
                  aria-label={isEditing ? '편집 취소' : '프로필 편집'}
                >
                  {isEditing ? (
                    <>
                      <X size={16} className="mr-1" />
                      취소
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} className="mr-1" />
                      편집
                    </>
                  )}
                </WaveButton>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* 아바타 섹션 - 크기 최적화 */}
              <div className="flex flex-col items-center lg:items-start">
                <GlassCard
                  variant="light"
                  className="p-4 flex flex-col items-center"
                >
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center shadow-xl ring-4 ring-white/20">
                      {avatarPreview || settings.profile.avatar ? (
                        <img
                          src={avatarPreview || settings.profile.avatar}
                          alt="프로필 사진"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                          {getInitials()}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                      aria-label="프로필 사진 변경"
                      tabIndex={0}
                    >
                      <Camera size={24} className="text-white mb-1" />
                      <span className="text-white text-xs font-medium">변경</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="프로필 사진 파일 선택"
                    />
                  </div>

                  {uploadingAvatar && (
                    <div className="mt-4 text-center w-full">
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-primary-400 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-white/70 text-xs">
                        업로드 중... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {!uploadingAvatar && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Camera size={16} />
                        사진 {settings.profile.avatar ? '변경' : '업로드'}
                      </button>
                      {settings.profile.avatar && (
                        <button
                          onClick={async () => {
                            if (confirm('프로필 사진을 삭제하시겠습니까?')) {
                              try {
                                await deleteAvatar();
                              } catch (error) {
                                alert('사진 삭제에 실패했습니다.');
                              }
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs transition-colors"
                        >
                          사진 삭제
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-white/60 text-xs mt-3 text-center max-w-[200px]">
                    JPG, PNG, GIF, WebP 형식
                    <br />
                    최대 50MB (자동 최적화)
                  </p>
                </GlassCard>
              </div>

              {/* 프로필 정보 입력 필드 - 레이아웃 개선 */}
              <div className="flex-1">
                <GlassCard variant="light" className="p-4">
                  <div className="space-y-4">
                    {/* 기본 정보 그리드 - 반응형 개선 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField(
                        'displayName',
                        '이름',
                        User,
                        '이름을 입력하세요'
                      )}
                      {renderField('email', '이메일', Mail, '', 'email')}
                      {renderField(
                        'phone',
                        '전화번호',
                        Phone,
                        '010-0000-0000',
                        'tel'
                      )}
                      {renderField('location', '위치', MapPin, '서울, 대한민국')}
                    </div>

                    {/* 자기소개 필드 - 전체 너비 */}
                    {renderField(
                      'bio',
                      '자기소개',
                      Globe,
                      '간단한 자기소개를 작성해주세요',
                      'textarea'
                    )}

                    {/* 가입일 정보 */}
                    <div className="flex items-center gap-4 text-sm text-white/70 font-pretendard pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          가입일:{' '}
                          {authUser?.metadata?.creationTime
                            ? new Date(
                                authUser.metadata.creationTime
                              ).toLocaleDateString('ko-KR')
                            : '정보 없음'}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-white/10"></div>

          {/* 프로필 완성도 섹션 */}
          <SettingsGroup
            title="프로필 완성도"
            description="프로필 정보 완성도를 확인하세요"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/90 font-pretendard font-medium">
                  프로필 완성도
                </span>
                <span className="text-lg font-bold text-primary-400">
                  {profileCompletion}%
                </span>
              </div>

              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-400 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              {/* 완료된 항목들 */}
              <div className="text-xs text-white/90 space-y-2 mt-4 font-pretendard">
                {settings.profile.displayName && (
                  <div className="flex items-center justify-between">
                    <span>✓ 이름 설정</span>
                    <span>완료</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>✓ 이메일 인증</span>
                  <span>완료</span>
                </div>
                {settings.profile.location && (
                  <div className="flex items-center justify-between">
                    <span>✓ 위치 정보</span>
                    <span>입력 완료</span>
                  </div>
                )}
                {settings.profile.phone && (
                  <div className="flex items-center justify-between">
                    <span>✓ 전화번호</span>
                    <span>입력 완료</span>
                  </div>
                )}
                {settings.profile.bio && (
                  <div className="flex items-center justify-between">
                    <span>✓ 자기소개</span>
                    <span>작성 완료</span>
                  </div>
                )}
              </div>

              {/* 미완료 항목들 - 클릭 가능한 액션 버튼 */}
              {incompleteFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-white/80 mb-3">
                    추가로 설정할 수 있는 정보
                  </h4>
                  <div className="space-y-2">
                    {incompleteFields.map(field => {
                      const IconComponent = field.icon;
                      return (
                        <div
                          key={field.key}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => handleFieldEdit(field.key)}
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent size={14} className="text-white/70" />
                            <span className="text-sm text-white/70">
                              {field.label} 설정
                            </span>
                          </div>
                          <button
                            className="text-primary-400 hover:text-primary-300 transition-colors"
                            aria-label={`${field.label} 추가`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </SettingsGroup>
        </div>
      </GlassCard>
    </div>
  );
}
