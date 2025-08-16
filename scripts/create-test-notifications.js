const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} = require('firebase/firestore');

// Firebase 설정 (실제 프로젝트 설정으로 교체 필요)
const firebaseConfig = {
  // 여기에 실제 Firebase 설정을 넣으세요
  apiKey: 'your-api-key',
  authDomain: 'your-auth-domain',
  projectId: 'your-project-id',
  storageBucket: 'your-storage-bucket',
  messagingSenderId: 'your-messaging-sender-id',
  appId: 'your-app-id',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 테스트 알림 데이터
const testNotifications = [
  {
    userId: 'test-user-id', // 실제 사용자 ID로 교체
    title: '새로운 할일이 할당되었습니다',
    message: '가족 구성원이 당신에게 "청소하기" 할일을 할당했습니다.',
    type: 'task',
    status: 'unread',
    priority: 'medium',
    createdAt: Timestamp.now(),
    data: {
      taskId: 'task-1',
      actionUrl: '/tasks/task-1',
    },
  },
  {
    userId: 'test-user-id',
    title: '할일 마감일이 다가옵니다',
    message: '내일까지 완료해야 할 "보고서 작성" 할일이 있습니다.',
    type: 'reminder',
    status: 'unread',
    priority: 'high',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2시간 전
    data: {
      taskId: 'task-2',
      actionUrl: '/tasks/task-2',
    },
  },
  {
    userId: 'test-user-id',
    title: '새로운 가족 구성원이 추가되었습니다',
    message: '김철수님이 가족 그룹에 참여했습니다.',
    type: 'group',
    status: 'read',
    priority: 'low',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 1일 전
    readAt: Timestamp.fromDate(new Date(Date.now() - 23 * 60 * 60 * 1000)),
    data: {
      groupId: 'family-group-1',
    },
  },
  {
    userId: 'test-user-id',
    title: '포인트 획득!',
    message: '할일을 완료하여 50포인트를 획득했습니다.',
    type: 'system',
    status: 'unread',
    priority: 'medium',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)), // 3시간 전
    data: {
      actionUrl: '/points',
    },
  },
  {
    userId: 'test-user-id',
    title: '주간 통계 리포트',
    message: '이번 주에 총 15개의 할일을 완료했습니다. 훌륭합니다!',
    type: 'system',
    status: 'read',
    priority: 'low',
    createdAt: Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ), // 1주일 전
    readAt: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    data: {
      actionUrl: '/statistics',
    },
  },
];

async function createTestNotifications() {
  try {
    console.log('테스트 알림 데이터를 생성하는 중...');

    for (const notification of testNotifications) {
      await addDoc(collection(db, 'notifications'), notification);
      console.log(`알림 생성 완료: ${notification.title}`);
    }

    console.log('모든 테스트 알림이 성공적으로 생성되었습니다!');
  } catch (error) {
    console.error('테스트 알림 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  createTestNotifications();
}

module.exports = { createTestNotifications };
