import { useMemo } from 'react';
import { Calendar, Flame, Trophy, Target, Zap } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  streakHistory: Array<{
    date: string;
    completed: boolean;
    count?: number;
  }>;
}

interface StreakDisplayProps {
  data: StreakData;
  title?: string;
  showHistory?: boolean;
  compact?: boolean;
}

export function StreakDisplay({
  data,
  title = '연속 완료 기록',
  showHistory = true,
  compact = false
}: StreakDisplayProps) {
  const { currentStreak, longestStreak, todayCompleted, streakHistory } = data;

  // Generate calendar grid for last 30 days
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const historyEntry = streakHistory.find(h => h.date === dateStr);
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        isToday: i === 0,
        completed: historyEntry?.completed || false,
        count: historyEntry?.count || 0,
        dayOfWeek: date.getDay()
      });
    }
    
    return days;
  }, [streakHistory]);

  // Calculate streak level and rewards
  const streakLevel = useMemo(() => {
    if (currentStreak >= 30) return { level: 'master', emoji: '🏆', color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    if (currentStreak >= 21) return { level: 'expert', emoji: '🥇', color: 'text-orange-500', bgColor: 'bg-orange-50' };
    if (currentStreak >= 14) return { level: 'advanced', emoji: '🔥', color: 'text-red-500', bgColor: 'bg-red-50' };
    if (currentStreak >= 7) return { level: 'intermediate', emoji: '⚡', color: 'text-blue-500', bgColor: 'bg-blue-50' };
    if (currentStreak >= 3) return { level: 'beginner', emoji: '🌟', color: 'text-green-500', bgColor: 'bg-green-50' };
    return { level: 'starter', emoji: '🎯', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }, [currentStreak]);

  // Next milestone
  const nextMilestone = useMemo(() => {
    const milestones = [3, 7, 14, 21, 30, 50, 100];
    return milestones.find(m => m > currentStreak) || (currentStreak + 10);
  }, [currentStreak]);

  const progressToNext = ((currentStreak % nextMilestone) / nextMilestone) * 100;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl ${streakLevel.bgColor}`}>
        <div className="text-2xl">{streakLevel.emoji}</div>
        <div>
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${streakLevel.color}`} />
            <span className="text-lg font-bold text-gray-900">{currentStreak}일</span>
          </div>
          <p className="text-xs text-gray-600">연속 완료</p>
        </div>
        {!todayCompleted && (
          <div className="ml-auto">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" title="오늘 할일을 완료하세요!" />
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard variant="light" className="p-6">
      <div className="mb-6">
        <h3 className="text-lg-ko font-semibold text-gray-900 mb-2">{title}</h3>
        
        {/* Current streak display */}
        <div className={`p-4 rounded-xl ${streakLevel.bgColor} mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{streakLevel.emoji}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className={`w-5 h-5 ${streakLevel.color}`} />
                  <span className="text-2xl font-bold text-gray-900">{currentStreak}</span>
                  <span className="text-lg text-gray-600">일 연속</span>
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {streakLevel.level} 레벨
                </div>
              </div>
            </div>
            
            {!todayCompleted && currentStreak > 0 && (
              <div className="text-right">
                <div className="text-xs text-yellow-600 font-medium mb-1">
                  오늘 완료하여 연속 기록 유지!
                </div>
                <div className="flex items-center justify-end gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-gray-500">대기중</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Progress to next milestone */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>다음 목표까지</span>
              <span>{nextMilestone - currentStreak}일 남음</span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${streakLevel.color.replace('text-', 'bg-')}`}
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{longestStreak}</div>
            <div className="text-xs text-gray-600">최장 기록</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{nextMilestone}</div>
            <div className="text-xs text-gray-600">다음 목표</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">
              {streakHistory.filter(h => h.completed).length}
            </div>
            <div className="text-xs text-gray-600">총 완료일</div>
          </div>
        </div>
      </div>

      {/* Calendar history */}
      {showHistory && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-800">최근 30일 기록</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                <span>완료</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 rounded-sm" />
                <span>미완료</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm border-2 border-blue-600" />
                <span>오늘</span>
              </div>
            </div>
          </div>
          
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-xs text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center text-xs rounded-md transition-all
                  ${day.isToday 
                    ? day.completed 
                      ? 'bg-blue-500 text-white border-2 border-blue-600' 
                      : 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                    : day.completed 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }
                  ${day.completed ? 'font-medium' : ''}
                `}
                title={`${day.date} - ${day.completed ? `${day.count}개 완료` : '미완료'}`}
              >
                {day.day}
                {day.completed && day.count > 1 && (
                  <span className="absolute text-[8px] mt-3">
                    {day.count}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Motivational message */}
          <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {currentStreak === 0 ? (
                  <p className="text-gray-700">
                    <span className="font-medium">새로운 시작!</span> 오늘부터 연속 완료 기록을 쌓아보세요.
                  </p>
                ) : currentStreak < 3 ? (
                  <p className="text-gray-700">
                    <span className="font-medium">좋은 시작!</span> 3일 연속 달성까지 {3 - currentStreak}일 남았어요.
                  </p>
                ) : currentStreak < 7 ? (
                  <p className="text-gray-700">
                    <span className="font-medium">훌륭해요!</span> 7일 연속 달성까지 {7 - currentStreak}일 남았어요.
                  </p>
                ) : (
                  <p className="text-gray-700">
                    <span className="font-medium">대단합니다!</span> 꾸준함이 습관이 되어가고 있어요.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default StreakDisplay;