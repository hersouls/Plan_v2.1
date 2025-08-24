// Import the functions you need from the SDKs you need
import { initializeApp, setLogLevel, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import {
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
// Analytics, Performance, and Messaging will be loaded dynamically to reduce bundle size
import logger from './logger';

// 환경 변수에서 Firebase 설정 가져오기
const getFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // 잘못된 플레이스홀더 값들 검증 및 수정
  const invalidValues = [
    'your-api-key',
    'your-auth-domain',
    'your-project-id',
    'your-storage-bucket',
    'your-messaging-sender-id',
    'your-app-id',
    'your-measurement-id',
  ];

  // 환경 변수가 설정되지 않았거나 잘못된 값인 경우 기본값 사용
  if (!config.apiKey || invalidValues.includes(config.apiKey)) {
    config.apiKey = 'AIzaSyDw5QKUOCHBewF8tS2poDyZL9jRUtOveMw';
  }
  if (!config.authDomain || invalidValues.includes(config.authDomain)) {
    config.authDomain = 'plan-e7bc6.firebaseapp.com';
  }
  if (!config.projectId || invalidValues.includes(config.projectId)) {
    config.projectId = 'plan-e7bc6';
  }
  if (!config.storageBucket || invalidValues.includes(config.storageBucket)) {
    // Firebase Storage 버킷 기본값은 프로젝트 기본 버킷인 {projectId}.appspot.com 을 사용해야 합니다
    // 잘못된 도메인(…firebasestorage.app)을 사용하면 다운로드 URL이 403을 반환할 수 있습니다
    config.storageBucket = 'plan-e7bc6.appspot.com';
  }
  if (
    !config.messagingSenderId ||
    invalidValues.includes(config.messagingSenderId)
  ) {
    config.messagingSenderId = '507060914612';
  }
  if (!config.appId || invalidValues.includes(config.appId)) {
    config.appId = '1:507060914612:web:45ee29e84cf59df82b4ae1';
  }
  if (!config.measurementId || invalidValues.includes(config.measurementId)) {
    config.measurementId = 'G-8EM7E3RPR6';
  }

  return config;
};

// Your web app's Firebase configuration
const firebaseConfig = getFirebaseConfig();

// 디버깅: 환경 변수 확인
if (import.meta.env.DEV) {
  logger.debug('firebase', 'config check', {
    apiKey: firebaseConfig.apiKey ? '설정됨' : '미설정',
    projectId: firebaseConfig.projectId ? '설정됨' : '미설정',
    appId: firebaseConfig.appId ? '설정됨' : '미설정',
    authDomain: firebaseConfig.authDomain ? '설정됨' : '미설정',
  });
}

// 설정 유효성 검사
type FirebaseRuntimeConfig = {
  apiKey?: string;
  projectId?: string;
  appId?: string;
};

const isValidConfig = (config: FirebaseRuntimeConfig) => {
  return (
    config &&
    config.apiKey &&
    config.projectId &&
    config.appId &&
    config.apiKey !== 'your-api-key' &&
    config.projectId !== 'your-project-id' &&
    config.appId !== 'your-app-id'
  );
};

// Initialize Firebase
let app: FirebaseApp;
try {
  if (!isValidConfig(firebaseConfig)) {
    logger.error('firebase', 'invalid config', firebaseConfig);
    throw new Error(
      'Invalid Firebase configuration - 환경 변수를 확인해주세요'
    );
  }
  app = initializeApp(firebaseConfig);
  if (import.meta.env.DEV) {
    // 개발 환경 로그를 info로 제한하여 콘솔 스팸 방지
    try {
      setLogLevel('info');
    } catch {
      /* noop */
    }
    logger.info('firebase', 'initialized');
  }
} catch (error) {
  logger.error('firebase', 'initialize failed', error);
  throw error;
}

// Initialize Firebase services with error handling and settings
export const auth = getAuth(app);

// Initialize Firestore with enhanced settings for stability
let db: Firestore;
// Firestore 전송 방식(스트리밍/롱폴링) 환경변수 기반 토글
const fsTransport = {
  autoDetectLongPolling:
    import.meta.env.VITE_FIRESTORE_AUTO_LONG_POLLING !== 'false', // 기본 true
  forceLongPolling:
    import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING === 'true', // 기본 false
  useFetchStreams: import.meta.env.VITE_FIRESTORE_USE_FETCH_STREAMS !== 'false', // 기본 true
};
try {
  // 스트리밍 사용 시 롱폴링 자동감지를 비활성화하여 채널 종료(terminate) 호출을 회피
  const useStreams = fsTransport.useFetchStreams;
  const forceLongPolling = fsTransport.forceLongPolling;
  const autoDetectLongPolling =
    !useStreams && !forceLongPolling && fsTransport.autoDetectLongPolling;

  db = initializeFirestore(app, {
    cache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalAutoDetectLongPolling: autoDetectLongPolling,
    experimentalForceLongPolling: forceLongPolling,
    useFetchStreams: useStreams as unknown as any,
    ignoreUndefinedProperties: true,
  });

  if (import.meta.env.DEV) {
    logger.info('firebase', 'firestore transport', fsTransport);
  }

  // 네트워크 상태 모니터링
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      logger.info('firebase', 'Network online - enabling Firestore');
      enableFirestoreNetwork();
    });

    window.addEventListener('offline', () => {
      logger.info('firebase', 'Network offline - Firestore will use cache');
    });

    // 탭/페이지 종료 시 선제적으로 Firestore 네트워크를 비활성화하여
    // SDK가 채널 terminate 요청을 보내며 발생하는 400 오류를 방지
    window.addEventListener('beforeunload', () => {
      try {
        void disableNetwork(db);
      } catch {
        /* noop */
      }
    });

    // iOS Safari 등에서 보다 안정적인 종료 감지를 위해 pagehide도 처리
    window.addEventListener('pagehide', () => {
      try {
        void disableNetwork(db);
      } catch {
        /* noop */
      }
    });
  }
} catch (error) {
  // Fallback to default Firestore if persistence fails
  logger.warn(
    'firebase',
    'Failed to initialize with persistence, using default',
    error
  );
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);

// Firestore 설정 개선 (연결 안정성 향상)

// Firestore 네트워크 연결 관리
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    logger.info('firebase', 'Firestore network enabled');
  } catch (error) {
    logger.error('firebase', 'Failed to enable Firestore network', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    logger.info('firebase', 'Firestore network disabled');
  } catch (error) {
    logger.error('firebase', 'Failed to disable Firestore network', error);
  }
};

// Firestore 작업을 위한 안전한 래퍼 함수들
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'unknown'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // 권한 오류나 네트워크 오류 시 조용히 처리
    if (
      error?.code === 'permission-denied' ||
      error?.code === 'unauthenticated' ||
      error?.message?.includes('permission') ||
      error?.message?.includes('400')
    ) {
      logger.debug(
        'firebase',
        `${operationName} failed due to permissions, using fallback`,
        error
      );
      return fallbackValue;
    }

    // 다른 오류는 로그만 남기고 fallback 사용
    logger.warn('firebase', `${operationName} failed, using fallback`, error);
    return fallbackValue;
  }
}

// Persistence is now handled in the initialization above with the new API

// Firebase 연결 상태 확인 및 재시도 로직
let connectionRetryCount = 0;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 2000; // 2초

export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Auth 상태 확인으로 대체 (권한 문제 없음)
    if (!auth) {
      logger.warn('firebase', 'Auth not initialized');
      return false;
    }

    // 현재 인증 상태만 확인 (Firestore 쿼리 없이)
    const currentUser = auth.currentUser;
    logger.debug('firebase', 'Auth check completed', {
      hasUser: !!currentUser,
    });

    connectionRetryCount = 0; // 성공 시 재시도 카운트 리셋
    return true;
  } catch (error) {
    connectionRetryCount++;
    logger.warn(
      'firebase',
      `Connection check failed (attempt ${connectionRetryCount}/${MAX_RETRY_COUNT})`,
      error
    );

    if (connectionRetryCount < MAX_RETRY_COUNT) {
      // 재시도
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return checkFirebaseConnection();
    } else {
      logger.error('firebase', 'Max retry count reached, connection failed');
      connectionRetryCount = 0; // 카운터 리셋
      return false;
    }
  }
};

// Connect to Firebase Emulators in test/dev when enabled via env
try {
  const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
  if (useEmulator) {
    const authEmulatorUrl =
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL ||
      'http://localhost:9099';
    const firestoreHostPort = (
      import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    ).split(':');
    const storageHostPort = (
      import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199'
    ).split(':');

    const fsHost = firestoreHostPort[0] || 'localhost';
    const fsPort = parseInt(firestoreHostPort[1] || '8080', 10);
    const stHost = storageHostPort[0] || 'localhost';
    const stPort = parseInt(storageHostPort[1] || '9199', 10);

    // Suppress emulator origin warnings in tests
    connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, fsHost, fsPort);
    connectStorageEmulator(storage, stHost, stPort);

    if (import.meta.env.DEV) {
      logger.info('firebase', 'emulators connected', {
        authEmulatorUrl,
        fsHost,
        fsPort,
        stHost,
        stPort,
      });
    }
  }
} catch (e) {
  logger.warn('firebase', 'connect emulators failed', e);
}

// Auth 객체가 제대로 초기화되었는지 확인하는 함수
export const isAuthInitialized = () => {
  return auth !== null && auth !== undefined;
};

// Analytics, Performance, Messaging 초기화 (브라우저 환경에서만) - Dynamic Loading
export let analytics: unknown | null = null;
export let performance: unknown | null = null;
export let messaging: unknown | null = null;

// Analytics 활성화 체크
const shouldEnableAnalytics =
  import.meta.env.VITE_ENABLE_ANALYTICS === 'true' &&
  !import.meta.env.DEV &&
  firebaseConfig.measurementId &&
  !firebaseConfig.measurementId.includes('your-');

// Dynamic loading functions for optional Firebase services
export const loadAnalytics = async () => {
  if (analytics) return analytics;

  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();

    if (supported && firebaseConfig.measurementId && shouldEnableAnalytics) {
      analytics = getAnalytics(app);
      if (import.meta.env.DEV) {
        logger.info('firebase', 'analytics loaded');
      }
      return analytics;
    }
  } catch (error) {
    logger.warn('firebase', 'analytics load failed', error);
  }
  return null;
};

export const loadPerformance = async () => {
  if (performance) return performance;

  try {
    const { getPerformance } = await import('firebase/performance');

    if (shouldEnableAnalytics) {
      performance = getPerformance(app);
      if (import.meta.env.DEV) {
        logger.info('firebase', 'performance loaded');
      }
      return performance;
    }
  } catch (error) {
    logger.warn('firebase', 'performance load failed', error);
  }
  return null;
};

export const loadMessaging = async () => {
  if (messaging) return messaging;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();

    if (supported) {
      messaging = getMessaging(app);
      if (import.meta.env.DEV) {
        logger.info('firebase', 'messaging loaded');
      }
      return messaging;
    }
  } catch (error) {
    logger.warn('firebase', 'messaging load failed', error);
  }
  return null;
};

if (import.meta.env.DEV) {
  logger.debug('firebase', 'services will be lazily loaded');
}

// Provide both default and named exports for compatibility across modules
export { app };
export default app;
