import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./lib/firebase', () => ({
  auth: {
    currentUser: null,
    signInAnonymously: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  },
  db: {},
  storage: {},
  analytics: null,
  performance: null,
}));

// Mock Firestore service
jest.mock('./lib/firestore', () => ({
  taskService: {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTask: jest.fn(),
    getGroupTasks: jest.fn(),
    subscribeToGroupTasks: jest.fn(),
    subscribeToUserTasks: jest.fn(),
  },
  groupService: {
    createGroup: jest.fn(),
    updateGroup: jest.fn(),
    getGroup: jest.fn(),
    getUserGroups: jest.fn(),
    subscribeToGroup: jest.fn(),
    subscribeToUserGroups: jest.fn(),
    addMemberToGroup: jest.fn(),
    removeMemberFromGroup: jest.fn(),
  },
  commentService: {
    addComment: jest.fn(),
    deleteComment: jest.fn(),
    subscribeToTaskComments: jest.fn(),
    addReaction: jest.fn(),
  },
  userService: {
    createOrUpdateUserProfile: jest.fn(),
    getUserProfile: jest.fn(),
    subscribeToUserProfile: jest.fn(),
  },
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useLocation: () => ({
    pathname: '/test',
    search: '',
    hash: '',
    state: null,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock as Storage;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

// Mock TextEncoder and TextDecoder for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock import.meta for Vite environment variables
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        DEV: true,
        NODE_ENV: 'test',
        VITE_FCM_VAPID_KEY: 'mock-vapid-key',
        VITE_FIREBASE_API_KEY: 'mock-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'mock.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'mock-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'mock-project.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'mock-app-id',
      },
    },
  },
});

// Mock process.env for Node.js environment
process.env = {
  ...process.env,
  VITE_FCM_VAPID_KEY: 'mock-vapid-key',
  VITE_FIREBASE_API_KEY: 'mock-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'mock.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'mock-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'mock-project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: 'mock-app-id',
};

// Mock console methods in test environment
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clear all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});