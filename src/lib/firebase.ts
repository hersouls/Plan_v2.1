// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Analytics, Performance, and Messaging will be loaded dynamically to reduce bundle size

// 환경 변수에서 Firebase 설정 가져오기
const getFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // 잘못된 플레이스홀더 값들 검증 및 수정
  const invalidValues = [
    "your-api-key", "your-auth-domain", "your-project-id", 
    "your-storage-bucket", "your-messaging-sender-id", 
    "your-app-id", "your-measurement-id"
  ];

  // 환경 변수가 설정되지 않았거나 잘못된 값인 경우 기본값 사용
  if (!config.apiKey || invalidValues.includes(config.apiKey)) {
    config.apiKey = "AIzaSyDw5QKUOCHBewF8tS2poDyZL9jRUtOveMw";
  }
  if (!config.authDomain || invalidValues.includes(config.authDomain)) {
    config.authDomain = "plan-e7bc6.firebaseapp.com";
  }
  if (!config.projectId || invalidValues.includes(config.projectId)) {
    config.projectId = "plan-e7bc6";
  }
  if (!config.storageBucket || invalidValues.includes(config.storageBucket)) {
    config.storageBucket = "plan-e7bc6.firebasestorage.app";
  }
  if (!config.messagingSenderId || invalidValues.includes(config.messagingSenderId)) {
    config.messagingSenderId = "507060914612";
  }
  if (!config.appId || invalidValues.includes(config.appId)) {
    config.appId = "1:507060914612:web:45ee29e84cf59df82b4ae1";
  }
  if (!config.measurementId || invalidValues.includes(config.measurementId)) {
    config.measurementId = "G-8EM7E3RPR6";
  }

  return config;
};

// Your web app's Firebase configuration
const firebaseConfig = getFirebaseConfig();

// 디버깅: 환경 변수 확인
if (import.meta.env.DEV) {
  console.log('🔍 Firebase 설정 확인:', {
    apiKey: firebaseConfig.apiKey ? '설정됨' : '미설정',
    projectId: firebaseConfig.projectId ? '설정됨' : '미설정',
    appId: firebaseConfig.appId ? '설정됨' : '미설정',
    authDomain: firebaseConfig.authDomain ? '설정됨' : '미설정'
  });
}

// 설정 유효성 검사
const isValidConfig = (config: any) => {
  return config && 
         config.apiKey && 
         config.projectId && 
         config.appId &&
         config.apiKey !== "your-api-key" &&
         config.projectId !== "your-project-id" &&
         config.appId !== "your-app-id" &&
         config.apiKey !== undefined &&
         config.projectId !== undefined &&
         config.appId !== undefined;
};

// Initialize Firebase
let app;
try {
  if (!isValidConfig(firebaseConfig)) {
    console.error('❌ Firebase 설정이 유효하지 않습니다:', firebaseConfig);
    throw new Error('Invalid Firebase configuration - 환경 변수를 확인해주세요');
  }
  app = initializeApp(firebaseConfig);
  if (import.meta.env.DEV) {
    console.log('🔥 Firebase 앱 초기화 성공');
  }
} catch (error) {
  console.error('❌ Firebase 앱 초기화 실패:', error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth 객체가 제대로 초기화되었는지 확인하는 함수
export const isAuthInitialized = () => {
  return auth !== null && auth !== undefined;
};

// Analytics, Performance, Messaging 초기화 (브라우저 환경에서만) - Dynamic Loading
export let analytics: any | null = null;
export let performance: any | null = null;
export let messaging: any | null = null;

// Analytics 활성화 체크
const shouldEnableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && 
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
        console.log('📊 Firebase Analytics 동적 로딩됨');
      }
      return analytics;
    }
  } catch (error) {
    console.warn('📊 Analytics 동적 로딩 실패:', error);
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
        console.log('⚡ Firebase Performance 동적 로딩됨');
      }
      return performance;
    }
  } catch (error) {
    console.warn('⚠️ Performance monitoring 동적 로딩 실패:', error);
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
        console.log('💬 Firebase Messaging 동적 로딩됨');
      }
      return messaging;
    }
  } catch (error) {
    console.warn('💬 Messaging 동적 로딩 실패:', error);
  }
  return null;
};

if (import.meta.env.DEV) {
  console.log('🔧 Firebase 서비스들이 필요시에만 동적 로딩됩니다');
}

export default app;