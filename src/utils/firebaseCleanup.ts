import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

// 특정 컬렉션의 모든 문서 삭제
export const deleteAllDocumentsInCollection = async (collectionName: string) => {
  try {
    console.log(`🗑️ ${collectionName} 컬렉션 삭제 시작...`);
    
    const snapshot = await getDocs(collection(db, collectionName));
    const deletePromises = snapshot.docs.map(document => 
      deleteDoc(doc(db, collectionName, document.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`✅ ${collectionName} 컬렉션 삭제 완료 (${snapshot.docs.length}개 문서 삭제)`);
    
    return { success: true, deletedCount: snapshot.docs.length };
  } catch (error) {
    console.error(`❌ ${collectionName} 컬렉션 삭제 실패:`, error);
    return { success: false, error };
  }
};

// 특정 사용자의 데이터만 삭제
export const deleteUserData = async (userId: string) => {
  try {
    console.log(`🗑️ 사용자 ${userId}의 데이터 삭제 시작...`);
    
    // trips 컬렉션에서 해당 사용자 데이터 삭제
    const tripsQuery = query(collection(db, 'trips'), where('user_id', '==', userId));
    const tripsSnapshot = await getDocs(tripsQuery);
    
    const tripDeletePromises = tripsSnapshot.docs.map(document => 
      deleteDoc(doc(db, 'trips', document.id))
    );
    await Promise.all(tripDeletePromises);
    console.log(`✅ trips 삭제 완료 (${tripsSnapshot.docs.length}개)`);
    
    // plans 컬렉션에서 해당 사용자의 여행과 연관된 데이터 삭제
    // 먼저 해당 사용자의 trip_id 목록을 가져와야 함
    const tripIds = tripsSnapshot.docs.map(doc => doc.id);
    
    if (tripIds.length > 0) {
      // 각 trip_id별로 plans 삭제
      for (const tripId of tripIds) {
        const plansQuery = query(collection(db, 'plans'), where('trip_id', '==', tripId));
        const plansSnapshot = await getDocs(plansQuery);
        
        const planDeletePromises = plansSnapshot.docs.map(document =>
          deleteDoc(doc(db, 'plans', document.id))
        );
        await Promise.all(planDeletePromises);
        console.log(`✅ trip ${tripId}의 plans 삭제 완료 (${plansSnapshot.docs.length}개)`);
      }
    }
    
    return { 
      success: true, 
      deletedTrips: tripsSnapshot.docs.length,
      deletedPlans: tripIds.length 
    };
  } catch (error) {
    console.error(`❌ 사용자 데이터 삭제 실패:`, error);
    return { success: false, error };
  }
};

// Firebase 전체 데이터 초기화
export const cleanupAllFirebaseData = async () => {
  try {
    console.log('🚨 Firebase 전체 데이터 초기화 시작...');
    
    const collections = ['trips', 'plans'];
    const results = [];
    
    for (const collectionName of collections) {
      const result = await deleteAllDocumentsInCollection(collectionName);
      results.push({ collection: collectionName, ...result });
    }
    
    console.log('🎉 Firebase 전체 데이터 초기화 완료!');
    return { success: true, results };
    
  } catch (error) {
    console.error('❌ Firebase 데이터 초기화 실패:', error);
    return { success: false, error };
  }
};

// 현재 로그인된 사용자의 데이터만 초기화
export const cleanupCurrentUserData = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('로그인된 사용자가 없습니다');
    }
    
    console.log('🚨 현재 사용자 데이터 초기화 시작...');
    const result = await deleteUserData(auth.currentUser.uid);
    
    if (result.success) {
      console.log('🎉 현재 사용자 데이터 초기화 완료!');
    }
    
    return result;
  } catch (error) {
    console.error('❌ 사용자 데이터 초기화 실패:', error);
    return { success: false, error };
  }
};