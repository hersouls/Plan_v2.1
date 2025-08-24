import { loadAnalytics } from '../lib/firebase';
import logger from '../lib/logger';

export const trackEvent = async (
  eventName: string,
  parameters?: Record<string, unknown>
) => {
  try {
    const analytics = await loadAnalytics();
    if (!analytics) {
      if (import.meta.env.DEV) {
        logger.warn('analytics', 'not available');
      }
      return;
    }

    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, eventName, parameters);

    if (import.meta.env.DEV) {
      logger.info('analytics', `event tracked: ${eventName}`, parameters);
    }
  } catch (error) {
    logger.warn('analytics', 'event tracking failed', error);
  }
};

export const trackPageView = async (pageName: string, userId?: string) => {
  await trackEvent('page_view', {
    page_title: pageName,
    user_id: userId,
  });
};

export const trackTripCreated = async (tripId: string, userId: string) => {
  await trackEvent('trip_created', {
    trip_id: tripId,
    user_id: userId,
  });
};

export const trackPlanAdded = async (tripId: string, userId: string) => {
  await trackEvent('plan_added', {
    trip_id: tripId,
    user_id: userId,
  });
};

export const trackPlaceSearched = async (query: string, userId: string) => {
  await trackEvent('place_searched', {
    search_term: query,
    user_id: userId,
  });
};

export const trackImageUploaded = async (tripId: string, userId: string) => {
  await trackEvent('image_uploaded', {
    trip_id: tripId,
    user_id: userId,
  });
};

export const trackMapViewed = async (tripId: string, userId: string) => {
  await trackEvent('map_viewed', {
    trip_id: tripId,
    user_id: userId,
  });
};
