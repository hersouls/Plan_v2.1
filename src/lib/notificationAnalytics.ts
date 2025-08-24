import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import logger from './logger';

export interface NotificationMetrics {
  id?: string;
  userId: string;
  notificationId: string;
  type:
    | 'task_reminder'
    | 'task_assigned'
    | 'task_completed'
    | 'mention'
    | 'new_comment'
    | 'system';
  status: 'sent' | 'delivered' | 'clicked' | 'failed';
  timestamp: Timestamp;
  responseTime?: number; // 밀리초
  errorCode?: string;
  errorMessage?: string;
  fcmToken?: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number; // 전송 성공률
  clickRate: number; // 클릭률
  averageResponseTime: number; // 평균 응답 시간
  errorBreakdown: Record<string, number>; // 오류 유형별 분석
  typeBreakdown: Record<string, number>; // 알림 유형별 분석
}

export class NotificationAnalyticsService {
  private static readonly METRICS_COLLECTION = 'notificationMetrics';

  /**
   * 알림 메트릭 기록
   */
  static async recordMetric(
    metric: Omit<NotificationMetrics, 'id'>
  ): Promise<void> {
    try {
      await addDoc(collection(db, this.METRICS_COLLECTION), {
        ...metric,
        timestamp: metric.timestamp || Timestamp.now(),
      });
      logger.info('notificationAnalytics', 'metric recorded', {
        type: metric.type,
        status: metric.status,
      });
    } catch (error) {
      logger.error('notificationAnalytics', 'failed to record metric', error);
    }
  }

  /**
   * 알림 전송 메트릭 기록
   */
  static async recordSent(
    userId: string,
    notificationId: string,
    type: NotificationMetrics['type'],
    fcmToken?: string
  ): Promise<void> {
    await this.recordMetric({
      userId,
      notificationId,
      type,
      status: 'sent',
      timestamp: Timestamp.now(),
      fcmToken,
      deviceInfo: {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * 알림 전송 성공 메트릭 기록
   */
  static async recordDelivered(
    userId: string,
    notificationId: string,
    type: NotificationMetrics['type'],
    responseTime?: number
  ): Promise<void> {
    await this.recordMetric({
      userId,
      notificationId,
      type,
      status: 'delivered',
      timestamp: Timestamp.now(),
      responseTime,
    });
  }

  /**
   * 알림 클릭 메트릭 기록
   */
  static async recordClicked(
    userId: string,
    notificationId: string,
    type: NotificationMetrics['type']
  ): Promise<void> {
    await this.recordMetric({
      userId,
      notificationId,
      type,
      status: 'clicked',
      timestamp: Timestamp.now(),
    });
  }

  /**
   * 알림 전송 실패 메트릭 기록
   */
  static async recordFailed(
    userId: string,
    notificationId: string,
    type: NotificationMetrics['type'],
    errorCode: string,
    errorMessage: string,
    fcmToken?: string
  ): Promise<void> {
    await this.recordMetric({
      userId,
      notificationId,
      type,
      status: 'failed',
      timestamp: Timestamp.now(),
      errorCode,
      errorMessage,
      fcmToken,
    });
  }

  /**
   * 사용자별 알림 분석 데이터 조회
   */
  static async getUserAnalytics(
    userId: string,
    days: number = 30
  ): Promise<NotificationAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, this.METRICS_COLLECTION),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationMetrics[];

      return this.calculateAnalytics(metrics);
    } catch (error) {
      logger.error(
        'notificationAnalytics',
        'failed to get user analytics',
        error
      );
      return this.getEmptyAnalytics();
    }
  }

  /**
   * 전체 시스템 알림 분석 데이터 조회
   */
  static async getSystemAnalytics(
    days: number = 30
  ): Promise<NotificationAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, this.METRICS_COLLECTION),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(5000)
      );

      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationMetrics[];

      return this.calculateAnalytics(metrics);
    } catch (error) {
      logger.error(
        'notificationAnalytics',
        'failed to get system analytics',
        error
      );
      return this.getEmptyAnalytics();
    }
  }

  /**
   * 메트릭 데이터를 분석하여 통계 계산
   */
  private static calculateAnalytics(
    metrics: NotificationMetrics[]
  ): NotificationAnalytics {
    const totalSent = metrics.filter(m => m.status === 'sent').length;
    const totalDelivered = metrics.filter(m => m.status === 'delivered').length;
    const totalClicked = metrics.filter(m => m.status === 'clicked').length;
    const totalFailed = metrics.filter(m => m.status === 'failed').length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const clickRate =
      totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

    // 평균 응답 시간 계산
    const responseTimes = metrics
      .filter(m => m.responseTime && m.responseTime > 0)
      .map(m => m.responseTime!);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // 오류 유형별 분석
    const errorBreakdown: Record<string, number> = {};
    metrics
      .filter(m => m.status === 'failed' && m.errorCode)
      .forEach(m => {
        const errorCode = m.errorCode!;
        errorBreakdown[errorCode] = (errorBreakdown[errorCode] || 0) + 1;
      });

    // 알림 유형별 분석
    const typeBreakdown: Record<string, number> = {};
    metrics.forEach(m => {
      typeBreakdown[m.type] = (typeBreakdown[m.type] || 0) + 1;
    });

    return {
      totalSent,
      totalDelivered,
      totalClicked,
      totalFailed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      errorBreakdown,
      typeBreakdown,
    };
  }

  /**
   * 빈 분석 데이터 반환
   */
  private static getEmptyAnalytics(): NotificationAnalytics {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalClicked: 0,
      totalFailed: 0,
      deliveryRate: 0,
      clickRate: 0,
      averageResponseTime: 0,
      errorBreakdown: {},
      typeBreakdown: {},
    };
  }

  /**
   * 성능 임계값 확인
   */
  static async checkPerformanceThresholds(
    analytics: NotificationAnalytics
  ): Promise<{
    warnings: string[];
    criticalIssues: string[];
  }> {
    const warnings: string[] = [];
    const criticalIssues: string[] = [];

    // 전송 성공률 확인
    if (analytics.deliveryRate < 95) {
      if (analytics.deliveryRate < 85) {
        criticalIssues.push(
          `알림 전송 성공률이 매우 낮습니다: ${analytics.deliveryRate}%`
        );
      } else {
        warnings.push(
          `알림 전송 성공률이 낮습니다: ${analytics.deliveryRate}%`
        );
      }
    }

    // 클릭률 확인
    if (analytics.clickRate < 5) {
      if (analytics.clickRate < 2) {
        criticalIssues.push(
          `알림 클릭률이 매우 낮습니다: ${analytics.clickRate}%`
        );
      } else {
        warnings.push(`알림 클릭률이 낮습니다: ${analytics.clickRate}%`);
      }
    }

    // 응답 시간 확인
    if (analytics.averageResponseTime > 5000) {
      if (analytics.averageResponseTime > 10000) {
        criticalIssues.push(
          `알림 응답 시간이 매우 깁니다: ${analytics.averageResponseTime}ms`
        );
      } else {
        warnings.push(
          `알림 응답 시간이 깁니다: ${analytics.averageResponseTime}ms`
        );
      }
    }

    // 실패율 확인
    const totalAttempts = analytics.totalSent + analytics.totalFailed;
    const failureRate =
      totalAttempts > 0 ? (analytics.totalFailed / totalAttempts) * 100 : 0;

    if (failureRate > 10) {
      if (failureRate > 20) {
        criticalIssues.push(
          `알림 실패율이 매우 높습니다: ${failureRate.toFixed(1)}%`
        );
      } else {
        warnings.push(`알림 실패율이 높습니다: ${failureRate.toFixed(1)}%`);
      }
    }

    return { warnings, criticalIssues };
  }
}
