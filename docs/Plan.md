
// Firebase v9 (modular) 예시
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---- PlanCard에 맞춘 최소 스키마 ----
// type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'other'
// 필드: place_name, type, start_time, end_time?, map_url?, youtube_link?, photos?, latitude?, longitude?

type PlanType = 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'other';

type Plan = {
  place_name: string;
  type: PlanType;
  start_time: string;    // "HH:MM"
  end_time?: string;     // "HH:MM"
  map_url?: string;
  youtube_link?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
};

// ---- 입력 일정 정규화 결과 ----
// 날짜 포맷은 임의로 2025 기준. 필요시 변경.
const plansByDay: Record<string, Plan[]> = {
  '2025-10-05': [
    { place_name: '집 출발', type: 'transport', start_time: '14:00' },
    { place_name: '발권', type: 'transport', start_time: '14:30' },
    { place_name: '라운지', type: 'restaurant', start_time: '15:00' },
    { place_name: '인천국제공항 T1 출발 (에어캐나다)', type: 'transport', start_time: '19:05' },
    { place_name: '토론토(YYZ) 도착', type: 'transport', start_time: '19:30' },
    { place_name: '렌트카 체크인', type: 'transport', start_time: '20:30' },
    {
      place_name: 'Courtyard by Marriott Toronto Airport (체크인)',
      type: 'hotel',
      start_time: '13:00',
      map_url: 'https://maps.app.goo.gl/uJAmTvYRcpMdoPBt9',
    },
  ],

  '2025-10-06': [
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

  // 10월7일(화) / 3일차가 원문에 없어서 건너뜀

  '2025-10-07': [
    { place_name: '호텔 조식', type: 'restaurant', start_time: '08:00' },
    { place_name: '이동', type: 'transport', start_time: '04:00' },
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

  '2025-10-08': [
    { place_name: '조식', type: 'restaurant', start_time: '07:00' },
    { place_name: '호텔 체크아웃', type: 'hotel', start_time: '08:00' },
    { place_name: '이동: 몽 트렝블랑 (약 2시간)', type: 'transport', start_time: '08:10' },
    {
      place_name: '주차: Le Westin Resort & Spa',
      type: 'transport',
      start_time: '10:00',
      map_url: 'https://maps.app.goo.gl/ye5wiHcR3ZW9iaky8',
    },
    {
      place_name: 'Skyline Luge Mont Tremblant',
      type: 'attraction',
      start_time: '10:00',
      map_url: 'https://maps.app.goo.gl/W2PSFyW42cQCQQ1m9',
    },
    {
      place_name: '점심: La Pizzateria',
      type: 'restaurant',
      start_time: '12:00',
      map_url: 'https://maps.app.goo.gl/zfiMFc8ApNBtfzHR6',
    },
    {
      place_name: 'Panoramic Gondola (Télécabine panoramique)',
      type: 'attraction',
      start_time: '13:30',
      map_url: 'https://maps.app.goo.gl/eNhAUF6kpjf2xRpi9',
    },
    {
      place_name: 'Mont-Tremblant Village',
      type: 'attraction',
      start_time: '14:30',
      map_url: 'https://maps.app.goo.gl/jxAf4LTg2i2iJt286',
    },
    {
      place_name: 'Le Westin Resort & Spa (체크인)',
      type: 'hotel',
      start_time: '16:00',
      map_url: 'https://maps.app.goo.gl/PZC38ep67g8UadV2A',
    },
    {
      place_name: 'Scandinave Spa Mont-Tremblant (성인만)',
      type: 'attraction',
      start_time: '18:00',
      map_url: 'https://maps.app.goo.gl/cZL8Z6nZhT4qAMxt7',
    },
  ],

  '2025-10-09': [
    { place_name: '조식', type: 'restaurant', start_time: '07:00' },
    { place_name: '이동: 몬트리올', type: 'transport', start_time: '09:00' },
    { place_name: '호텔 체크인(미정)', type: 'hotel', start_time: '16:00' },
  ],

  '2025-10-10': [
    { place_name: '조식', type: 'restaurant', start_time: '06:30' },
    { place_name: '이동: 퀘벡 (약 2시간 30분)', type: 'transport', start_time: '07:30' },
    {
      place_name: "Boulangerie artisanale Epi'Fanny | Québec",
      type: 'restaurant',
      start_time: '09:30',
      map_url: 'https://maps.app.goo.gl/C1cSXoow6a2XaLFQ8',
    },
    {
      place_name: 'Montmorency Falls Observation Tower',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/ADwPPzizwHrRoqyz6',
    },
    {
      place_name: 'Parc de la Chute-Montmorency',
      type: 'attraction',
      start_time: '10:00',
      map_url: 'https://maps.app.goo.gl/NqKjgX5mq15iBWoeA',
    },
    {
      place_name: '점심: Restaurant Aucoin de Larue',
      type: 'restaurant',
      start_time: '13:00',
      map_url: 'https://maps.app.goo.gl/Qu1qWgSeu9wiXq1u6',
    },
    {
      place_name: 'Funiculaire du Vieux-Québec',
      type: 'attraction',
      start_time: '14:00',
      map_url: 'https://maps.app.goo.gl/wAmGAUpykjf9PWyi9',
    },
    {
      place_name: 'La Citadelle de Québec',
      type: 'attraction',
      start_time: '15:00',
      map_url: 'https://maps.app.goo.gl/bgvykC9q3Cqp86uMA',
    },
    { place_name: '이동: 몬트리올 (약 2시간 30분)', type: 'transport', start_time: '16:00' },
    { place_name: '라운지', type: 'restaurant', start_time: '17:00' },
  ],

  '2025-10-11': [
    { place_name: '조식', type: 'restaurant', start_time: '07:30' },
    { place_name: '호텔 체크아웃', type: 'hotel', start_time: '08:00' },
    { place_name: '이동 (약 5시간)', type: 'transport', start_time: '08:10' },
    { place_name: '발권', type: 'transport', start_time: '14:30' },
    { place_name: '라운지', type: 'restaurant', start_time: '15:00' },
    { place_name: '토론토(YYZ) 출발 (에어캐나다)', type: 'transport', start_time: '16:30' },
    { place_name: '보스턴(BOS) 도착', type: 'transport', start_time: '18:18' },
    { place_name: '이동 (약 1시간)', type: 'transport', start_time: '19:00' },
    { place_name: '숙소: 악동집', type: 'hotel', start_time: '20:00' },
  ],

  '2025-10-12': [
    { place_name: '아침', type: 'restaurant', start_time: '08:00' },
    { place_name: '여행(자유일정)', type: 'other', start_time: '10:00' },
  ],

  '2025-10-13': [
    { place_name: '아침', type: 'restaurant', start_time: '08:00' },
    { place_name: '여행(자유일정)', type: 'other', start_time: '10:00' },
  ],

  '2025-10-14': [
    { place_name: '숙소 출발', type: 'transport', start_time: '09:00' },
    { place_name: '발권', type: 'transport', start_time: '10:00' },
    { place_name: '보스턴(BOS) 출발 (JetBlue)', type: 'transport', start_time: '10:20' },
    { place_name: '올랜도(MCO) 도착', type: 'transport', start_time: '13:34' },
    {
      place_name: "Marriott's Sabal Palms (체크인)",
      type: 'hotel',
      start_time: '16:00',
      map_url: 'https://maps.app.goo.gl/7j6kTAJvR1SsBtqE7',
    },
  ],

  '2025-10-15': [
    { place_name: '조식', type: 'restaurant', start_time: '08:00' },
    {
      place_name: '유니버설 3일권 (사전 구매 필요, 약 ₩200,000/인)',
      type: 'other',
      start_time: '08:30',
      map_url: 'https://www.universalorlando.com/web/en/us/tickets-packages/park-tickets',
    },
    {
      place_name: 'Universal Studios Florida',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/yESmktTHXXMWiXCi7',
    },
  ],

  '2025-10-16': [
    { place_name: '조식', type: 'restaurant', start_time: '08:00' },
    {
      place_name: 'Universal Epic Universe',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/rDxnqZ35pt8npq9UA',
    },
  ],

  '2025-10-17': [
    { place_name: '조식', type: 'restaurant', start_time: '08:00' },
    {
      place_name: 'Universal Islands of Adventure',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/SE4eCxqDbdtZ6wRn8',
    },
  ],

  '2025-10-18': [
    { place_name: '렌트카 픽업: 올랜도 국제공항', type: 'transport', start_time: '09:00' },
    { place_name: '이동 (약 1시간)', type: 'transport', start_time: '09:15' },
    {
      place_name: 'Kennedy Space Center (2일권, 약 ₩130,000)',
      type: 'attraction',
      start_time: '10:30',
      map_url: 'https://maps.app.goo.gl/rDB472a9Kcofd5cS9',
    },
    {
      place_name: '티켓 구매(KKday)',
      type: 'other',
      start_time: '10:00',
      map_url:
        'https://www.kkday.com/ko/product/22839-kennedy-space-center-ticket-florida?cid=4904&ud1=detail-share&ud2=mobile-web',
    },
  ],

  '2025-10-19': [
    { place_name: '조식', type: 'restaurant', start_time: '08:00' },
    { place_name: '이동 (약 1시간)', type: 'transport', start_time: '09:00' },
    { place_name: 'Kennedy Space Center (2일차)', type: 'attraction', start_time: '10:00' },
    { place_name: '이동 (약 1시간)', type: 'transport', start_time: '17:00' },
  ],

  '2025-10-20': [
    {
      place_name: '월트 디즈니 월드 4일권 (사전 예약 필요, 약 ₩500,000/인)',
      type: 'other',
      start_time: '08:00',
      map_url: 'https://disneyworld.disney.go.com/admission/tickets/',
    },
    {
      place_name: 'Magic Kingdom Park',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/pzmbzC4TtyjyZqjx9',
    },
  ],

  '2025-10-21': [
    { place_name: '조식', type: 'restaurant', start_time: '07:00' },
    {
      place_name: 'Disney’s Animal Kingdom',
      type: 'attraction',
      start_time: '08:00',
      map_url: 'https://maps.app.goo.gl/3PKauB6j87dd1h2LA',
    },
  ],

  '2025-10-22': [
    { place_name: '조식', type: 'restaurant', start_time: '08:00' },
    {
      place_name: 'Disney’s Hollywood Studios',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/zMrzK5S1w4qVQhio8',
    },
  ],

  '2025-10-23': [
    { place_name: '조식', type: 'restaurant', start_time: '08:00' },
    {
      place_name: 'EPCOT',
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/htKFHH6dwdggSzB47',
    },
  ],

  '2025-10-24': [
    { place_name: '공항 이동(대성)', type: 'transport', start_time: '04:30' },
    { place_name: '발권(대성)', type: 'transport', start_time: '05:00' },
    {
      place_name: '올랜도(MCO) 출발 (에어캐나다)',
      type: 'transport',
      start_time: '07:00',
      map_url: 'https://maps.app.goo.gl/zuobA1cdTRVQq3C37',
    },
    { place_name: '호텔 체크아웃(악동)', type: 'hotel', start_time: '08:00' },
    { place_name: '공항 이동(악동)', type: 'transport', start_time: '08:30' },
    { place_name: '렌트카 체크아웃(악동)', type: 'transport', start_time: '09:00' },
    { place_name: '올랜도(MCO) 출발 (델타?)', type: 'transport', start_time: '11:00' },
    { place_name: '보스턴(BOS) 도착(악동)', type: 'transport', start_time: '14:02' },
  ],

  '2025-10-25': [
    { place_name: '인천(ICN) 도착', type: 'transport', start_time: '17:30' },
  ],
};

// ---- Firestore에 일괄 등록 ----
// 경로 예: /trips/{tripId}/days/{YYYY-MM-DD}/plans/{autoId}
export async function seedPlans(tripId: string) {
  for (const [day, plans] of Object.entries(plansByDay)) {
    const batch = writeBatch(db);
    const dayCol = collection(db, 'trips', tripId, 'days', day, 'plans');
    plans.forEach((_plan) => {
      const ref = doc(dayCol);
      batch.set(ref, _plan);
    });
    await batch.commit();
    console.log(`✅ ${day} / ${plans.length}개 등록 완료`);
  }
}

// 사용 예시
// await seedPlans('usa-2025-fall');
