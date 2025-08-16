// PWA utilities for service worker registration and management
export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isControlling: boolean;
  registration: ServiceWorkerRegistration | null;
}

export class PWAManager {
  private installPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Listen for install prompt
    this.listenForInstallPrompt();

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      console.log('PWA install prompt available');

      // Prevent the default install prompt
      event.preventDefault();

      // Store the event for later use
      this.installPrompt = event as PWAInstallPrompt;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;

      console.log('Service Worker registered successfully');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');

        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('New Service Worker installed, update available');
              window.dispatchEvent(
                new CustomEvent('sw-update-available', {
                  detail: { registration },
                })
              );
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await this.installPrompt.prompt();

      // Wait for user response
      const result = await this.installPrompt.userChoice;

      // Clear the stored prompt
      this.installPrompt = null;

      console.log('Install prompt result:', result.outcome);
      return result.outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  isInstallable(): boolean {
    return this.installPrompt !== null;
  }

  isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      console.warn('No service worker registration available');
      return;
    }

    try {
      // Check for updates
      await this.registration.update();

      // If there's a waiting worker, skip waiting and reload
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Listen for controlling change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  getServiceWorkerStatus(): ServiceWorkerStatus {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: this.registration !== null,
      isControlling: navigator.serviceWorker?.controller !== null,
      registration: this.registration,
    };
  }

  async getCacheStatus(): Promise<{
    cacheStatus: string;
    version: string;
  } | null> {
    if (!this.registration || !this.registration.active) {
      return null;
    }

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage({ type: 'GET_CACHE_STATUS' }, [
        messageChannel.port2,
      ]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      } catch (error) {
        console.error('Failed to clear caches:', error);
      }
    }
  }

  // Background sync helpers
  async registerBackgroundSync(tag: string): Promise<void> {
    if (
      !this.registration ||
      !('sync' in window.ServiceWorkerRegistration.prototype)
    ) {
      console.warn('Background sync not supported');
      return;
    }

    try {
      await this.registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Notification helpers
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    const permission = await this.requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    if (this.registration) {
      // Use service worker notification
      await this.registration.showNotification(title, {
        icon: '/Moonwave.png',
        badge: '/Moonwave.png',
        ...options,
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/Moonwave.png',
        ...options,
      });
    }
  }

  // Share API helpers
  async shareContent(data: ShareData): Promise<boolean> {
    if (!('share' in navigator)) {
      console.warn('Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }

  canShare(): boolean {
    return 'share' in navigator;
  }

  // Cleanup
  destroy(): void {
    // Remove event listeners if needed
    // This is mainly for component unmounting
  }
}

// Singleton instance
export const pwaManager = new PWAManager();

// Helper functions for React components
export const usePWAInstall = () => {
  return {
    isInstallable: () => pwaManager.isInstallable(),
    promptInstall: () => pwaManager.promptInstall(),
    isStandalone: () => pwaManager.isStandalone(),
  };
};

export const usePWAUpdate = () => {
  return {
    updateServiceWorker: () => pwaManager.updateServiceWorker(),
    getServiceWorkerStatus: () => pwaManager.getServiceWorkerStatus(),
    getCacheStatus: () => pwaManager.getCacheStatus(),
  };
};

export const usePWAShare = () => {
  return {
    shareContent: (data: ShareData) => pwaManager.shareContent(data),
    canShare: () => pwaManager.canShare(),
  };
};

// Event listener helpers
export const addPWAEventListeners = (callbacks: {
  onInstallAvailable?: () => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}) => {
  const { onInstallAvailable, onUpdateAvailable, onOffline, onOnline } =
    callbacks;

  if (onInstallAvailable) {
    window.addEventListener('pwa-install-available', onInstallAvailable);
  }

  if (onUpdateAvailable) {
    window.addEventListener('sw-update-available', event => {
      onUpdateAvailable((event as CustomEvent).detail.registration);
    });
  }

  if (onOffline) {
    window.addEventListener('offline', onOffline);
  }

  if (onOnline) {
    window.addEventListener('online', onOnline);
  }

  // Return cleanup function
  return () => {
    if (onInstallAvailable) {
      window.removeEventListener('pwa-install-available', onInstallAvailable);
    }
    if (onUpdateAvailable) {
      window.removeEventListener('sw-update-available', event => {
        onUpdateAvailable((event as CustomEvent).detail.registration);
      });
    }
    if (onOffline) {
      window.removeEventListener('offline', onOffline);
    }
    if (onOnline) {
      window.removeEventListener('online', onOnline);
    }
  };
};
