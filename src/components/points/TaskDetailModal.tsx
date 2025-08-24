import { X } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { Task } from '../../types/task';
import { Group } from '../../types/group';

interface TaskDetailModalProps {
  task: Task | null;
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, group, isOpen, onClose }: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-modal-title"
    >
      <GlassCard variant="strong" className="w-full max-w-lg p-6 modal-enter">
        <div className="flex items-center justify-between mb-4">
          <Typography.H3 id="task-detail-modal-title" className="text-white">
            할일 상세 (임시)
          </Typography.H3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="할일 상세 모달 닫기"
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>

        <div className="space-y-2">
          <Typography.Body className="text-white/90 font-semibold">
            {task.title || '제목 없음'}
          </Typography.Body>
          <Typography.Body className="text-white/70">
            그룹: {group?.name || task.groupId || 'N/A'}
          </Typography.Body>
          <Typography.Caption className="text-white/60">
            정식 상세 보기 UI는 추후 제공됩니다.
          </Typography.Caption>
        </div>

        <div className="mt-6 flex justify-end">
          <WaveButton variant="secondary" onClick={onClose} aria-label="할일 상세 닫기">
            닫기
          </WaveButton>
        </div>
      </GlassCard>
    </div>
  );
}


