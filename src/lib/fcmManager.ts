import { getAuth } from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  doc,
  getFirestore,
  updateDoc,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
// Ensure Firebase app is initialized via side-effect import
import './firebase';
import { NotificationAnalyticsService } from './notificationAnalytics';

const messaging = getMessaging();
const db = getFirestore();
const auth = getAuth();

// FCM 토큰 관리 클래스
class FCMManager {
  private currentToken: string | null = null;
  private isInitialized = false;

  /**
   * FCM 초기화 및 토큰 요청
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 브라우저가 FCM을 지원하는지 확인
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('FCM is not supported in this browser');
        return;
      }

      // VAPID 키 확인
      if (!import.meta.env.VITE_FCM_VAPID_KEY) {
        console.warn('VAPID key not configured, skipping FCM initialization');
        return;
      }

      // 서비스 워커 등록 확인
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      );
      console.log('Service Worker registered:', registration);

      // FCM 토큰 요청
      await this.requestToken();

      // 포그라운드 메시지 리스너 설정
      this.setupMessageListener();

      this.isInitialized = true;
      console.log('FCM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
    }
  }

  /**
   * FCM 토큰 요청
   */
  private async requestToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated, cannot request FCM token');
        return null;
      }

      // VAPID 키 확인
      if (!import.meta.env.VITE_FCM_VAPID_KEY) {
        console.warn('VAPID key not configured, cannot request FCM token');
        return null;
      }

      // FCM 토큰 요청
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
        serviceWorkerRegistration:
          await navigator.serviceWorker.getRegistration(
            '/firebase-messaging-sw.js'
          ),
      });

      if (token) {
        this.currentToken = token;
        await this.saveTokenToServer(token);
        console.log('FCM token obtained:', token);
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error requesting FCM token:', error);
      return null;
    }
  }

  /**
   * 토큰을 서버에 저장
   */
  private async saveTokenToServer(token: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated, cannot save FCM token');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        updatedAt: new Date(),
      });

      console.log('FCM token saved to server');
    } catch (error) {
      console.error('Error saving FCM token to server:', error);
    }
  }

  /**
   * 토큰을 서버에서 제거
   */
  async removeTokenFromServer(token: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('User not authenticated, cannot remove FCM token');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token),
        updatedAt: new Date(),
      });

      console.log('FCM token removed from server');
    } catch (error) {
      console.error('Error removing FCM token from server:', error);
    }
  }

  /**
   * 포그라운드 메시지 리스너 설정
   */
  private setupMessageListener(): void {
    onMessage(messaging, payload => {
      console.log('Foreground message received:', payload);

      // 알림 수신 메트릭 기록
      this.recordNotificationReceived(payload);

      // 브라우저 알림 표시
      this.showNotification(payload);
    });
  }

  /**
   * 알림 수신 메트릭 기록
   */
  private async recordNotificationReceived(payload: any): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !payload.data) return;

      const notificationId = payload.data.notificationId || 'unknown';
      const type = payload.data.type || 'system';

      await NotificationAnalyticsService.recordDelivered(
        currentUser.uid,
        notificationId,
        type as any
      );
    } catch (error) {
      console.error('Failed to record notification received metric:', error);
    }
  }

  /**
   * 알림 클릭 메트릭 기록
   */
  private async recordNotificationClicked(payload: any): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !payload.data) return;

      const notificationId = payload.data.notificationId || 'unknown';
      const type = payload.data.type || 'system';

      await NotificationAnalyticsService.recordClicked(
        currentUser.uid,
        notificationId,
        type as any
      );
    } catch (error) {
      console.error('Failed to record notification clicked metric:', error);
    }
  }

  /**
   * 브라우저 알림 표시
   */
  private showNotification(payload: any): void {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(
        payload.notification?.title || '새 알림',
        {
          body: payload.notification?.body || '',
          icon: '/moonwave-icon.svg',
          badge: '/moonwave-icon.svg',
          tag: payload.data?.taskId || 'general',
          data: payload.data,
        }
      );

      // 알림 클릭 시 처리
      notification.onclick = () => {
        window.focus();
        notification.close();

        // 알림 클릭 메트릭 기록
        this.recordNotificationClicked(payload);

        // 알림 데이터에 따라 페이지 이동
        if (payload.data?.taskId) {
          window.location.href = `/tasks/${payload.data.taskId}`;
        } else if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      // 5초 후 자동으로 알림 닫기
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  /**
   * 알림 권한 요청
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.warn('Notification permission denied');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * 현재 토큰 반환
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * FCM 초기화 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * FCM 정리
   */
  async cleanup(): Promise<void> {
    if (this.currentToken) {
      await this.removeTokenFromServer(this.currentToken);
      this.currentToken = null;
    }
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스 생성
export const fcmManager = new FCMManager();

// 앱 시작 시 FCM 초기화
export const initializeFCM = async (): Promise<void> => {
  await fcmManager.initialize();
};

// 사용자 로그인 시 FCM 토큰 갱신
export const refreshFCMToken = async (): Promise<void> => {
  if (fcmManager.isReady()) {
    await fcmManager.initialize();
  }
};

// 사용자 로그아웃 시 FCM 정리
export const cleanupFCM = async (): Promise<void> => {
  await fcmManager.cleanup();
};
