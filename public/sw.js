// Service Worker for Moonwave Plan PWA
const CACHE_NAME = 'moonwave-plan-v1.0.0';
const CACHE_VERSION = '1.0.0';
const SCOPE_URL = new URL(self.registration.scope);

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Moonwave.png',
];

// Background sync tasks
const BACKGROUND_SYNC_TAGS = {
  TASK_SYNC: 'task-sync',
  NOTIFICATION_SYNC: 'notification-sync',
  OFFLINE_ACTIONS: 'offline-actions',
};

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Firestore/Google 등 교차 출처 네트워크 스트림은 SW가 가로채지 않도록 우회
  // - POST/streaming 채널(Write/channel, Listen/channel 등) 캐싱/복제 시 에러 가능
  // - googleapis / gstatic / firebaseapp 도메인은 네이티브 네트워크로 통과
  const isCrossOrigin = url.origin !== self.location.origin;
  const isGoogleService =
    /(?:googleapis|gstatic|firebaseio|firebaseapp)\.com$/.test(url.hostname);
  if (isCrossOrigin && isGoogleService) {
    return; // respondWith를 사용하지 않으면 기본 fetch로 브라우저가 처리
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with different strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First strategy
    event.respondWith(handleApiRequest(request));
  } else if (
    url.pathname.includes('.') ||
    url.pathname.startsWith('/assets/')
  ) {
    // Static assets - Cache First strategy
    event.respondWith(handleStaticRequest(request));
  } else {
    // Navigation requests - Stale While Revalidate strategy
    event.respondWith(handleNavigationRequest(request));
  }
});

// Network First strategy for API requests
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: '네트워크 연결을 확인하고 다시 시도해주세요.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache First strategy for static assets
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Stale While Revalidate strategy for navigation
async function handleNavigationRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Fetch fresh version in background
    const networkPromise = fetch(request.clone())
      .then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request.clone(), networkResponse.clone());
        }
        return networkResponse;
      })
      .catch(() => null);

    if (cachedResponse) {
      networkPromise.catch(() => {});
      return cachedResponse;
    }

    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }

    return (
      (await cache.match('/')) ||
      new Response('App not available offline', {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      })
    );
  } catch (error) {
    console.error('[SW] Navigation request failed:', error);
    return new Response('페이지를 불러올 수 없습니다', { status: 503 });
  }
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  switch (event.tag) {
    case BACKGROUND_SYNC_TAGS.TASK_SYNC:
      event.waitUntil(syncTasks());
      break;
    case BACKGROUND_SYNC_TAGS.NOTIFICATION_SYNC:
      event.waitUntil(syncNotifications());
      break;
    case BACKGROUND_SYNC_TAGS.OFFLINE_ACTIONS:
      event.waitUntil(syncOfflineActions());
      break;
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[SW] Push message received');

  let notificationData = {};

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = { title: event.data.text() };
    }
  }

  const title = notificationData.title || 'Moonwave Plan';
  const options = {
    body: notificationData.body || '새로운 알림이 있습니다.',
    icon: '/Moonwave.png',
    badge: '/Moonwave.png',
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: '보기',
      },
      {
        action: 'dismiss',
        title: '닫기',
      },
    ],
    requireInteraction: false,
    tag: notificationData.tag || 'default',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/';

  if (data && data.url) {
    targetUrl = data.url;
  } else if (data && data.type) {
    switch (data.type) {
      case 'task_assigned':
      case 'task_reminder':
        targetUrl = data.taskId ? '/tasks/' + data.taskId : '/notifications';
        break;
      case 'task_completed':
        targetUrl = '/statistics';
        break;
      case 'group_invite':
        targetUrl = '/family';
        break;
      default:
        targetUrl = '/notifications';
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data,
              targetUrl: targetUrl,
            });
            return;
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});

// Message event
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        cacheStatus: 'active',
        version: CACHE_VERSION,
      });
      break;
  }
});

// Sync functions (placeholder implementations)
async function syncTasks() {
  console.log('[SW] Syncing offline tasks');
}

async function syncNotifications() {
  console.log('[SW] Syncing offline notifications');
}

async function syncOfflineActions() {
  console.log('[SW] Syncing offline actions');
}
