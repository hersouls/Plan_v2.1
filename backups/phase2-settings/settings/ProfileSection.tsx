import { useState, useRef } from 'react';
import { 
  User, Camera, Edit3, X, Check, Upload,
  Mail, Phone, MapPin, Calendar, Globe
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { InlineLoading } from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  displayName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
}

export function ProfileSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    location: 'Seoul, South Korea',
    bio: '',
    avatar: undefined
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarPreview) return;

    setUploadingAvatar(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProfileData(prev => ({ ...prev, avatar: avatarPreview }));
      setEditData(prev => ({ ...prev, avatar: avatarPreview }));
      setAvatarPreview(null);
      
      console.log('Avatar uploaded successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(profileData);
      setAvatarPreview(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfileData(editData);
      setIsEditing(false);
      
      console.log('Profile updated:', editData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const name = profileData.displayName || profileData.email;
    if (!name) return 'U';
    
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <GlassCard variant="light" className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold font-pretendard tracking-ko-tight">프로필 정보</h2>
          <WaveButton
            variant="ghost"
            size="sm"
            onClick={handleEditToggle}
            className="text-xs sm:text-sm"
          >
            {isEditing ? (
              <>
                <X size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">취소</span>
                <span className="sm:hidden">취소</span>
              </>
            ) : (
              <>
                <Edit3 size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">편집</span>
                <span className="sm:hidden">편집</span>
              </>
            )}
          </WaveButton>
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center">
                {avatarPreview || profileData.avatar ? (
                  <img 
                    src={avatarPreview || profileData.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg sm:text-2xl font-bold">
                    {getInitials()}
                  </span>
                )}
              </div>
              
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center touch-comfortable"
                  >
                    <Camera size={20} className="text-white sm:w-6 sm:h-6" />
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {avatarPreview && (
              <div className="mt-2 sm:mt-3 flex gap-1 sm:gap-2">
                <WaveButton
                  size="sm"
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="text-xs sm:text-sm"
                >
                  {uploadingAvatar ? (
                    <InlineLoading />
                  ) : (
                    <>
                      <Upload size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">업로드</span>
                      <span className="sm:hidden">업로드</span>
                    </>
                  )}
                </WaveButton>
                <WaveButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setAvatarPreview(null)}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">취소</span>
                  <span className="sm:hidden">취소</span>
                </WaveButton>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 font-pretendard">
                  <User size={12} className="inline mr-1 sm:w-3.5 sm:h-3.5" />
                  이름
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm sm:text-base font-pretendard"
                    placeholder="이름을 입력하세요"
                  />
                ) : (
                  <p className="text-gray-900 py-1.5 sm:py-2 text-sm sm:text-base font-pretendard">{profileData.displayName || '설정되지 않음'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 font-pretendard">
                  <Mail size={12} className="inline mr-1 sm:w-3.5 sm:h-3.5" />
                  이메일
                </label>
                <p className="text-gray-900 py-1.5 sm:py-2 text-sm sm:text-base font-pretendard">{profileData.email}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 font-pretendard">
                  <Phone size={12} className="inline mr-1 sm:w-3.5 sm:h-3.5" />
                  전화번호
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm sm:text-base font-pretendard"
                    placeholder="010-0000-0000"
                  />
                ) : (
                  <p className="text-gray-900 py-1.5 sm:py-2 text-sm sm:text-base font-pretendard">{profileData.phone || '설정되지 않음'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 font-pretendard">
                  <MapPin size={12} className="inline mr-1 sm:w-3.5 sm:h-3.5" />
                  위치
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm sm:text-base font-pretendard"
                    placeholder="서울, 대한민국"
                  />
                ) : (
                  <p className="text-gray-900 py-1.5 sm:py-2 text-sm sm:text-base font-pretendard">{profileData.location || '설정되지 않음'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 font-pretendard">
                <Globe size={12} className="inline mr-1 sm:w-3.5 sm:h-3.5" />
                자기소개
              </label>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none text-sm sm:text-base font-pretendard"
                  rows={3}
                  placeholder="간단한 자기소개를 작성해주세요"
                />
              ) : (
                <p className="text-gray-900 py-1.5 sm:py-2 text-sm sm:text-base font-pretendard">
                  {profileData.bio || '자기소개가 없습니다'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 font-pretendard">
              <div className="flex items-center gap-1">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>가입일: {user?.metadata?.creationTime ? 
                  new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : 
                  '정보 없음'
                }</span>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <WaveButton
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  {saving ? (
                    <InlineLoading />
                  ) : (
                    <>
                      <Check size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">저장</span>
                      <span className="sm:hidden">저장</span>
                    </>
                  )}
                </WaveButton>
                <WaveButton
                  variant="ghost"
                  size="sm"
                  onClick={handleEditToggle}
                  className="text-xs sm:text-sm"
                >
                  <X size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">취소</span>
                  <span className="sm:hidden">취소</span>
                </WaveButton>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="light" className="p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 font-pretendard tracking-ko-tight">프로필 완성도</h3>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-600 font-pretendard">프로필 완성도</span>
            <span className="text-xs sm:text-sm font-semibold text-primary-600">75%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div 
              className="bg-gradient-to-r from-primary-400 to-purple-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: '75%' }}
            />
          </div>
          
          <div className="text-xs text-gray-500 space-y-1 mt-2 sm:mt-3 font-pretendard">
            <p>✓ 이름 설정 완료</p>
            <p>✓ 이메일 인증 완료</p>
            <p>✓ 위치 정보 입력 완료</p>
            <p className="text-gray-400">○ 전화번호를 추가해주세요</p>
            <p className="text-gray-400">○ 자기소개를 작성해주세요</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}