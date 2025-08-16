import { test as base } from '@playwright/test'

/**
 * Firebase Mock Fixtures for Testing
 * Provides consistent Firebase mocking across all tests
 */

// Mock data structures
export const mockUser = {
  uid: 'test-user-12345',
  email: 'test@moonwave.kr',
  displayName: 'Test User',
  isAnonymous: false,
}

export const mockTasks = [
  {
    id: 'task-1',
    title: '장보기 하기',
    description: '마트에서 일주일치 식료품 구매',
    category: 'shopping',
    priority: 'medium',
    status: 'pending',
    userId: mockUser.uid,
    assigneeId: mockUser.uid,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2', 
    title: '방 청소하기',
    description: '침실과 거실 청소',
    category: 'household',
    priority: 'high',
    status: 'in_progress',
    userId: mockUser.uid,
    assigneeId: mockUser.uid,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

export const mockGroup = {
  id: 'group-1',
  name: '우리 가족',
  ownerId: mockUser.uid,
  memberIds: [mockUser.uid],
  settings: {
    allowMembersToInvite: true,
    requireApprovalForTasks: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockComments = [
  {
    id: 'comment-1',
    taskId: 'task-1',
    userId: mockUser.uid,
    userName: mockUser.displayName,
    content: '내일까지 완료 예정입니다!',
    reactions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

// Firebase mock implementation
export const firebaseMock = {
  auth: {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      // Simulate auth state change
      setTimeout(() => callback(mockUser), 100)
      return () => {} // unsubscribe function
    },
    signInAnonymously: () => Promise.resolve({ user: mockUser }),
    signInWithPopup: () => Promise.resolve({ user: mockUser }),
    signOut: () => Promise.resolve(),
  },
  
  firestore: {
    collection: (collectionName: string) => ({
      doc: (docId?: string) => ({
        id: docId || 'mock-doc-id',
        get: () => {
          let data = {}
          switch (collectionName) {
            case 'tasks':
              data = mockTasks.find(task => task.id === docId) || mockTasks[0]
              break
            case 'groups':
              data = mockGroup
              break
            case 'users':
              data = { ...mockUser, fcmTokens: ['mock-token'] }
              break
          }
          return Promise.resolve({
            exists: true,
            data: () => data,
            id: docId || 'mock-doc-id'
          })
        },
        set: (data: any) => Promise.resolve(),
        update: (data: any) => Promise.resolve(),
        delete: () => Promise.resolve(),
        onSnapshot: (callback: any) => {
          // Simulate real-time updates
          let data = []
          switch (collectionName) {
            case 'tasks':
              data = mockTasks
              break
            case 'groups':
              data = [mockGroup]
              break
          }
          
          setTimeout(() => {
            callback({
              docs: data.map(item => ({
                id: item.id,
                data: () => item,
                exists: true
              }))
            })
          }, 100)
          
          return () => {} // unsubscribe
        }
      }),
      add: (data: any) => Promise.resolve({ 
        id: `mock-${Date.now()}`,
        ...data 
      }),
      where: (field: string, operator: string, value: any) => ({
        get: () => {
          let filteredData = []
          switch (collectionName) {
            case 'tasks':
              filteredData = mockTasks.filter(task => {
                switch (operator) {
                  case '==':
                    return task[field as keyof typeof task] === value
                  case 'array-contains':
                    return Array.isArray(task[field as keyof typeof task]) && 
                           (task[field as keyof typeof task] as any[]).includes(value)
                  default:
                    return true
                }
              })
              break
          }
          
          return Promise.resolve({
            docs: filteredData.map(item => ({
              id: item.id,
              data: () => item,
              exists: true
            }))
          })
        },
        onSnapshot: (callback: any) => {
          // Simulate filtered real-time updates
          setTimeout(() => {
            callback({
              docs: mockTasks.map(item => ({
                id: item.id,
                data: () => item,
                exists: true
              }))
            })
          }, 100)
          return () => {}
        }
      }),
      orderBy: () => ({
        get: () => Promise.resolve({
          docs: mockTasks.map(item => ({
            id: item.id,
            data: () => item,
            exists: true
          }))
        })
      })
    })
  },
  
  messaging: {
    getToken: () => Promise.resolve('mock-fcm-token'),
    onMessage: (callback: any) => {
      return () => {}
    }
  },
  
  storage: {
    ref: (path: string) => ({
      put: () => Promise.resolve({
        ref: { getDownloadURL: () => Promise.resolve('https://mock-url.com/file.jpg') }
      }),
      delete: () => Promise.resolve()
    })
  }
}

// Test fixture with Firebase mock
export const test = base.extend({
  // Automatic Firebase mocking for all tests
  page: async ({ page }, use) => {
    // Add Firebase mock to every page before navigation
    await page.addInitScript(() => {
      // Store original fetch to avoid breaking other network requests
      const originalFetch = window.fetch
      
      // Mock Firebase SDK
      ;(window as any).firebase = {
        auth: () => ({
          currentUser: {
            uid: 'test-user-12345',
            email: 'test@moonwave.kr',
            displayName: 'Test User'
          },
          onAuthStateChanged: (callback: any) => {
            setTimeout(() => callback({
              uid: 'test-user-12345',
              email: 'test@moonwave.kr',
              displayName: 'Test User'
            }), 100)
            return () => {}
          },
          signInAnonymously: () => Promise.resolve({
            user: {
              uid: 'test-user-12345',
              email: 'test@moonwave.kr',
              displayName: 'Test User'
            }
          }),
          signOut: () => Promise.resolve()
        }),
        firestore: () => ({
          collection: (name: string) => ({
            doc: (id: string) => ({
              get: () => Promise.resolve({
                exists: true,
                data: () => ({ id, title: 'Mock Task', status: 'pending' })
              }),
              set: () => Promise.resolve(),
              update: () => Promise.resolve(),
              onSnapshot: (callback: any) => {
                setTimeout(() => callback({
                  exists: true,
                  data: () => ({ id, title: 'Mock Task', status: 'pending' })
                }), 100)
                return () => {}
              }
            }),
            add: () => Promise.resolve({ id: 'mock-id' }),
            get: () => Promise.resolve({ docs: [] }),
            onSnapshot: (callback: any) => {
              setTimeout(() => callback({ docs: [] }), 100)
              return () => {}
            }
          })
        })
      }
    })
    
    await use(page)
  }
})

export { expect } from '@playwright/test'