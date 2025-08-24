import React, { useState, useMemo } from 'react';
import { User, Phone, MapPin, Globe, Edit3, Check, X, Plus } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import { WaveButton } from '../../ui/WaveButton';
import { InlineLoading } from '../../common/LoadingSpinner';
import { SettingsGroup } from '../components/SettingsGroup';
import { useSettingsContext } from '../contexts/SettingsContextBase';

interface ProfileSectionProps {
  isActive: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ isActive }) => {
  const { settings, updateSettings, saveSettings, saving } = useSettingsContext();
  const [isEditing, setIsEditing] = useState(false);
  const [localEditData, setLocalEditData] = useState(settings.profile);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    const fields = [
      { key: 'displayName', label: '이름', icon: User },
      { key: 'phone', label: '전화번호', icon: Phone },
      { key: 'location', label: '위치', icon: MapPin },
      { key: 'bio', label: '자기소개', icon: Globe },
    ];
  }, [settings.profile]);

  const handleEditToggle = () => {
    if (isEditing) {
      setLocalEditData(settings.profile);
      setFormErrors({});
      setEditingField(null);
    } else {
      setLocalEditData({ ...settings.profile });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      updateSettings({ type: 'UPDATE_PROFILE', payload: localEditData });
      await saveSettings();
      setIsEditing(false);
      setFormErrors({});
      setEditingField(null);
    } catch (error) {
      console.error('프로필 저장 실패:', error);
    }
  };

  const handleFieldEdit = (fieldKey: string) => {
    setEditingField(fieldKey);
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

      {/* 프로필 섹션 */}
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
                  기본 정보를 관리할 수 있습니다
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

            {/* 프로필 필드들 */}
            <div className="space-y-4">
              {/* 이름 */}
              <div className="field-group">
                <label className="block text-sm font-medium text-white/90 mb-2 font-pretendard flex items-center">
                  <User size={14} className="mr-1" />
                  이름
                </label>
                <div className="field-display">
                  <p className="py-2 font-pretendard font-medium text-white/90">
                    {settings.profile.displayName || '설정되지 않음'}
                  </p>
                </div>
              </div>

              {/* 이메일 */}
              <div className="field-group">
                <label className="block text-sm font-medium text-white/90 mb-2 font-pretendard flex items-center">
                  <User size={14} className="mr-1" />
                  이메일
                </label>
                <div className="field-display">
                  <p className="py-2 font-pretendard font-medium text-white/90">
                    {settings.profile.email || '설정되지 않음'}
                  </p>
                </div>
              </div>

              {/* 전화번호 */}
              <div className="field-group">
                <label className="block text-sm font-medium text-white/90 mb-2 font-pretendard flex items-center">
                  <Phone size={14} className="mr-1" />
                  전화번호
                </label>
                <div className="field-display">
                  <p className="py-2 font-pretendard font-medium text-white/90">
                    {settings.profile.phone || '설정되지 않음'}
                  </p>
                </div>
              </div>

              {/* 위치 */}
              <div className="field-group">
                <label className="block text-sm font-medium text-white/90 mb-2 font-pretendard flex items-center">
                  <MapPin size={14} className="mr-1" />
                  위치
                </label>
                <div className="field-display">
                  <p className="py-2 font-pretendard font-medium text-white/90">
                    {settings.profile.location || '설정되지 않음'}
                  </p>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="field-group">
                <label className="block text-sm font-medium text-white/90 mb-2 font-pretendard flex items-center">
                  <Globe size={14} className="mr-1" />
                  자기소개
                </label>
                <div className="field-display">
                  <p className="py-2 font-pretendard font-medium text-white/90">
                    {settings.profile.bio || '설정되지 않음'}
                  </p>
                </div>
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

              {/* 미완료 항목들 */}
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
};
