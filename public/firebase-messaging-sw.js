// Firebase Cloud Messaging Service Worker
// This file must be placed in the public directory and served from the root

// Import Firebase scripts for service worker
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js'
);

// Firebase configuration - these should match your app's config
const firebaseConfig = {
  apiKey: 'AIzaSyDw5QKUOCHBewF8tS2poDyZL9jRUtOveMw',
  authDomain: 'plan-e7bc6.firebaseapp.com',
  projectId: 'plan-e7bc6',
  storageBucket: 'plan-e7bc6.firebasestorage.app',
  messagingSenderId: '507060914612',
  appId: '1:507060914612:web:45ee29e84cf59df82b4ae1',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Moonwave Plan';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/Moonwave.png',
    badge: '/Moonwave.png',
    image: payload.notification?.image,
    tag: payload.data?.tag || 'default',
    requireInteraction: payload.data?.requireInteraction === 'true',
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
    data: payload.data || {},
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
  };

  // Show the notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification);

  // Close the notification
  event.notification.close();

  // Handle notification action
  const action = event.action;
  const notificationData = event.notification.data;

  if (action === 'view' || !action) {
    // Open the app or navigate to specific page
    const urlToOpen = notificationData.url || '/';

    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              'focus' in client
            ) {
              client.focus();
              if (urlToOpen !== '/') {
                client.navigate(urlToOpen);
              }
              return;
            }
          }

          // If app is not open, open it
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (action === 'complete') {
    // Handle task completion
    event.waitUntil(
      fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: notificationData.taskId,
          action: 'complete',
        }),
      }).catch(error => console.error('Error completing task:', error))
    );
  } else if (action === 'snooze') {
    // Handle snooze action
    event.waitUntil(
      fetch('/api/tasks/snooze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: notificationData.taskId,
          snoozeMinutes: 30,
        }),
      }).catch(error => console.error('Error snoozing task:', error))
    );
  } else if (action === 'dismiss') {
    // Just close the notification (already handled above)
    console.log('Notification dismissed');
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification);

  // Optional: Track notification dismissal
  const notificationData = event.notification.data;
  if (notificationData.trackDismissal) {
    event.waitUntil(
      fetch('/api/analytics/notification-dismissed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notificationData.id,
          dismissedAt: Date.now(),
        }),
      }).catch(error => console.error('Error tracking dismissal:', error))
    );
  }
});
