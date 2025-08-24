import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import logger from '../lib/logger';

// 특정 컬렉션의 모든 문서 삭제
export const deleteAllDocumentsInCollection = async (
  collectionName: string
) => {
  try {
    logger.info('firebaseCleanup', 'delete collection start', collectionName);

    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(document =>
      deleteDoc(doc(db, collectionName, document.id))
    );

    await Promise.all(deletePromises);
    logger.info(
      'firebaseCleanup',
      'delete collection complete',
      snapshot.docs.length
    );

    return { success: true, deletedCount: snapshot.docs.length };
  } catch (error) {
    logger.error('firebaseCleanup', 'delete collection failed', {
      collectionName,
      error,
    });
    return { success: false, error };
  }
};

// 특정 사용자의 데이터만 삭제
export const deleteUserData = async (userId: string) => {
  try {
    logger.info('firebaseCleanup', 'delete user data start', userId);

    // trips 컬렉션에서 해당 사용자 데이터 삭제
    const tripsQuery = query(
      collection(db, 'trips'),
      where('user_id', '==', userId)
    );
    const tripsSnapshot = await getDocs(tripsQuery);

    const tripDeletePromises = tripsSnapshot.docs.map(document =>
      deleteDoc(doc(db, 'trips', document.id))
    );
    await Promise.all(tripDeletePromises);
    logger.info('firebaseCleanup', 'trips deleted', tripsSnapshot.docs.length);

    // plans 컬렉션에서 해당 사용자의 여행과 연관된 데이터 삭제
    // 먼저 해당 사용자의 trip_id 목록을 가져와야 함
    const tripIds = tripsSnapshot.docs.map(doc => doc.id);

    if (tripIds.length > 0) {
      // 각 trip_id별로 plans 삭제
      for (const tripId of tripIds) {
        const plansQuery = query(
          collection(db, 'plans'),
          where('trip_id', '==', tripId)
        );
        const plansSnapshot = await getDocs(plansQuery);

        const planDeletePromises = plansSnapshot.docs.map(document =>
          deleteDoc(doc(db, 'plans', document.id))
        );
        await Promise.all(planDeletePromises);
        logger.info(
          'firebaseCleanup',
          `plans deleted for ${tripId}`,
          plansSnapshot.docs.length
        );
      }
    }

    return {
      success: true,
      deletedTrips: tripsSnapshot.docs.length,
      deletedPlans: tripIds.length,
    };
  } catch (error) {
    logger.error('firebaseCleanup', 'delete user data failed', error);
    return { success: false, error };
  }
};

// Firebase 전체 데이터 초기화
export const cleanupAllFirebaseData = async () => {
  try {
    logger.warn('firebaseCleanup', 'reset all data start');

    const collections = ['trips', 'plans'];
    const results = [];

    for (const collectionName of collections) {
      const result = await deleteAllDocumentsInCollection(collectionName);
      results.push({ collection: collectionName, ...result });
    }

    logger.info('firebaseCleanup', 'reset all data complete');
    return { success: true, results };
  } catch (error) {
    logger.error('firebaseCleanup', 'reset all data failed', error);
    return { success: false, error };
  }
};

// 현재 로그인된 사용자의 데이터만 초기화
export const cleanupCurrentUserData = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인된 사용자가 없습니다');
    }

    logger.warn('firebaseCleanup', 'reset current user data start');
    const result = await deleteUserData(auth.currentUser.uid);

    if (result.success) {
      logger.info('firebaseCleanup', 'reset current user data complete');
    }

    return result;
  } catch (error) {
    logger.error('firebaseCleanup', 'reset current user data failed', error);
    return { success: false, error };
  }
};
