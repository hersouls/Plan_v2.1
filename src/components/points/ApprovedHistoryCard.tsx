import type { Timestamp } from 'firebase/firestore';
import {
  Award,
  CheckCircle,
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

interface ApprovedHistoryCardProps {
  histories: PointHistory[];
  loading: boolean;
  onOpenAll: () => void;
  onRefresh: () => void;
}

export const ApprovedHistoryCard: React.FC<ApprovedHistoryCardProps> = ({
  histories,
  loading,
  onOpenAll,
  onRefresh,
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
          <div className="w-10 h-10 bg-gradient-to-br from-semantic-success-500 to-semantic-success-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <Typography.H3 className="text-lg font-semibold text-white">
              승인된 포인트 내역
            </Typography.H3>
            <Typography.Caption className="text-white/70">
              승인 완료된 활동 내역
            </Typography.Caption>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WaveButton
            onClick={onOpenAll}
            variant="secondary"
            size="sm"
            className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
            aria-label="전체 승인된 포인트 내역 보기"
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
            aria-label="승인된 포인트 내역 새로고침"
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
          aria-label="승인된 포인트 내역 목록"
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
                    isEarned
                      ? 'point-history-bg-earned'
                      : isDeducted
                      ? 'point-history-bg-deducted'
                      : 'point-history-bg-manual'
                  }
                `}
                role="listitem"
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
                    <Typography.Body className="font-semibold text-gray-800 truncate">
                      {history.description}
                    </Typography.Body>
                    <div className="flex items-center gap-2 mt-1">
                      <Typography.Caption className="text-gray-600">
                        {formatDate(history.createdAt)}
                      </Typography.Caption>
                      {history.type === 'bonus' && (
                        <span className="point-badge point-badge-bonus">
                          보너스
                        </span>
                      )}
                      <span className="px-2 py-1 bg-semantic-success-50 text-semantic-success-700 text-xs rounded-full font-medium">
                        승인 완료
                      </span>
                    </div>
                  </div>
                </div>
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
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-12"
          role="status"
          aria-label="승인된 포인트 내역 없음"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <Typography.H4 className="text-white font-semibold mb-2">
            승인된 포인트 내역이 없습니다
          </Typography.H4>
          <Typography.Body className="text-white/70">
            아직 승인된 포인트 내역이 없어요!
          </Typography.Body>
        </div>
      )}
    </GlassCard>
  );
};

export default ApprovedHistoryCard;
