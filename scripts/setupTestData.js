import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

// Firebase configuration - 실제 프로젝트 설정
const firebaseConfig = {
  apiKey:
    process.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDw5QKUOCHBewF8tS2poDyZL9jRUtOveMw',
  authDomain:
    process.env.VITE_FIREBASE_AUTH_DOMAIN || 'plan-e7bc6.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'plan-e7bc6',
  storageBucket:
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'plan-e7bc6.firebasestorage.app',
  messagingSenderId:
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '507060914612',
  appId:
    process.env.VITE_FIREBASE_APP_ID ||
    '1:507060914612:web:45ee29e84cf59df82b4ae1',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-8EM7E3RPR6',
};

// Check if we're using real Firebase or demo mode
const isDemoMode =
  !process.env.VITE_FIREBASE_API_KEY ||
  firebaseConfig.apiKey === 'demo-api-key';
if (isDemoMode) {
  console.warn(
    '⚠️ Running in demo mode. Set VITE_FIREBASE_* environment variables for real Firebase.'
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Prefer emulators in test mode
try {
  const useEmu =
    process.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
    process.env.NODE_ENV === 'test';
  if (useEmu) {
    const authUrl =
      process.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099';
    const [fsHost, fsPortStr] = (
      process.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    ).split(':');
    const fsPort = parseInt(fsPortStr || '8080', 10);
    connectAuthEmulator(auth, authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, fsHost, fsPort);
    console.log(
      `✅ Using Firebase Emulators for setup (auth: ${authUrl}, firestore: ${fsHost}:${fsPort})`
    );
  }
} catch (e) {
  console.warn(
    '⚠️ Failed to connect to emulators during setupTestData, continuing:',
    e
  );
}

// Test user accounts data
const testUsers = [
  {
    email: 'dad@moonwave.test',
    password: 'test123456',
    profile: {
      displayName: '김아빠',
      role: 'parent',
      avatar: null,
      familyGroupId: 'family-kim-2024',
    },
  },
  {
    email: 'mom@moonwave.test',
    password: 'test123456',
    profile: {
      displayName: '박엄마',
      role: 'parent',
      avatar: null,
      familyGroupId: 'family-kim-2024',
    },
  },
  {
    email: 'suhyun@moonwave.test',
    password: 'test123456',
    profile: {
      displayName: '김수현',
      role: 'child',
      avatar: null,
      familyGroupId: 'family-kim-2024',
    },
  },
  {
    email: 'dohyun@moonwave.test',
    password: 'test123456',
    profile: {
      displayName: '김도현',
      role: 'child',
      avatar: null,
      familyGroupId: 'family-kim-2024',
    },
  },
];

// Family group data
const familyGroup = {
  id: 'family-kim-2024',
  name: 'Kim 가족',
  ownerId: '', // Will be set after creating users
  createdAt: new Date(),
  inviteCode: 'MOON2024',
  settings: {
    allowChildrenToInvite: false,
    requireApproval: true,
    maxMembers: 10,
  },
  memberIds: [], // Will be populated with user IDs
};

// Sample tasks data
const sampleTasks = [
  {
    title: '식료품 장보기',
    description: '우유, 빵, 달걀, 과일 사기',
    category: 'shopping',
    priority: 'medium',
    status: 'pending',
    tags: ['장보기', '식료품'],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    estimatedMinutes: 60,
    location: '이마트',
    reminders: [{ id: '1', time: '1시간 전', method: 'push' }],
  },
  {
    title: '방 청소하기',
    description: '침실 정리정돈 및 청소기 돌리기',
    category: 'household',
    priority: 'high',
    status: 'in_progress',
    tags: ['청소', '정리'],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    estimatedMinutes: 90,
    reminders: [],
  },
  {
    title: '수학 숙제 완료',
    description: '교과서 45-48페이지 문제 풀기',
    category: 'work',
    priority: 'high',
    status: 'pending',
    tags: ['숙제', '수학'],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    estimatedMinutes: 120,
    reminders: [{ id: '2', time: '30분 전', method: 'push' }],
  },
  {
    title: '운동하기',
    description: '30분 이상 조깅 또는 홈트레이닝',
    category: 'personal',
    priority: 'medium',
    status: 'completed',
    tags: ['운동', '건강'],
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedMinutes: 30,
    reminders: [],
  },
  {
    title: '책 읽기',
    description: '소설 100페이지 이상 읽기',
    category: 'personal',
    priority: 'low',
    status: 'pending',
    tags: ['독서', '취미'],
    recurring: {
      enabled: true,
      frequency: 'daily',
      interval: 1,
      endDate: null,
    },
    estimatedMinutes: 60,
    reminders: [],
  },
  {
    title: '설거지하기',
    description: '식후 설거지 및 정리',
    category: 'household',
    priority: 'medium',
    status: 'completed',
    tags: ['설거지', '집안일'],
    dueDate: new Date(),
    completedAt: new Date(),
    recurring: {
      enabled: true,
      frequency: 'daily',
      interval: 1,
      endDate: null,
    },
    estimatedMinutes: 15,
    reminders: [],
  },
  {
    title: '친구 만나기',
    description: '카페에서 친구들과 모임',
    category: 'personal',
    priority: 'low',
    status: 'pending',
    tags: ['친구', '모임'],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    location: '스타벅스 강남점',
    estimatedMinutes: 180,
    reminders: [{ id: '3', time: '1일 전', method: 'push' }],
  },
  {
    title: '프로젝트 완료',
    description: '회사 프로젝트 최종 검토 및 제출',
    category: 'work',
    priority: 'high',
    status: 'pending',
    tags: ['업무', '프로젝트', '마감'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    estimatedMinutes: 240,
    reminders: [
      { id: '4', time: '2일 전', method: 'push' },
      { id: '5', time: '1일 전', method: 'push' },
    ],
  },
];

// Sample comments data
const sampleComments = [
  {
    content: '장보기 리스트에 바나나도 추가해주세요!',
    reactions: { '👍': ['user2'], '❤️': ['user3'] },
  },
  {
    content: '청소할 때 침대 밑도 꼭 확인해주세요.',
    reactions: { '✅': ['user1'] },
  },
  {
    content: '수학 문제 어려우면 도움 요청하세요.',
    reactions: { '🤝': ['user1', 'user2'] },
  },
];

// Activity log data
const sampleActivities = [
  {
    action: 'created',
    details: { taskTitle: '식료품 장보기' },
  },
  {
    action: 'status_changed',
    details: { from: 'pending', to: 'in_progress', taskTitle: '방 청소하기' },
  },
  {
    action: 'completed',
    details: { taskTitle: '운동하기', completionTime: '30분' },
  },
  {
    action: 'commented',
    details: { commentContent: '장보기 리스트에 바나나도...' },
  },
];

async function createTestUsers() {
  console.log('🔄 Creating test user accounts...');
  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;
      console.log(
        `✅ Created user: ${userData.profile.displayName} (${userData.email})`
      );

      // Create user profile document
      await setDoc(doc(db, 'users', user.uid), {
        ...userData.profile,
        email: userData.email,
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          notifications: {
            push: true,
            taskReminders: true,
            familyActivity: true,
          },
          theme: 'light',
          language: 'ko',
        },
        stats: {
          totalTasks: Math.floor(Math.random() * 50) + 10,
          completedTasks: Math.floor(Math.random() * 40) + 5,
          streak: Math.floor(Math.random() * 15) + 1,
        },
      });

      createdUsers.push({
        uid: user.uid,
        email: userData.email,
        profile: userData.profile,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User ${userData.email} already exists, signing in...`);
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
          );
          createdUsers.push({
            uid: userCredential.user.uid,
            email: userData.email,
            profile: userData.profile,
          });
        } catch (signInError) {
          console.error(
            `❌ Error signing in user ${userData.email}:`,
            signInError
          );
        }
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error);
      }
    }
  }

  return createdUsers;
}

async function createFamilyGroup(users) {
  console.log('🔄 Creating family group...');

  // Set owner as first user (dad)
  const owner = users.find(u => u.profile.displayName === '김아빠');
  if (!owner) {
    throw new Error('Owner user not found');
  }

  const groupData = {
    ...familyGroup,
    ownerId: owner.uid,
    memberIds: users.map(u => u.uid),
    members: users.map(u => ({
      id: u.uid,
      name: u.profile.displayName,
      email: u.email,
      role: u.profile.role,
      joinedAt: new Date(),
      isOnline: Math.random() > 0.5,
      stats: {
        totalTasks: Math.floor(Math.random() * 50) + 10,
        completedTasks: Math.floor(Math.random() * 40) + 5,
        completionRate: Math.floor(Math.random() * 30) + 70,
        streak: Math.floor(Math.random() * 15) + 1,
      },
    })),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'groups', familyGroup.id), groupData);
  console.log('✅ Family group created successfully');

  return familyGroup.id;
}

async function createSampleTasks(users, groupId) {
  console.log('🔄 Creating sample tasks...');

  for (let i = 0; i < sampleTasks.length; i++) {
    const taskData = sampleTasks[i];
    const assigneeIndex = i % users.length;
    const creatorIndex = Math.floor(i / 2) % users.length;

    const assignee = users[assigneeIndex];
    const creator = users[creatorIndex];

    const task = {
      ...taskData,
      groupId,
      userId: creator.uid,
      assigneeId: assignee.uid,
      assigneeName: assignee.profile.displayName,
      creatorName: creator.profile.displayName,
      watchers: [creator.uid, assignee.uid],
      mentionedUsers: [],
      completedBy: taskData.status === 'completed' ? assignee.uid : null,
      completionNotes: taskData.status === 'completed' ? '완료했습니다!' : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'tasks'), task);
    console.log(
      `✅ Created task: ${task.title} (assigned to ${assignee.profile.displayName})`
    );

    // Add some comments to first few tasks
    if (i < 3) {
      const comment = sampleComments[i];
      if (comment) {
        const commenterIndex = (i + 1) % users.length;
        const commenter = users[commenterIndex];

        await addDoc(collection(db, 'tasks', docRef.id, 'comments'), {
          ...comment,
          taskId: docRef.id,
          userId: commenter.uid,
          userName: commenter.profile.displayName,
          userAvatar: null,
          createdAt: serverTimestamp(),
        });
        console.log(`✅ Added comment to task: ${task.title}`);
      }
    }

    // Add activity log
    if (i < sampleActivities.length) {
      const activity = sampleActivities[i];
      await addDoc(collection(db, 'activities'), {
        ...activity,
        taskId: docRef.id,
        userId: creator.uid,
        userName: creator.profile.displayName,
        groupId,
        createdAt: serverTimestamp(),
      });
    }
  }

  console.log('✅ All sample tasks created successfully');
}

async function createAdditionalTestData(users, groupId) {
  console.log('🔄 Creating additional test data...');

  // Create some notifications
  for (const user of users.slice(0, 2)) {
    await addDoc(collection(db, 'notifications'), {
      userId: user.uid,
      type: 'task_assigned',
      title: '새 할일이 할당되었습니다',
      message: '식료품 장보기 할일이 할당되었습니다.',
      data: {
        taskId: 'sample-task-id',
        taskTitle: '식료품 장보기',
      },
      read: false,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'notifications'), {
      userId: user.uid,
      type: 'task_due_soon',
      title: '마감 임박 알림',
      message: '방 청소하기가 내일 마감입니다.',
      data: {
        taskId: 'sample-task-id-2',
        taskTitle: '방 청소하기',
      },
      read: Math.random() > 0.5,
      createdAt: serverTimestamp(),
    });
  }

  // Create some user achievements
  for (const user of users) {
    await setDoc(doc(db, 'achievements', user.uid), {
      userId: user.uid,
      unlockedAchievements: [
        {
          id: 'first_task',
          title: '첫 할일 완료',
          description: '첫 번째 할일을 완료했습니다',
          unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'streak_7',
          title: '일주일 연속',
          description: '7일 연속 할일을 완료했습니다',
          unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
      totalPoints: Math.floor(Math.random() * 1000) + 500,
      level: Math.floor(Math.random() * 10) + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log('✅ Additional test data created successfully');
}

async function setupTestData() {
  try {
    console.log('🚀 Starting Firebase test data setup...');
    console.log(`🔧 Firebase Project: ${firebaseConfig.projectId}`);
    console.log(`🌍 Mode: ${isDemoMode ? 'Demo' : 'Production'}`);
    console.log('');

    if (isDemoMode) {
      console.log(
        '⚠️ Demo mode detected. This will create test data with fallback values.'
      );
      console.log(
        '⚠️ For production setup, configure your Firebase environment variables.'
      );
      console.log('');
    }

    // Step 1: Create test users
    const users = await createTestUsers();
    console.log('');

    // Step 2: Create family group
    const groupId = await createFamilyGroup(users);
    console.log('');

    // Step 3: Create sample tasks
    await createSampleTasks(users, groupId);
    console.log('');

    // Step 4: Create additional test data
    await createAdditionalTestData(users, groupId);
    console.log('');

    console.log('🎉 Test data setup completed successfully!');
    console.log('');
    console.log('📋 Test Accounts Created:');
    console.log('================================');
    testUsers.forEach(user => {
      console.log(`👤 ${user.profile.displayName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   👥 Role: ${user.profile.role}`);
      console.log('');
    });
    console.log('🏠 Family Group: Kim 가족');
    console.log(`🔗 Invite Code: ${familyGroup.inviteCode}`);
    console.log('');
    console.log('📝 Sample data includes:');
    console.log('• 8 sample tasks with different statuses');
    console.log('• Comments and reactions');
    console.log('• Activity logs');
    console.log('• User achievements');
    console.log('• Notifications');
    console.log('');
    console.log('✨ You can now test the frontend with this data!');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestData();
