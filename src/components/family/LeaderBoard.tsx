import { Trophy, Medal, Award, TrendingUp, Flame, Target } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GroupStats } from '../../types/group';

interface LeaderBoardProps {
  memberStats?: GroupStats['memberStats'];
  timeRange?: 'week' | 'month' | 'all';
  currentUserId?: string;
}

export function LeaderBoard({ 
  memberStats, 
  timeRange = 'week',
  currentUserId 
}: LeaderBoardProps) {
  // Sort memberStats array by completion rate and tasks completed
  const sortedMembers = (memberStats || [])
    .map((member) => ({
      ...member,
      // Calculate score based on points and tasks completed
      score: (member.points * 0.6) + (member.tasksCompleted * 0.4),
      // Calculate completion rate based on total tasks assigned if available
      completionRate: member.totalTasks && member.totalTasks > 0 
        ? Math.round((member.tasksCompleted / member.totalTasks) * 100)
        : member.tasksCompleted > 0 
          ? Math.min(100, member.tasksCompleted * 10) // Fallback calculation
          : 0
    }))
    .sort((a, b) => b.score - a.score);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return Trophy;
      case 2: return Medal;
      case 3: return Award;
      default: return TrendingUp;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-gray-600 bg-gray-100';
      case 3: return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🏆 1st';
      case 2: return '🥈 2nd';
      case 3: return '🥉 3rd';
      default: return `${rank}th`;
    }
  };

  return (
    <GlassCard variant="light" className="p-3 sm:p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 font-pretendard tracking-ko-tight">리더보드</h3>
          <p className="text-xs sm:text-sm text-gray-600 font-pretendard">
            {timeRange === 'week' ? '이번 주' : timeRange === 'month' ? '이번 달' : '전체'} 성과 순위
          </p>
        </div>
        <Trophy size={20} className="text-yellow-600 sm:w-6 sm:h-6" />
      </div>

      {sortedMembers.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Trophy size={36} className="mx-auto text-gray-400 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
          <p className="text-sm sm:text-base text-gray-600 font-pretendard">아직 활동 데이터가 없습니다</p>
          <p className="text-xs sm:text-sm text-gray-500 font-pretendard">할일을 완료하면 순위에 나타납니다</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sortedMembers.map((member, index) => {
            const rank = index + 1;
            const RankIcon = getRankIcon(rank);
            const isCurrentUser = member.userId === currentUserId;
            
            return (
              <div
                key={member.userId}
                className={`
                  relative p-3 sm:p-4 rounded-lg border-2 transition-all
                  ${isCurrentUser 
                    ? 'border-primary-300 bg-primary-50' 
                    : 'border-gray-200 bg-white/50'
                  }
                  ${rank <= 3 ? 'shadow-md' : 'shadow-sm'}
                `}
              >
                {/* Rank Badge */}
                <div className="absolute -top-2 -left-2">
                  <div className={`
                    w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${getRankColor(rank)}
                  `}>
                    {rank <= 3 ? <RankIcon size={12} className="sm:w-3.5 sm:h-3.5" /> : rank}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {/* Assuming we have user names - would need to get from user data */}
                      <span className="text-sm sm:text-lg">U</span>
                    </div>
                    
                    {/* Crown for 1st place */}
                    {rank === 1 && (
                      <div className="absolute -top-1 -right-1 text-yellow-500">
                        <span className="text-sm sm:text-base">👑</span>
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 font-pretendard break-keep-ko">
                        {member.userName || `사용자 ${member.userId.slice(-4)}`}
                        {isCurrentUser && (
                          <span className="text-xs sm:text-sm text-primary-600 ml-1">(나)</span>
                        )}
                      </h4>
                      <span className={`
                        px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium
                        ${getRankColor(rank)}
                      `}>
                        <span className="hidden sm:inline">{getRankBadge(rank)}</span>
                        <span className="sm:hidden">{rank}</span>
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {member.tasksCompleted}
                        </span>
                        <span className="text-xs text-gray-500 font-pretendard">완료</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {Math.round(member.completionRate)}%
                        </span>
                        <span className="text-xs text-gray-500 font-pretendard">성공률</span>
                      </div>

                      {/* Streak temporarily disabled */}
                      {false && (
                        <div className="flex items-center gap-1">
                          <Flame size={12} className="text-orange-500 sm:w-3.5 sm:h-3.5" />
                          <span className="text-xs sm:text-sm font-medium text-orange-600">
                            0일
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-sm sm:text-lg font-bold text-gray-900">
                      {Math.round(member.score)}
                    </div>
                    <div className="text-xs text-gray-500 font-pretendard">점수</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 sm:mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div 
                      className={`
                        h-1.5 sm:h-2 rounded-full transition-all duration-500
                        ${rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-blue-400 to-blue-600'}
                      `}
                      style={{ width: `${Math.min(member.completionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Achievement Hints */}
      {sortedMembers.length > 0 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            순위 올리기 팁
          </h4>
          <div className="text-xs text-gray-600 space-y-1 font-pretendard">
            <p>• 할일을 꾸준히 완료하여 완료율을 높이세요</p>
            <p>• 연속으로 할일을 완료하여 스트릭을 쌓으세요</p>
            <p>• 더 많은 할일에 도전해보세요</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default LeaderBoard;