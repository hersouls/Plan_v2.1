import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../lib/logger';
import {
  NotificationAnalytics,
  NotificationAnalyticsService,
} from '../../lib/notificationAnalytics';
import { NotificationRetryService } from '../../lib/notificationRetry';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/typography';

interface NotificationAnalyticsDashboardProps {
  showSystemStats?: boolean;
  days?: number;
}

interface RetryStats {
  pending: number;
  retrying: number;
  failed: number;
  success: number;
}

export const NotificationAnalyticsDashboard: React.FC<
  NotificationAnalyticsDashboardProps
> = ({ showSystemStats = false, days = 30 }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(
    null
  );
  const [retryStats, setRetryStats] = useState<RetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceIssues, setPerformanceIssues] = useState<{
    warnings: string[];
    criticalIssues: string[];
  }>({ warnings: [], criticalIssues: [] });

  // 데이터 로드
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user && !showSystemStats) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let analyticsData: NotificationAnalytics;

        if (showSystemStats) {
          analyticsData = await NotificationAnalyticsService.getSystemAnalytics(
            days
          );
        } else if (user) {
          analyticsData = await NotificationAnalyticsService.getUserAnalytics(
            user.uid,
            days
          );
          const userRetryStats =
            await NotificationRetryService.getUserRetryStats(user.uid);
          setRetryStats(userRetryStats);
        } else {
          throw new Error('User not authenticated');
        }

        setAnalytics(analyticsData);

        // 성능 임계값 확인
        const issues =
          await NotificationAnalyticsService.checkPerformanceThresholds(
            analyticsData
          );
        setPerformanceIssues(issues);
      } catch (err) {
        logger.error(
          'notificationAnalytics',
          'failed to load dashboard data',
          err
        );
        setError('알림 통계를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, showSystemStats, days]);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">통계 로딩 중...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <Typography.Body className="text-red-600">{error}</Typography.Body>
        </div>
      </GlassCard>
    );
  }

  if (!analytics) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <Typography.Body className="text-gray-600">
            {showSystemStats
              ? '시스템 통계를 사용할 수 없습니다.'
              : '알림 데이터가 없습니다.'}
          </Typography.Body>
        </div>
      </GlassCard>
    );
  }

  // 메트릭 카드 컴포넌트
  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <Typography.Small className={`${color} font-medium`}>
            {title}
          </Typography.Small>
          <Typography.H3 className={`${color} mt-1`}>{value}</Typography.H3>
          {subtitle && (
            <Typography.Small className={`${color} opacity-80`}>
              {subtitle}
            </Typography.Small>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H2>
            {showSystemStats ? '시스템 알림 통계' : '내 알림 통계'}
          </Typography.H2>
          <Typography.Body className="text-gray-600 mt-1">
            최근 {days}일간의 알림 데이터
          </Typography.Body>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <Typography.Small className="text-blue-600 font-medium">
            성능 분석
          </Typography.Small>
        </div>
      </div>

      {/* 성능 이슈 알림 */}
      {(performanceIssues.criticalIssues.length > 0 ||
        performanceIssues.warnings.length > 0) && (
        <GlassCard className="p-4">
          <Typography.H4 className="text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            성능 이슈 감지
          </Typography.H4>

          {performanceIssues.criticalIssues.length > 0 && (
            <div className="mb-3">
              <Typography.Small className="text-red-700 font-medium mb-2 block">
                심각한 문제:
              </Typography.Small>
              <ul className="space-y-1">
                {performanceIssues.criticalIssues.map((issue, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-600 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {performanceIssues.warnings.length > 0 && (
            <div>
              <Typography.Small className="text-yellow-700 font-medium mb-2 block">
                주의사항:
              </Typography.Small>
              <ul className="space-y-1">
                {performanceIssues.warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="text-sm text-yellow-600 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      )}

      {/* 주요 메트릭 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="총 전송"
          value={analytics.totalSent.toLocaleString()}
          icon={Bell}
          color="text-blue-700"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="전송 성공"
          value={analytics.totalDelivered.toLocaleString()}
          icon={CheckCircle}
          color="text-green-700"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="클릭"
          value={analytics.totalClicked.toLocaleString()}
          icon={TrendingUp}
          color="text-purple-700"
          bgColor="bg-purple-50"
        />
        <MetricCard
          title="실패"
          value={analytics.totalFailed.toLocaleString()}
          icon={XCircle}
          color="text-red-700"
          bgColor="bg-red-50"
        />
      </div>

      {/* 성능 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="전송 성공률"
          value={`${analytics.deliveryRate}%`}
          icon={CheckCircle}
          color="text-green-700"
          bgColor="bg-green-50"
          subtitle="목표: 95% 이상"
        />
        <MetricCard
          title="클릭률"
          value={`${analytics.clickRate}%`}
          icon={TrendingUp}
          color="text-purple-700"
          bgColor="bg-purple-50"
          subtitle="목표: 5% 이상"
        />
        <MetricCard
          title="평균 응답 시간"
          value={`${analytics.averageResponseTime}ms`}
          icon={Clock}
          color="text-blue-700"
          bgColor="bg-blue-50"
          subtitle="목표: 5초 이하"
        />
      </div>

      {/* 재시도 통계 (사용자 통계일 때만) */}
      {retryStats && !showSystemStats && (
        <GlassCard className="p-6">
          <Typography.H4 className="mb-4">재시도 현황</Typography.H4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="대기 중"
              value={retryStats.pending}
              icon={Clock}
              color="text-yellow-700"
              bgColor="bg-yellow-50"
            />
            <MetricCard
              title="재시도 중"
              value={retryStats.retrying}
              icon={TrendingUp}
              color="text-blue-700"
              bgColor="bg-blue-50"
            />
            <MetricCard
              title="최종 실패"
              value={retryStats.failed}
              icon={XCircle}
              color="text-red-700"
              bgColor="bg-red-50"
            />
            <MetricCard
              title="재시도 성공"
              value={retryStats.success}
              icon={CheckCircle}
              color="text-green-700"
              bgColor="bg-green-50"
            />
          </div>
        </GlassCard>
      )}

      {/* 알림 유형별 분석 */}
      {Object.keys(analytics.typeBreakdown).length > 0 && (
        <GlassCard className="p-6">
          <Typography.H4 className="mb-4">알림 유형별 분석</Typography.H4>
          <div className="space-y-3">
            {Object.entries(analytics.typeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage =
                  analytics.totalSent > 0
                    ? ((count / analytics.totalSent) * 100).toFixed(1)
                    : '0';

                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <Typography.Body className="font-medium">
                        {getTypeLabel(type)}
                      </Typography.Body>
                    </div>
                    <div className="flex items-center gap-4">
                      <Typography.Small className="text-gray-600">
                        {count.toLocaleString()}개 ({percentage}%)
                      </Typography.Small>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(parseFloat(percentage), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      )}

      {/* 오류 분석 */}
      {Object.keys(analytics.errorBreakdown).length > 0 && (
        <GlassCard className="p-6">
          <Typography.H4 className="mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            오류 분석
          </Typography.H4>
          <div className="space-y-3">
            {Object.entries(analytics.errorBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([errorCode, count]) => {
                const percentage =
                  analytics.totalFailed > 0
                    ? ((count / analytics.totalFailed) * 100).toFixed(1)
                    : '0';

                return (
                  <div
                    key={errorCode}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <Typography.Body className="font-medium text-red-700">
                        {errorCode}
                      </Typography.Body>
                    </div>
                    <div className="flex items-center gap-4">
                      <Typography.Small className="text-gray-600">
                        {count.toLocaleString()}개 ({percentage}%)
                      </Typography.Small>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(parseFloat(percentage), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      )}
    </div>
  );

  // 알림 유형 라벨 매핑
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      task_reminder: '할일 알림',
      task_assigned: '할일 할당',
      task_completed: '할일 완료',
      mention: '멘션',
      new_comment: '새 댓글',
      system: '시스템',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* 기본 통계 */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Small className="text-gray-600">총 발송</Typography.Small>
                <Typography.H3 className="text-2xl font-bold">
                  {(analytics?.totalSent ?? 0).toLocaleString()}
                </Typography.H3>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Small className="text-gray-600">성공률</Typography.Small>
                <Typography.H3 className="text-2xl font-bold text-green-600">
                  {analytics && analytics.totalSent > 0
                    ? (
                        ((analytics.totalSent - analytics.totalFailed) /
                          analytics.totalSent) *
                        100
                      ).toFixed(1)
                    : '0.0'}
                  %
                </Typography.H3>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Small className="text-gray-600">실패</Typography.Small>
                <Typography.H3 className="text-2xl font-bold text-red-600">
                  {(analytics?.totalFailed ?? 0).toLocaleString()}
                </Typography.H3>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Small className="text-gray-600">평균 응답시간</Typography.Small>
                <Typography.H3 className="text-2xl font-bold">
                  {analytics ? analytics.averageResponseTime.toFixed(1) : 0}ms
                </Typography.H3>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </GlassCard>
        </div>
      )}

      {/* 성능 이슈 경고 */}
      {(performanceIssues.warnings.length > 0 ||
        performanceIssues.criticalIssues.length > 0) && (
        <GlassCard className="p-6 border-l-4 border-yellow-400">
          <Typography.H4 className="mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            성능 경고
          </Typography.H4>
          <div className="space-y-2">
            {performanceIssues.criticalIssues.map((issue, index) => (
              <Typography.Body key={index} className="text-red-600">
                ⚠️ {issue}
              </Typography.Body>
            ))}
            {performanceIssues.warnings.map((warning, index) => (
              <Typography.Body key={index} className="text-yellow-600">
                ⚠️ {warning}
              </Typography.Body>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 재시도 통계 */}
      {retryStats && (
        <GlassCard className="p-6">
          <Typography.H4 className="mb-4">재시도 통계</Typography.H4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Typography.H5 className="text-blue-600">
                {retryStats?.pending ?? 0}
              </Typography.H5>
              <Typography.Small className="text-gray-600">대기중</Typography.Small>
            </div>
            <div className="text-center">
              <Typography.H5 className="text-yellow-600">
                {retryStats?.retrying ?? 0}
              </Typography.H5>
              <Typography.Small className="text-gray-600">재시도중</Typography.Small>
            </div>
            <div className="text-center">
              <Typography.H5 className="text-red-600">
                {retryStats?.failed ?? 0}
              </Typography.H5>
              <Typography.Small className="text-gray-600">실패</Typography.Small>
            </div>
            <div className="text-center">
              <Typography.H5 className="text-green-600">
                {retryStats?.success ?? 0}
              </Typography.H5>
              <Typography.Small className="text-gray-600">성공</Typography.Small>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 알림 유형별 분석 */}
      {Object.keys(analytics.typeBreakdown).length > 0 && (
        <GlassCard className="p-6">
          <Typography.H4 className="mb-4">알림 유형별 분석</Typography.H4>
          <div className="space-y-3">
            {Object.entries(analytics.typeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage =
                  analytics.totalSent > 0
                    ? ((count / analytics.totalSent) * 100).toFixed(1)
                    : '0';

                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <Typography.Body className="font-medium">
                        {getTypeLabel(type)}
                      </Typography.Body>
                    </div>
                    <div className="flex items-center gap-4">
                      <Typography.Small className="text-gray-600">
                        {count.toLocaleString()}개 ({percentage}%)
                      </Typography.Small>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(parseFloat(percentage), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      )}

      {/* 오류 분석 */}
      {Object.keys(analytics.errorBreakdown).length > 0 && (
        <GlassCard className="p-6">
          <Typography.H4 className="mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            오류 분석
          </Typography.H4>
          <div className="space-y-3">
            {Object.entries(analytics.errorBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([errorCode, count]) => {
                const percentage =
                  analytics.totalFailed > 0
                    ? ((count / analytics.totalFailed) * 100).toFixed(1)
                    : '0';

                return (
                  <div
                    key={errorCode}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <Typography.Body className="font-medium text-red-700">
                        {errorCode}
                      </Typography.Body>
                    </div>
                    <div className="flex items-center gap-4">
                      <Typography.Small className="text-gray-600">
                        {count.toLocaleString()}개 ({percentage}%)
                      </Typography.Small>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(parseFloat(percentage), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

NotificationAnalyticsDashboard.displayName = 'NotificationAnalyticsDashboard';
