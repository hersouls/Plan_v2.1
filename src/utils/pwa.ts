// PWA utilities for service worker registration and management
import logger from '../lib/logger';

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
        logger.error('pwa', 'service worker registration failed', error);
      }
    }
  }

  private listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      logger.info('pwa', 'install prompt available');

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
      logger.warn('pwa', 'service worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;

      logger.info('pwa', 'service worker registered successfully');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        logger.info('pwa', 'service worker update found');

        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              logger.info(
                'pwa',
                'new service worker installed - update available'
              );
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
      logger.error('pwa', 'service worker registration failed', error);
      return null;
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      logger.warn('pwa', 'install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await this.installPrompt.prompt();

      // Wait for user response
      const result = await this.installPrompt.userChoice;

      // Clear the stored prompt
      this.installPrompt = null;

      logger.info('pwa', 'install prompt result', result.outcome);
      return result.outcome === 'accepted';
    } catch (error) {
      logger.error('pwa', 'install prompt failed', error);
      return false;
    }
  }

  isInstallable(): boolean {
    return this.installPrompt !== null;
  }

  isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true
    );
  }

  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      logger.warn('pwa', 'no service worker registration available');
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
      logger.error('pwa', 'service worker update failed', error);
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

      this.registration?.active?.postMessage({ type: 'GET_CACHE_STATUS' }, [
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
        logger.info('pwa', 'all caches cleared');
      } catch (error) {
        logger.error('pwa', 'failed to clear caches', error);
      }
    }
  }

  // Background sync helpers
  async registerBackgroundSync(_tag: string): Promise<void> {
    // Background Sync는 브라우저 지원 편차가 크므로 우회 처리
    logger.warn('pwa', 'background sync not supported or disabled');
  }

  // Notification helpers
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      logger.warn('pwa', 'notifications not supported');
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
      logger.warn('pwa', 'notification permission denied');
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
      logger.warn('pwa', 'Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logger.error('pwa', 'share failed', error);
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
      // Note: cannot remove anonymous listener; expose a disposer if needed
    }
    if (onOffline) {
      window.removeEventListener('offline', onOffline);
    }
    if (onOnline) {
      window.removeEventListener('online', onOnline);
    }
  };
};
