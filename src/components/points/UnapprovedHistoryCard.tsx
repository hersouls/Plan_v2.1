import type { Timestamp } from 'firebase/firestore';
import {
  Award,
  Brain,
  History,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import type { PointHistory } from '../../lib/points';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface UnapprovedHistoryCardProps {
  histories: PointHistory[];
  loading: boolean;
  onOpenAll: () => void;
  onRefresh: () => void;
  onApprove: (historyId: string) => void;
  onReject: (historyId: string) => void;
  approvingId: string | null;
  onTaskClick: (taskId: string) => void;
  pointsAnalyzerAvailable?: boolean;
  onAnalyze?: (history: PointHistory) => void;
}

export const UnapprovedHistoryCard: React.FC<UnapprovedHistoryCardProps> = ({
  histories,
  loading,
  onOpenAll,
  onRefresh,
  onApprove,
  onReject,
  approvingId,
  onTaskClick,
  pointsAnalyzerAvailable,
  onAnalyze,
}) => {
  const formatDate = (timestamp: Timestamp) => {
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return '오늘';
      if (diffDays === 2) return '어제';
      if (diffDays <= 7) return `${diffDays - 1}일 전`;
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '날짜 없음';
    }
  };

  return (
    <GlassCard variant="light" className="p-6 points-glow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-semantic-warning-500 to-semantic-danger-500 rounded-full flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <Typography.H3 className="text-lg font-semibold text-white">
              미승인 포인트 내역
            </Typography.H3>
            <Typography.Caption className="text-white/70">
              승인 대기 중인 활동 내역
            </Typography.Caption>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WaveButton
            onClick={onOpenAll}
            variant="secondary"
            size="sm"
            className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
            aria-label="전체 미승인 포인트 내역 보기"
          >
            <History className="w-4 h-4 mr-2" />
            전체 보기
          </WaveButton>
          <WaveButton
            onClick={onRefresh}
            variant="secondary"
            size="sm"
            disabled={loading}
            className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
            aria-label="미승인 포인트 내역 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </WaveButton>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : histories.length > 0 ? (
        <div
          className="space-y-3"
          role="list"
          aria-label="미승인 포인트 내역 목록"
        >
          {histories.slice(0, 5).map(history => {
            const isEarned =
              history.type === 'earned' || history.type === 'bonus';
            const isDeducted =
              history.type === 'deducted' || history.type === 'penalty';
            return (
              <div
                key={history.id}
                className={`
                  flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg point-history-card
                  ${
                    history.taskId
                      ? 'cursor-pointer hover:ring-2 hover:ring-blue-300'
                      : 'cursor-default'
                  }
                  ${
                    isEarned
                      ? 'point-history-bg-earned'
                      : isDeducted
                      ? 'point-history-bg-deducted'
                      : 'point-history-bg-manual'
                  }
                `}
                role="listitem"
                onClick={
                  history.taskId
                    ? () => onTaskClick(history.taskId)
                    : undefined
                }
                onKeyDown={
                  history.taskId
                    ? e => {
                        if (e.key === 'Enter') onTaskClick(history.taskId);
                      }
                    : undefined
                }
                tabIndex={history.taskId ? 0 : -1}
                aria-label={
                  history.taskId
                    ? `${history.description} 할일 수정하기`
                    : history.description
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm point-icon-animate ${
                      isEarned
                        ? 'point-earned'
                        : isDeducted
                        ? 'point-deducted'
                        : 'point-manual'
                    }`}
                    aria-label={
                      isEarned ? '획득' : isDeducted ? '차감' : '기타'
                    }
                  >
                    {isEarned ? (
                      <Plus className="w-5 h-5" />
                    ) : isDeducted ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <Award className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Typography.Body className="font-semibold text-gray-800 truncate">
                        {history.description}
                      </Typography.Body>
                      {history.taskId && (
                        <span className="text-blue-500 text-xs font-medium flex items-center gap-1">
                          <span>할일 수정</span>
                          <span className="text-blue-400">→</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Typography.Caption className="text-gray-600">
                        {formatDate(history.createdAt)}
                      </Typography.Caption>
                      {history.type === 'bonus' && (
                        <span className="point-badge point-badge-bonus">
                          보너스
                        </span>
                      )}
                      <span className="px-2 py-1 bg-semantic-warning-50 text-semantic-warning-700 text-xs rounded-full font-medium">
                        승인 대기
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Typography.Body
                      className={`font-bold text-lg ${
                        isEarned
                          ? 'text-semantic-success-600'
                          : isDeducted
                          ? 'text-semantic-danger-600'
                          : 'text-semantic-primary-600'
                      }`}
                    >
                      {isEarned ? '+' : isDeducted ? '-' : ''}
                      {history.amount}
                    </Typography.Body>
                    <Typography.Caption className="text-gray-600 font-medium">
                      포인트
                    </Typography.Caption>
                  </div>
                  <div className="flex gap-2">
                    {pointsAnalyzerAvailable && onAnalyze && (
                      <WaveButton
                        onClick={e => {
                          e.stopPropagation();
                          onAnalyze(history);
                        }}
                        variant="secondary"
                        size="sm"
                        className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-200"
                        aria-label="AI 분석"
                        title="Claude AI로 포인트 분석"
                      >
                        <Brain className="w-3 h-3" />
                      </WaveButton>
                    )}
                    <WaveButton
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('이 포인트 내역을 승인하시겠습니까?')) {
                          onApprove(history.id);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      disabled={approvingId === history.id}
                      className="text-semantic-success-600 border-semantic-success-600 hover:bg-semantic-success-600 hover:text-white transition-all duration-200"
                      aria-label="포인트 내역 승인"
                    >
                      {approvingId === history.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        '승인'
                      )}
                    </WaveButton>
                    <WaveButton
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('이 포인트 내역을 거부하시겠습니까?')) {
                          onReject(history.id);
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      disabled={approvingId === history.id}
                      className="text-semantic-danger-600 border-semantic-danger-600 hover:bg-semantic-danger-600 hover:text-white transition-all duration-200"
                      aria-label="포인트 내역 거부"
                    >
                      {approvingId === history.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        '거부'
                      )}
                    </WaveButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-12"
          role="status"
          aria-label="미승인 포인트 내역 없음"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <Typography.H4 className="text-white font-semibold mb-2">
            승인 대기 중인 포인트 내역이 없습니다
          </Typography.H4>
          <Typography.Body className="text-white/70">
            모든 포인트가 승인되었거나 아직 포인트 내역이 없어요!
          </Typography.Body>
        </div>
      )}
    </GlassCard>
  );
};

export default UnapprovedHistoryCard;
