import { Users } from 'lucide-react';
import React, { useMemo } from 'react';
import type { PointStats } from '../../lib/points';
import type { GroupMember } from '../../types/group';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/typography';

interface MemberListProps {
  members: GroupMember[];
  currentUserId?: string;
  selectedMemberId: string | null;
  onSelect: (userId: string) => void;
  statsByUserId: Record<string, PointStats>;
  renderAvatar: (
    memberId: string,
    displayName: string,
    size?: 'sm' | 'md' | 'lg'
  ) => React.ReactNode;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUserId,
  selectedMemberId,
  onSelect,
  statsByUserId,
  renderAvatar,
}) => {
  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      return (a.userName || '').localeCompare(b.userName || '', 'ko');
    });
  }, [members, currentUserId]);

  return (
    <GlassCard variant="medium" className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <Typography.H3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white font-pretendard">
          구성원 목록
        </Typography.H3>
        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
      </div>

      <div className="space-y-3">
        {sorted.map(member => {
          const stats = statsByUserId[member.userId];
          const isSelected = selectedMemberId === member.userId;
          return (
            <button
              key={member.userId}
              onClick={() => onSelect(member.userId)}
              className={`
                w-full p-4 rounded-xl cursor-pointer transition-all duration-300 text-left font-pretendard
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 shadow-lg'
                    : member.userId === currentUserId
                    ? 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-2 border-yellow-400/30 hover:bg-yellow-400/20 hover:border-yellow-400/50'
                    : 'bg-white/10 border-2 border-transparent hover:bg-white/20 hover:border-white/30'
                }
              `}
              aria-label={`${member.userName || 'Unknown'} 선택`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {renderAvatar(
                    member.userId,
                    member.userName || 'Unknown',
                    'md'
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Typography.Body className="font-semibold text-white text-sm sm:text-base">
                        {member.userName || 'Unknown'}
                      </Typography.Body>
                      {member.userId === currentUserId && (
                        <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs rounded-full font-medium border border-yellow-400/30">
                          나
                        </span>
                      )}
                    </div>
                    <Typography.Caption className="text-white/60 text-xs sm:text-sm">
                      {member.role || 'member'}
                    </Typography.Caption>
                  </div>
                </div>
                <div className="text-right">
                  <Typography.Body className="font-bold text-yellow-400 text-base sm:text-lg">
                    {stats?.totalPoints || 0}
                  </Typography.Body>
                  <Typography.Caption className="text-white/60 text-xs sm:text-sm">
                    포인트
                  </Typography.Caption>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default MemberList;
