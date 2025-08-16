import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Star,
  Tag,
  User,
  X,
} from 'lucide-react';
import { Group } from '../../types/group';
import { Task } from '../../types/task';
import { toDate } from '../../utils/dateHelpers';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface TaskDetailModalProps {
  task: Task | null;
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal = ({
  task,
  group,
  isOpen,
  onClose,
}: TaskDetailModalProps) => {
  if (!isOpen || !task) return null;

  // 할일별 포인트 계산
  const calculateTaskPoints = (task: Task): number => {
    const basePoints = {
      low: 5,
      medium: 10,
      high: 15,
    };

    let points = basePoints[task.priority] || 10;

    if (task.estimatedMinutes) {
      const hours = task.estimatedMinutes / 60;
      if (hours >= 2) points += 5;
      if (hours >= 4) points += 5;
    }

    if (task.category === '가족활동' || task.category === '청소') {
      points += 3;
    }

    return points;
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    const date = toDate(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
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

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // 우선순위 텍스트
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '미설정';
    }
  };

  const taskPoints = calculateTaskPoints(task);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 task-detail-modal">
      <GlassCard
        variant="strong"
        className="w-full max-w-2xl task-detail-content p-6 m-4"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <Typography.H3 className="text-xl font-semibold text-white font-pretendard">
                완료된 할일 상세
              </Typography.H3>
              <Typography.Caption className="text-white/60 font-pretendard">
                {group?.name || '그룹'} • {formatDate(task.completedAt)}
              </Typography.Caption>
            </div>
          </div>
          <WaveButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
            aria-label="모달 닫기"
          >
            <X className="w-5 h-5" />
          </WaveButton>
        </div>

        {/* 할일 제목 */}
        <div className="mb-6">
          <Typography.H2 className="text-2xl font-bold text-white mb-2 font-pretendard break-keep-ko">
            {task.title}
          </Typography.H2>
          {task.description && (
            <Typography.Body className="text-white/80 font-pretendard leading-relaxed">
              {task.description}
            </Typography.Body>
          )}
        </div>

        {/* 포인트 정보 */}
        <div className="mb-6 points-calculation">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-yellow-400" />
              <div>
                <Typography.H3 className="text-lg font-semibold text-yellow-400 font-pretendard">
                  획득 포인트
                </Typography.H3>
                <Typography.Caption className="text-yellow-300/80 font-pretendard">
                  할일 완료로 획득한 포인트입니다
                </Typography.Caption>
              </div>
            </div>
            <div className="text-right">
              <Typography.H2 className="text-3xl font-bold text-yellow-400">
                +{taskPoints}
              </Typography.H2>
              <Typography.Caption className="text-yellow-300/80 font-pretendard">
                포인트
              </Typography.Caption>
            </div>
          </div>
        </div>

        {/* 할일 정보 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 담당자 */}
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-400" />
              <Typography.Caption className="text-white/60 font-pretendard">
                담당자
              </Typography.Caption>
            </div>
            <Typography.Body className="font-semibold text-white font-pretendard">
              {task.assigneeName || '담당자'}
            </Typography.Body>
          </div>

          {/* 카테고리 */}
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-green-400" />
              <Typography.Caption className="text-white/60 font-pretendard">
                카테고리
              </Typography.Caption>
            </div>
            <Typography.Body className="font-semibold text-white font-pretendard">
              {task.category}
            </Typography.Body>
          </div>

          {/* 우선순위 */}
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <Typography.Caption className="text-white/60 font-pretendard">
                우선순위
              </Typography.Caption>
            </div>
            <div
              className={`
              inline-flex px-3 py-1 rounded-full text-sm font-medium border
              ${
                task.priority === 'high'
                  ? 'priority-high'
                  : task.priority === 'medium'
                  ? 'priority-medium'
                  : 'priority-low'
              }
            `}
            >
              {getPriorityText(task.priority)}
            </div>
          </div>

          {/* 예상 시간 */}
          {task.estimatedMinutes && (
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <Typography.Caption className="text-white/60 font-pretendard">
                  예상 시간
                </Typography.Caption>
              </div>
              <Typography.Body className="font-semibold text-white font-pretendard">
                {task.estimatedMinutes}분
              </Typography.Body>
            </div>
          )}
        </div>

        {/* 시간 정보 */}
        <div className="mb-6">
          <Typography.H3 className="text-lg font-semibold text-white mb-4 font-pretendard">
            시간 정보
          </Typography.H3>
          <div className="space-y-3">
            {/* 생성 시간 */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <Typography.Body className="text-white/80 font-pretendard">
                  생성 시간
                </Typography.Body>
              </div>
              <Typography.Body className="text-white font-pretendard">
                {formatDate(task.createdAt)} {formatTime(task.createdAt)}
              </Typography.Body>
            </div>

            {/* 완료 시간 */}
            {task.completedAt && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <Typography.Body className="text-white/80 font-pretendard">
                    완료 시간
                  </Typography.Body>
                </div>
                <Typography.Body className="text-white font-pretendard">
                  {formatDate(task.completedAt)} {formatTime(task.completedAt)}
                </Typography.Body>
              </div>
            )}

            {/* 마감일 */}
            {task.dueDate && (
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <Typography.Body className="text-white/80 font-pretendard">
                    마감일
                  </Typography.Body>
                </div>
                <Typography.Body className="text-white font-pretendard">
                  {formatDate(task.dueDate)}
                </Typography.Body>
              </div>
            )}
          </div>
        </div>

        {/* 완료 노트 */}
        {task.completionNotes && (
          <div className="mb-6">
            <Typography.H3 className="text-lg font-semibold text-white mb-3 font-pretendard">
              완료 노트
            </Typography.H3>
            <div className="p-4 bg-white/10 rounded-lg border border-white/20">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <Typography.Body className="text-white/90 font-pretendard leading-relaxed">
                  {task.completionNotes}
                </Typography.Body>
              </div>
            </div>
          </div>
        )}

        {/* 태그 */}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-6">
            <Typography.H3 className="text-lg font-semibold text-white mb-3 font-pretendard">
              태그
            </Typography.H3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 text-white/90 rounded-full text-sm font-medium font-pretendard"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 포인트 계산 상세 */}
        <div className="mb-6">
          <Typography.H3 className="text-lg font-semibold text-white mb-3 font-pretendard">
            포인트 계산 상세
          </Typography.H3>
          <div className="space-y-2 p-4 bg-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <Typography.Body className="text-white/80 font-pretendard">
                기본 포인트 ({getPriorityText(task.priority)})
              </Typography.Body>
              <Typography.Body className="text-white font-pretendard">
                +
                {task.priority === 'high'
                  ? 15
                  : task.priority === 'medium'
                  ? 10
                  : 5}
              </Typography.Body>
            </div>

            {task.estimatedMinutes && (
              <div className="flex items-center justify-between">
                <Typography.Body className="text-white/80 font-pretendard">
                  시간 보너스 ({task.estimatedMinutes}분)
                </Typography.Body>
                <Typography.Body className="text-white font-pretendard">
                  +
                  {task.estimatedMinutes >= 240
                    ? 10
                    : task.estimatedMinutes >= 120
                    ? 5
                    : 0}
                </Typography.Body>
              </div>
            )}

            {(task.category === '가족활동' || task.category === '청소') && (
              <div className="flex items-center justify-between">
                <Typography.Body className="text-white/80 font-pretendard">
                  카테고리 보너스 ({task.category})
                </Typography.Body>
                <Typography.Body className="text-white font-pretendard">
                  +3
                </Typography.Body>
              </div>
            )}

            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <Typography.Body className="font-semibold text-white font-pretendard">
                  총 획득 포인트
                </Typography.Body>
                <Typography.H3 className="font-bold text-yellow-400 font-pretendard">
                  +{taskPoints}
                </Typography.H3>
              </div>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end">
          <WaveButton
            onClick={onClose}
            variant="secondary"
            className="font-pretendard"
          >
            닫기
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
};
