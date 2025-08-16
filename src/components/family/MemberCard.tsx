import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Crown,
  Eye,
  MoreVertical,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';
import React from 'react';
import { useUser } from '../../hooks/useUser';
import { GroupMember } from '../../types/group';
import { toDate } from '../../utils/dateHelpers';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { AvatarWrapper, getAvatarInitials } from '../ui/avatar';

interface MemberCardProps {
  member: GroupMember;
  isCurrentUser?: boolean;
  isOwner?: boolean;
  statistics?: {
    tasksCompleted: number;
    tasksTotal: number;
    currentStreak: number;
    completionRate: number;
  };
  onChangeRole?: (userId: string, newRole: GroupMember['role']) => void;
  onRemoveMember?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onSendMessage?: (userId: string) => void;
}

const roleConfig = {
  owner: {
    icon: Crown,
    label: '소유자',
    color: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900',
    description: '그룹의 모든 권한을 가집니다',
  },
  admin: {
    icon: Shield,
    label: '관리자',
    color: 'text-primary bg-primary-light dark:text-blue-300 dark:bg-blue-900',
    description: '멤버 관리 및 설정 변경 가능',
  },
  vice_owner: {
    icon: Award,
    label: '부그룹장',
    color: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900',
    description: '그룹장과 동일한 권한, 그룹장 부재 시 대행 가능',
  },
  member: {
    icon: User,
    label: '멤버',
    color:
      'text-success bg-success-light dark:text-green-300 dark:bg-green-900',
    description: '할일 생성 및 수정 가능',
  },
  viewer: {
    icon: Eye,
    label: '뷰어',
    color: 'text-muted-foreground bg-muted',
    description: '읽기 전용 권한',
  },
};

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isCurrentUser = false,
  statistics,
}) => {
  // 사용자 프로필 정보 가져오기
  const { user: userProfile } = useUser({ userId: member.userId });

  const RoleIcon = roleConfig[member.role].icon;
  const completionRate = statistics?.completionRate || 0;
  const lastActiveDate = member.lastActivityAt || member.lastActive;
  const isOnline =
    lastActiveDate &&
    new Date().getTime() - toDate(lastActiveDate).getTime() < 5 * 60 * 1000; // 5분 이내

  // 아바타 우선순위: 사용자 프로필 > 멤버 정보 > 기본값
  const avatarUrl = userProfile?.photoURL || member.userAvatar;
  const displayName =
    userProfile?.displayName ||
    member.userName ||
    `사용자 ${member.userId.slice(-4)}`;
  const userEmail = userProfile?.email || member.userEmail;

  return (
    <GlassCard
      variant="member"
      className={`p-3 sm:p-4 md:p-5 ${
        isCurrentUser ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar with Online Status */}
          <div className="relative">
            <AvatarWrapper
              src={avatarUrl}
              alt={`${displayName} Avatar`}
              fallback={getAvatarInitials(displayName, userEmail)}
              size="md"
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            {isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold text-foreground font-pretendard break-keep-ko">
                {displayName}
                {isCurrentUser && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (나)
                  </span>
                )}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                  roleConfig[member.role].color
                }`}
              >
                <RoleIcon className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {roleConfig[member.role].label}
                </span>
                <span className="sm:hidden">
                  {roleConfig[member.role].label.charAt(0)}
                </span>
              </span>
            </div>

            {userEmail && (
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 font-pretendard break-keep-ko">
                {userEmail}
              </p>
            )}

            {/* Join Date & Last Active */}
            <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="hidden sm:inline">
                  가입:{' '}
                  {format(toDate(member.joinedAt), 'yyyy.MM.dd', {
                    locale: ko,
                  })}
                </span>
                <span className="sm:hidden">
                  {format(toDate(member.joinedAt), 'MM.dd', { locale: ko })}
                </span>
              </div>
              {lastActiveDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {isOnline
                      ? '온라인'
                      : `${formatDistanceToNow(toDate(lastActiveDate), {
                          addSuffix: true,
                          locale: ko,
                        })}`}
                  </span>
                  <span className="sm:hidden">
                    {isOnline ? '온라인' : '활동중'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isCurrentUser && (
          <div className="relative">
            <WaveButton variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </WaveButton>
          </div>
        )}
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 space-y-2 sm:space-y-3">
          {/* Completion Rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-400 font-pretendard">완료율</span>
              <span className="font-semibold text-white">
                {completionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-400" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {statistics.tasksCompleted}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-pretendard">완료</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-400" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {statistics.currentStreak}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-pretendard">연속</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {statistics.tasksTotal}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-pretendard">전체</p>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default MemberCard;
