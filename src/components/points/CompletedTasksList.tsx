import { CheckCircle, Clock, RefreshCw, Tag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { Group } from '../../types/group';
import { Task } from '../../types/task';
import { toDate } from '../../utils/dateHelpers';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/button';
import { Typography } from '../ui/typography';

interface CompletedTasksListProps {
  selectedGroupId: string | null;
  selectedMemberId?: string;
  groups: Group[];
  onTaskSelect?: (task: Task) => void;
}

interface TaskGroup {
  id: string;
  name: string;
  tasks: Task[];
  totalPoints: number;
}

export const CompletedTasksList = ({
  selectedGroupId,
  selectedMemberId,
  groups,
  onTaskSelect,
}: CompletedTasksListProps) => {
  const [groupedTasks, setGroupedTasks] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // 선택된 그룹의 완료된 할일들 가져오기 (초기 로드 시 데이터 가져오기)
  const {
    tasks: completedTasks,
    loading: tasksLoading,
    refresh,
  } = useTasks({
    groupId: selectedGroupId || undefined,
    filters: {
      status: ['completed'],
    },
    realtime: false, // 실시간 구독 비활성화
  });

  // 새로고침 함수
  const handleRefresh = async () => {
    if (selectedGroupId) {
      setLoading(true);
      try {
        await refresh();
      } catch (error) {
        console.error('새로고침 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 최근 1개월 필터링 함수
  const filterRecentTasks = (tasks: Task[]) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    return tasks.filter(task => {
      if (!task.completedAt) {
        return false;
      }
      const completedDate = toDate(task.completedAt);
      return completedDate >= oneMonthAgo;
    });
  };

  // 할일별 포인트 계산 (간단한 로직)
  const calculateTaskPoints = (task: Task): number => {
    // 우선순위에 따른 기본 포인트
    const basePoints = {
      low: 5,
      medium: 10,
      high: 15,
    };

    let points = basePoints[task.priority] || 10;

    // 예상 시간에 따른 보너스 포인트
    if (task.estimatedMinutes) {
      const hours = task.estimatedMinutes / 60;
      if (hours >= 2) points += 5;
      if (hours >= 4) points += 5;
    }

    // 카테고리에 따른 보너스 포인트
    if (task.category === '가족활동' || task.category === '청소') {
      points += 3;
    }

    return points;
  };

  // 총 포인트 계산
  const calculateTotalPoints = (tasks: Task[]): number => {
    return tasks.reduce((total, task) => total + calculateTaskPoints(task), 0);
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    const date = toDate(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 시간 포맷팅
  const formatTime = (timestamp: any) => {
    const date = toDate(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 그룹별로 할일 분류
  useEffect(() => {
    if (!selectedGroupId || !groups.length) {
      setGroupedTasks([]);
      return;
    }

    // 최근 1개월 완료된 할일만 필터링
    const recentCompletedTasks = filterRecentTasks(completedTasks);

    // 1차 그룹 (선택된 그룹)
    const primaryGroup = groups.find(g => g.id === selectedGroupId);
    const primaryGroupTasks = recentCompletedTasks.filter(
      task =>
        task.groupId === selectedGroupId &&
        (!selectedMemberId || task.assigneeId === selectedMemberId)
    );

    // 2차 그룹 (다른 그룹들)
    const secondaryGroupTasks = recentCompletedTasks.filter(
      task =>
        task.groupId !== selectedGroupId &&
        (!selectedMemberId || task.assigneeId === selectedMemberId)
    );

    const grouped: TaskGroup[] = [];

    // 1차 그룹 추가
    if (primaryGroup && primaryGroupTasks.length > 0) {
      grouped.push({
        id: primaryGroup.id,
        name: primaryGroup.name,
        tasks: primaryGroupTasks,
        totalPoints: calculateTotalPoints(primaryGroupTasks),
      });
    }

    // 2차 그룹들을 하나로 묶어서 추가
    if (secondaryGroupTasks.length > 0) {
      grouped.push({
        id: 'secondary-groups',
        name: '다른 그룹 할일',
        tasks: secondaryGroupTasks,
        totalPoints: calculateTotalPoints(secondaryGroupTasks),
      });
    }

    setGroupedTasks(grouped);
  }, [selectedGroupId, groups, selectedMemberId, completedTasks]);

  if (loading || tasksLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedGroupId) {
    return (
      <GlassCard variant="medium" className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <Typography.H3 className="text-xl font-semibold text-white mb-2 font-pretendard">
          그룹을 선택해주세요
        </Typography.H3>
        <Typography.Body className="text-white/80 font-pretendard">
          완료된 할일을 확인할 그룹을 선택하세요
        </Typography.Body>
      </GlassCard>
    );
  }

  if (groupedTasks.length === 0) {
    return (
      <GlassCard variant="medium" className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <Typography.H3 className="text-xl font-semibold text-white mb-2 font-pretendard">
          최근 1개월 완료된 할일이 없습니다
        </Typography.H3>
        <Typography.Body className="text-white/80 font-pretendard">
          최근 1개월 동안 완료된 할일이 없습니다. 할일을 완료해보세요!
        </Typography.Body>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {groupedTasks.map(group => (
        <GlassCard key={group.id} variant="medium" className="p-6">
          {/* 그룹 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`
                 task-group-indicator
                 ${
                   group.id === selectedGroupId
                     ? 'task-group-primary'
                     : 'task-group-secondary'
                 }
               `}
              >
                {group.id === selectedGroupId ? '1' : '2'}
              </div>
              <div>
                <Typography.H3 className="text-lg font-semibold text-white font-pretendard">
                  {group.name}
                </Typography.H3>
                <Typography.Caption className="text-white/60 font-pretendard">
                  {group.id === selectedGroupId ? '1차 그룹' : '2차 그룹'} •{' '}
                  {group.tasks.length}개 완료
                </Typography.Caption>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 새로고침 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span className="ml-2 font-pretendard">새로고침</span>
              </Button>
              <div className="text-right">
                <Typography.H2 className="text-2xl font-bold text-yellow-400">
                  {group.totalPoints}
                </Typography.H2>
                <Typography.Caption className="text-white/60 font-pretendard">
                  총 포인트
                </Typography.Caption>
              </div>
            </div>
          </div>

          {/* 할일 목록 */}
          <div className="space-y-4">
            {group.tasks.map(task => (
              <div
                key={task.id}
                className={`
                   p-4 rounded-lg cursor-pointer completed-task-card
                   ${
                     onTaskSelect
                       ? 'bg-white/10 border border-transparent'
                       : 'bg-white/5'
                   }
                 `}
                onClick={() => onTaskSelect?.(task)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 할일 제목과 상태 */}
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <Typography.Body className="font-semibold text-white truncate font-pretendard">
                        {task.title}
                      </Typography.Body>
                    </div>

                    {/* 할일 설명 */}
                    {task.description && (
                      <Typography.Caption className="text-white/70 mb-3 block font-pretendard line-clamp-2">
                        {task.description}
                      </Typography.Caption>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex flex-wrap gap-4 text-xs">
                      {/* 담당자 */}
                      <div className="flex items-center gap-1 text-white/60">
                        <User className="w-3 h-3" />
                        <span className="font-pretendard">
                          {task.assigneeName || '담당자'}
                        </span>
                      </div>

                      {/* 카테고리 */}
                      <div className="flex items-center gap-1 text-white/60">
                        <Tag className="w-3 h-3" />
                        <span className="font-pretendard">{task.category}</span>
                      </div>

                      {/* 완료 시간 */}
                      {task.completedAt && (
                        <div className="flex items-center gap-1 text-white/60">
                          <Clock className="w-3 h-3" />
                          <span className="font-pretendard">
                            {formatDate(task.completedAt)}{' '}
                            {formatTime(task.completedAt)}
                          </span>
                        </div>
                      )}

                      {/* 우선순위 */}
                      <div
                        className={`
                        px-2 py-1 rounded-full text-xs font-medium font-pretendard border
                        ${
                          task.priority === 'high'
                            ? 'priority-high'
                            : task.priority === 'medium'
                            ? 'priority-medium'
                            : 'priority-low'
                        }
                      `}
                      >
                        {task.priority === 'high'
                          ? '높음'
                          : task.priority === 'medium'
                          ? '보통'
                          : '낮음'}
                      </div>
                    </div>

                    {/* 완료 노트 */}
                    {task.completionNotes && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <Typography.Caption className="text-white/80 font-pretendard">
                          {task.completionNotes}
                        </Typography.Caption>
                      </div>
                    )}
                  </div>

                  {/* 포인트 */}
                  <div className="text-right flex-shrink-0">
                    <Typography.Body className="font-bold text-yellow-400 text-lg">
                      +{calculateTaskPoints(task)}
                    </Typography.Body>
                    <Typography.Caption className="text-white/60 font-pretendard">
                      포인트
                    </Typography.Caption>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
