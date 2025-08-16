import { updateProfile } from 'firebase/auth';
import {
  Calendar,
  Camera,
  Check,
  Edit3,
  Globe,
  Mail,
  MapPin,
  Phone,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../lib/firestore';
import { deleteAvatarImage, uploadAvatarImage } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { InlineLoading } from '../common/LoadingSpinner';
import { WaveButton } from '../ui/WaveButton';
import { AvatarWrapper, getAvatarInitials } from '../ui/avatar';
import { Typography } from '../ui/typography';

interface ProfileData {
  displayName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  avatarStorageUrl?: string; // Firebase Storage URL 추가
}

export function ProfileSection() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    email: '',
    phone: '',
    location: 'Seoul, South Korea',
    bio: '',
    avatar: undefined,
    avatarStorageUrl: undefined,
  });

  const [editData, setEditData] = useState<ProfileData>({
    displayName: '',
    email: '',
    phone: '',
    location: 'Seoul, South Korea',
    bio: '',
    avatar: undefined,
    avatarStorageUrl: undefined,
  });

  // 프로필 완성도 계산
  const profileCompletion = useMemo(() => {
    const items = [
      { key: 'displayName', completed: !!profileData.displayName?.trim() },
      { key: 'email', completed: !!profileData.email?.trim() },
      { key: 'location', completed: !!profileData.location?.trim() },
      { key: 'phone', completed: !!profileData.phone?.trim() },
      { key: 'bio', completed: !!profileData.bio?.trim() },
    ];

    const completedCount = items.filter(item => item.completed).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    return {
      percentage,
      items,
      completedCount,
      totalCount: items.length,
    };
  }, [profileData]);

  // Firestore에서 사용자 프로필 데이터 로드
  const loadUserProfile = useCallback(async () => {
    if (!user?.uid) return;

    setLoadingProfile(true);
    try {
      const userProfile = await userService.getUserProfile(user.uid);

      if (userProfile) {
        const newProfileData = {
          displayName: userProfile.displayName || user.displayName || '',
          email: userProfile.email || user.email || '',
          phone: userProfile.phoneNumber || '',
          location: userProfile.location || 'Seoul, South Korea',
          bio: userProfile.bio || '',
          avatar: userProfile.photoURL || user.photoURL || undefined,
          avatarStorageUrl: userProfile.avatarStorageUrl || undefined,
        };

        setProfileData(newProfileData);
        setEditData(newProfileData);
      } else {
        // Firestore에 프로필이 없으면 Auth 데이터만 사용
        const newProfileData = {
          displayName: user.displayName || '',
          email: user.email || '',
          phone: '',
          location: 'Seoul, South Korea',
          bio: '',
          avatar: user.photoURL || undefined,
          avatarStorageUrl: undefined,
        };

        setProfileData(newProfileData);
        setEditData(newProfileData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // 에러 발생 시 Auth 데이터만 사용
      const newProfileData = {
        displayName: user.displayName || '',
        email: user.email || '',
        phone: '',
        location: 'Seoul, South Korea',
        bio: '',
        avatar: user.photoURL || undefined,
        avatarStorageUrl: undefined,
      };

      setProfileData(newProfileData);
      setEditData(newProfileData);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  // user 데이터가 변경될 때 프로필 로드
  useEffect(() => {
    loadUserProfile();
  }, [user?.uid, loadUserProfile]);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 이미지 파일 타입 검사
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        return;
      }

      // 파일 확장자 검사
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (
        !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
      ) {
        alert('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)');
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleAvatarUpload = useCallback(async () => {
    if (!selectedFile || !user?.uid) return;

    setUploadingAvatar(true);
    setUploadProgress(0);

    try {
      const result = await uploadAvatarImage(
        selectedFile,
        user.uid,
        progress => {
          setUploadProgress(progress);
        }
      );

      // 기존 아바타가 있으면 삭제
      if (editData.avatarStorageUrl) {
        try {
          await deleteAvatarImage(user.uid, editData.avatarStorageUrl);
        } catch (error) {
          console.warn('기존 아바타 삭제 실패:', error);
        }
      }

      // 새 아바타 정보로 업데이트
      const newAvatarData = {
        avatar: result.downloadUrl,
        avatarStorageUrl: result.storageUrl,
      };

      setProfileData(prev => ({ ...prev, ...newAvatarData }));
      setEditData(prev => ({ ...prev, ...newAvatarData }));
      setAvatarPreview(null);
      setSelectedFile(null);
      setUploadProgress(0);

      console.log('Avatar uploaded successfully:', result);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert(
        error instanceof Error ? error.message : '아바타 업로드에 실패했습니다.'
      );
    } finally {
      setUploadingAvatar(false);
      setUploadProgress(0);
    }
  }, [selectedFile, user?.uid, editData.avatarStorageUrl]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      setEditData(profileData);
      setAvatarPreview(null);
      setSelectedFile(null);
      setUploadProgress(0);
    }
    setIsEditing(!isEditing);
  }, [isEditing, profileData]);

  const handleSave = useCallback(async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      // 아바타가 업로드 중이면 완료 대기
      if (uploadingAvatar) {
        await new Promise(resolve => {
          const checkUpload = () => {
            if (!uploadingAvatar) {
              resolve(true);
            } else {
              setTimeout(checkUpload, 100);
            }
          };
          checkUpload();
        });
      }

      // Firebase Auth 프로필 업데이트 (displayName과 photoURL)
      if (
        user &&
        (editData.displayName !== user.displayName ||
          editData.avatar !== user.photoURL)
      ) {
        try {
          await updateProfile(user, {
            displayName: editData.displayName,
            photoURL: editData.avatar,
          });
          console.log('Firebase Auth profile updated');
        } catch (authError) {
          console.error('Failed to update Firebase Auth profile:', authError);
          // Auth 업데이트 실패해도 Firestore 업데이트는 계속 진행
        }
      }

      // Firestore에 사용자 프로필 업데이트
      const userData = {
        displayName: editData.displayName,
        email: editData.email,
        phoneNumber: editData.phone,
        location: editData.location,
        bio: editData.bio,
        photoURL: editData.avatar,
        avatarStorageUrl: editData.avatarStorageUrl, // Storage URL도 저장
      };

      // undefined와 빈 문자열 값 제거
      const filteredData = Object.fromEntries(
        Object.entries(userData).filter(
          ([_, value]) => value !== undefined && value !== ''
        )
      );

      await userService.createOrUpdateUserProfile(user.uid, filteredData);

      setProfileData(editData);
      setIsEditing(false);

      // 프로필 업데이트 후 페이지 새로고침으로 변경사항 반영
      window.location.reload();

      console.log('Profile updated:', editData);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [editData, user?.uid, uploadingAvatar, user]);

  const getInitials = useCallback(() => {
    return getAvatarInitials(profileData.displayName, profileData.email);
  }, [profileData.displayName, profileData.email]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <InlineLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Profile Information Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Typography.H4 className="text-white font-pretendard">
            프로필 정보
          </Typography.H4>
          <WaveButton
            variant="ghost"
            size="sm"
            onClick={handleEditToggle}
            className="text-white/80 hover:text-white"
          >
            {isEditing ? (
              <>
                <X size={16} className="mr-2" />
                취소
              </>
            ) : (
              <>
                <Edit3 size={16} className="mr-2" />
                편집
              </>
            )}
          </WaveButton>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <AvatarWrapper
                src={avatarPreview || profileData.avatar}
                alt="Profile Avatar"
                fallback={getInitials()}
                size="xl"
                loading={uploadingAvatar}
                className="w-24 h-24 lg:w-32 lg:h-32"
              />

              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera size={24} className="text-white" />
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
              <div className="mt-4 flex flex-col gap-2">
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <WaveButton
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {uploadingAvatar ? (
                      <InlineLoading />
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        업로드
                      </>
                    )}
                  </WaveButton>
                  <WaveButton
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAvatarPreview(null);
                      setSelectedFile(null);
                      setUploadProgress(0);
                    }}
                    className="text-white/80 hover:text-white"
                  >
                    취소
                  </WaveButton>
                </div>
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                  <User size={16} />
                  이름
                </Typography.Label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={e =>
                      setEditData(prev => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    className={cn(
                      'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground placeholder-muted-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                    placeholder="이름을 입력하세요"
                  />
                ) : (
                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Typography.Body className="text-white">
                      {profileData.displayName || (
                        <span className="text-white/60 italic">
                          설정되지 않음
                        </span>
                      )}
                    </Typography.Body>
                  </div>
                )}
              </div>

              <div className="group">
                <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                  <Mail size={16} />
                  이메일
                </Typography.Label>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Typography.Body className="text-white">
                    {profileData.email}
                  </Typography.Body>
                </div>
              </div>

              <div className="group">
                <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                  <Phone size={16} />
                  전화번호
                </Typography.Label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={e =>
                      setEditData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    className={cn(
                      'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground placeholder-muted-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                    placeholder="010-0000-0000"
                  />
                ) : (
                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Typography.Body className="text-white">
                      {profileData.phone || (
                        <span className="text-white/80 italic">
                          설정되지 않음
                        </span>
                      )}
                    </Typography.Body>
                  </div>
                )}
              </div>

              <div className="group">
                <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  위치
                </Typography.Label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location}
                    onChange={e =>
                      setEditData(prev => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className={cn(
                      'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground placeholder-muted-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                    placeholder="서울, 대한민국"
                  />
                ) : (
                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Typography.Body className="text-white">
                      {profileData.location || (
                        <span className="text-white/80 italic">
                          설정되지 않음
                        </span>
                      )}
                    </Typography.Body>
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <Typography.Label className="text-white/90 mb-3 flex items-center gap-2">
                <Globe size={16} />
                자기소개
              </Typography.Label>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={e =>
                    setEditData(prev => ({ ...prev, bio: e.target.value }))
                  }
                  className={cn(
                    'w-full px-4 lg:px-6 py-3 lg:py-4 border-2 rounded-xl',
                    'bg-background/95 backdrop-blur-sm',
                    'text-foreground placeholder-muted-foreground',
                    'transition-all duration-200 resize-none',
                    'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                    'group-hover:shadow-md'
                  )}
                  rows={3}
                  placeholder="간단한 자기소개를 작성해주세요"
                />
              ) : (
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Typography.Body className="text-white">
                    {profileData.bio || (
                      <span className="text-white/80 italic">
                        자기소개가 없습니다
                      </span>
                    )}
                  </Typography.Body>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-white/85">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <Typography.Caption>
                  가입일:{' '}
                  {user?.metadata?.creationTime ? (
                    new Date(user.metadata.creationTime).toLocaleDateString(
                      'ko-KR'
                    )
                  ) : (
                    <span className="text-white/70 italic">정보 없음</span>
                  )}
                </Typography.Caption>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <WaveButton
                  onClick={handleSave}
                  disabled={saving}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {saving ? (
                    <InlineLoading />
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      저장
                    </>
                  )}
                </WaveButton>
                <WaveButton
                  variant="ghost"
                  size="lg"
                  onClick={handleEditToggle}
                  className="text-white/80 hover:text-white"
                >
                  <X size={18} className="mr-2" />
                  취소
                </WaveButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          프로필 완성도
        </Typography.H4>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography.Body className="text-white/90">
              프로필 완성도
            </Typography.Body>
            <Typography.Body className="text-white font-bold">
              {profileCompletion.percentage}%
            </Typography.Body>
          </div>

          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion.percentage}%` }}
            />
          </div>

          <div className="space-y-2">
            {profileCompletion.items.map((item, index) => {
              const labels = {
                displayName: '이름 설정',
                email: '이메일 인증',
                location: '위치 정보 입력',
                phone: '전화번호 추가',
                bio: '자기소개 작성',
              };

              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-2',
                    item.completed ? 'text-white' : 'text-white/80'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold',
                      item.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-white/30 text-white/80'
                    )}
                  >
                    {item.completed ? '✓' : '○'}
                  </div>
                  <Typography.Caption
                    className={cn(
                      item.completed ? 'text-white' : 'text-white/80'
                    )}
                  >
                    {labels[item.key as keyof typeof labels]}
                    {item.completed ? ' 완료' : '해주세요'}
                  </Typography.Caption>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
