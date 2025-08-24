import { Plus, TrendingUp } from 'lucide-react';
import React from 'react';
import type { PointStats } from '../../lib/points';
import type { GroupMember } from '../../types/group';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface StatsSummaryProps {
  member: GroupMember;
  stats: PointStats;
  hasPermission: boolean;
  onOpenAdd: () => void;
  onOpenDeduct: () => void;
  renderAvatar: (
    memberId: string,
    displayName: string,
    size?: 'sm' | 'md' | 'lg'
  ) => React.ReactNode;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  member,
  stats,
  hasPermission,
  onOpenAdd,
  onOpenDeduct,
  renderAvatar,
}) => {
  return (
    <GlassCard variant="medium" className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {renderAvatar(member.userId, member.userName || 'Unknown', 'lg')}
          <div>
            <Typography.H3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white font-pretendard">
              {member.userName || 'Unknown'}
            </Typography.H3>
            <Typography.Body className="text-white/80 text-sm sm:text-base font-pretendard">
              {member.role || 'member'}
            </Typography.Body>
          </div>
        </div>
        <div className="text-right">
          <Typography.H2 className="text-3xl font-bold text-white points-pulse">
            {stats.totalPoints}
          </Typography.H2>
          <Typography.Body className="text-gray-400">총 포인트</Typography.Body>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        {hasPermission ? (
          <>
            <WaveButton
              onClick={onOpenAdd}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 bg-semantic-success-100/20 hover:bg-semantic-success-100/30 text-semantic-success-400 border border-semantic-success-300/40 hover:border-semantic-success-400/60 shadow-lg hover:shadow-xl transition-all duration-200"
              title="포인트 추가"
              aria-label="포인트 추가"
            >
              <Plus className="w-4 h-4" />
            </WaveButton>
            <WaveButton
              onClick={onOpenDeduct}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 bg-semantic-danger-100/20 hover:bg-semantic-danger-100/30 text-semantic-danger-400 border border-semantic-danger-300/40 hover:border-semantic-danger-400/60 shadow-lg hover:shadow-xl transition-all duration-200"
              title="포인트 차감"
              aria-label="포인트 차감"
            >
              <TrendingUp className="w-4 h-4" />
            </WaveButton>
          </>
        ) : (
          <div className="mt-6 p-4 bg-semantic-warning-50/20 border border-semantic-warning-200/40 rounded-lg">
            <Typography.Body className="text-semantic-warning-200 text-sm">
              포인트 추가/차감은 그룹장과 부그룹장만 가능합니다.
            </Typography.Body>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mt-6">
        <div
          className="text-center p-3 bg-semantic-success-50 rounded-lg points-glow"
          role="region"
          aria-label="획득 포인트"
        >
          <Typography.Body className="text-lg font-bold text-semantic-success-600">
            {stats.earnedPoints}
          </Typography.Body>
          <Typography.Caption className="text-semantic-success-500">
            획득
          </Typography.Caption>
        </div>
        <div
          className="text-center p-3 bg-semantic-danger-50 rounded-lg points-glow"
          role="region"
          aria-label="차감 포인트"
        >
          <Typography.Body className="text-lg font-bold text-semantic-danger-600">
            {stats.deductedPoints}
          </Typography.Body>
          <Typography.Caption className="text-semantic-danger-500">
            차감
          </Typography.Caption>
        </div>
        <div
          className="text-center p-3 bg-semantic-warning-50 rounded-lg points-glow"
          role="region"
          aria-label="보너스 포인트"
        >
          <Typography.Body className="text-lg font-bold text-semantic-warning-600">
            {stats.bonusPoints}
          </Typography.Body>
          <Typography.Caption className="text-semantic-warning-500">
            보너스
          </Typography.Caption>
        </div>
        <div
          className="text-center p-3 bg-semantic-primary-50 rounded-lg points-glow"
          role="region"
          aria-label="순위"
        >
          <Typography.Body className="text-lg font-bold text-semantic-primary-600">
            {stats.rank}/{stats.totalMembers}
          </Typography.Body>
          <Typography.Caption className="text-semantic-primary-500">
            순위
          </Typography.Caption>
        </div>
        <div
          className="text-center p-3 bg-white/10 rounded-lg points-glow"
          role="region"
          aria-label="완료율"
        >
          <Typography.Body className="text-lg font-bold text-white">
            {stats.completionRate}%
          </Typography.Body>
          <Typography.Caption className="text-white/70">
            완료율
          </Typography.Caption>
        </div>
        <div
          className="text-center p-3 bg-white/10 rounded-lg points-glow"
          role="region"
          aria-label="스트릭"
        >
          <Typography.Body className="text-lg font-bold text-white">
            {stats.currentStreak} / {stats.longestStreak}
          </Typography.Body>
          <Typography.Caption className="text-white/70">
            연속 / 최고
          </Typography.Caption>
        </div>
      </div>
    </GlassCard>
  );
};

export default StatsSummary;
