// Firebase v9 Firestore 일괄 Plan 등록 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

// .env 파일 로드
config();

// Firebase 설정 (환경변수에서 가져옴)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 현재 앱 스키마에 맞는 Plan 데이터
const plansByDay = {
  1: [ // Day 1: 2025-10-05
    { place_name: '집 출발', type: 'transport', start_time: '14:00' },
    { place_name: '발권', type: 'transport', start_time: '14:30' },
    { place_name: '라운지', type: 'restaurant', start_time: '15:00' },
    { place_name: '인천국제공항 T1 출발 (에어캐나다)', type: 'transport', start_time: '19:05' },
    { place_name: '토론토(YYZ) 도착', type: 'transport', start_time: '19:30' },
    { place_name: '렌트카 체크인', type: 'transport', start_time: '20:30' },
    {
      place_name: 'Courtyard by Marriott Toronto Airport (체크인)',
      type: 'hotel',
      start_time: '21:00',
      map_url: 'https://maps.app.goo.gl/uJAmTvYRcpMdoPBt9',
    },
  ],

  2: [ // Day 2: 2025-10-06
    { place_name: '호텔 조식', type: 'restaurant', start_time: '07:00' },
    { place_name: '호텔 체크아웃', type: 'hotel', start_time: '08:00' },
    {
      place_name: 'Toronto CityPASS 구매 (₩150,000/인)',
      type: 'other',
      start_time: '08:10',
      map_url: 'https://www.citypass.com/toronto?p=toronto&s=maps&lang=ko-KR',
    },
    {
      place_name: 'South Parking - Metro Toronto Convention Centre (주차)',
      type: 'transport',
      start_time: '08:40',
      map_url: 'https://maps.app.goo.gl/Bb7igc4VZq8duL8a7',
    },
    {
      place_name: "Ripley's Aquarium of Canada (시티패스)",
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/2mWYgZokwHqb35jz6',
    },
    {
      place_name: 'CN Tower (시티패스)',
      type: 'attraction',
      start_time: '11:00',
      map_url: 'https://maps.app.goo.gl/ej5j12E4HEM1xcY1A',
    },
    {
      place_name: '점심: The Rec Room Roundhouse',
      type: 'restaurant',
      start_time: '12:30',
      map_url: 'https://maps.app.goo.gl/6FoLZZ2bRJb7KGa86',
    },
    {
      place_name: 'City Cruises (시티패스)',
      type: 'attraction',
      start_time: '14:00',
      map_url: 'https://maps.app.goo.gl/rsKKU2pej5VtfwxB7',
    },
    {
      place_name: 'Casa Loma (시티패스)',
      type: 'attraction',
      start_time: '16:00',
      map_url: 'https://maps.app.goo.gl/uffbqtHYXAdxgDXy6',
    },
    {
      place_name: 'Toronto Marriott Markham (체크인)',
      type: 'hotel',
      start_time: '18:00',
      map_url: 'https://maps.app.goo.gl/CJpgAaXoB8A9R1jM6',
    },
    { place_name: '클럽 라운지 (시간 확인 필요)', type: 'restaurant', start_time: '19:00' },
  ],

  3: [ // Day 3: 2025-10-07
    { place_name: '호텔 조식', type: 'restaurant', start_time: '08:00' },
    { place_name: '이동: 오타와 (약 4시간)', type: 'transport', start_time: '08:30' },
    {
      place_name: 'Parliament Hill (캐나다 연방의회)',
      type: 'attraction',
      start_time: '10:00',
      map_url: 'https://maps.app.goo.gl/PXcTRYz7FTbH9B3p7',
    },
    {
      place_name: 'The National War Memorial',
      type: 'attraction',
      start_time: '10:40',
      map_url: 'https://maps.app.goo.gl/NEJruaxvs6kkT99i9',
    },
    {
      place_name: '점심: JOEY Rideau',
      type: 'restaurant',
      start_time: '12:00',
      map_url: 'https://maps.app.goo.gl/6vdh27dWMewd6dhg8',
    },
    {
      place_name: 'Ottawa Sign, ByWard Market',
      type: 'attraction',
      start_time: '13:30',
      map_url: 'https://maps.app.goo.gl/UDdt7pTqxSdymaoH9',
    },
    {
      place_name: 'Notre Dame Cathedral Basilica',
      type: 'attraction',
      start_time: '14:00',
      map_url: 'https://maps.app.goo.gl/fFbQW7WBA4LoMFbu5',
    },
    {
      place_name: 'National Gallery of Canada',
      type: 'attraction',
      start_time: '15:00',
      map_url: 'https://maps.app.goo.gl/RpCKMi3SnishDxwL9',
    },
    {
      place_name: 'Alexandra Bridge Lookout',
      type: 'attraction',
      start_time: '16:00',
      map_url: 'https://maps.app.goo.gl/B2FUnvHVrTsjoZgz8',
    },
    { place_name: '라운지 식사 (시간 확인 필요)', type: 'restaurant', start_time: '18:30' },
  ],

  // ... 더 많은 일정들을 추가할 수 있습니다
};

// Firestore에 Plans 일괄 등록 함수
async function seedPlans(tripId, userId) {
  try {
    for (const [day, plans] of Object.entries(plansByDay)) {
      const batch = writeBatch(db);
      
      plans.forEach((planData) => {
        const planRef = doc(collection(db, 'plans'));
        const planWithMetadata = {
          ...planData,
          day: parseInt(day),
          trip_id: tripId,
          user_id: userId, // 추가된 user_id 필드
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        batch.set(planRef, planWithMetadata);
      });
      
      await batch.commit();
      console.log(`✅ Day ${day}: ${plans.length}개 일정 등록 완료`);
    }
    
    console.log('🎉 모든 일정 등록 완료!');
  } catch (error) {
    console.error('❌ 일정 등록 실패:', error);
  }
}

// Trip 생성 함수
async function createTrip(tripId, userId) {
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripData = {
      id: tripId,
      title: 'USA & Canada 여행 2025',
      country: 'USA & Canada',
      start_date: '2025-10-05',
      end_date: '2025-10-25',
      user_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    
    await writeBatch(db).set(tripRef, tripData).commit();
    console.log('✅ Trip 생성 완료:', tripId);
  } catch (error) {
    console.error('❌ Trip 생성 실패:', error);
  }
}

// 실행 함수
async function main() {
  const tripId = 'usa-canada-2025'; // Trip ID
  const userId = 'f3NaO0zcLNWLJ7iSAFdKrEStRDx2'; // User ID
  
  // Trip 먼저 생성
  await createTrip(tripId, userId);
  
  // 그 다음 Plans 생성
  await seedPlans(tripId, userId);
}

// 스크립트 실행
(async () => {
  try {
    await main();
    console.log('스크립트 실행 완료');
    process.exit(0);
  } catch (error) {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  }
})();