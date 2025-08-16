// 웹 앱에서 실행할 수 있는 seed 데이터 생성 유틸리티
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plan } from '../types/plan';

// Plan 데이터 (일부만 포함)
const plansByDay: Record<number, Omit<Plan, 'id' | 'trip_id' | 'created_at' | 'updated_at'>[]> = {
  1: [ // Day 1: 2025-10-05
    { day: 1, place_name: '집 출발', type: 'transport', start_time: '14:00' },
    { day: 1, place_name: '발권', type: 'transport', start_time: '14:30' },
    { day: 1, place_name: '라운지', type: 'restaurant', start_time: '15:00' },
    { day: 1, place_name: '인천국제공항 T1 출발 (에어캐나다)', type: 'transport', start_time: '19:05' },
    { day: 1, place_name: '토론토(YYZ) 도착', type: 'transport', start_time: '19:30' },
    { day: 1, place_name: '렌트카 체크인', type: 'transport', start_time: '20:30' },
    {
      day: 1,
      place_name: 'Courtyard by Marriott Toronto Airport (체크인)',
      type: 'hotel',
      start_time: '21:00',
      map_url: 'https://maps.app.goo.gl/uJAmTvYRcpMdoPBt9',
    },
  ],

  2: [ // Day 2: 2025-10-06
    { day: 2, place_name: '호텔 조식', type: 'restaurant', start_time: '07:00' },
    { day: 2, place_name: '호텔 체크아웃', type: 'hotel', start_time: '08:00' },
    {
      day: 2,
      place_name: 'Toronto CityPASS 구매 (₩150,000/인)',
      type: 'other',
      start_time: '08:10',
      map_url: 'https://www.citypass.com/toronto?p=toronto&s=maps&lang=ko-KR',
    },
    {
      day: 2,
      place_name: 'South Parking - Metro Toronto Convention Centre (주차)',
      type: 'transport',
      start_time: '08:40',
      map_url: 'https://maps.app.goo.gl/Bb7igc4VZq8duL8a7',
    },
    {
      day: 2,
      place_name: "Ripley's Aquarium of Canada (시티패스)",
      type: 'attraction',
      start_time: '09:00',
      map_url: 'https://maps.app.goo.gl/2mWYgZokwHqb35jz6',
    },
    {
      day: 2,
      place_name: 'CN Tower (시티패스)',
      type: 'attraction',
      start_time: '11:00',
      map_url: 'https://maps.app.goo.gl/ej5j12E4HEM1xcY1A',
    },
    {
      day: 2,
      place_name: '점심: The Rec Room Roundhouse',
      type: 'restaurant',
      start_time: '12:30',
      map_url: 'https://maps.app.goo.gl/6FoLZZ2bRJb7KGa86',
    },
    {
      day: 2,
      place_name: 'City Cruises (시티패스)',
      type: 'attraction',
      start_time: '14:00',
      map_url: 'https://maps.app.goo.gl/rsKKU2pej5VtfwxB7',
    },
    {
      day: 2,
      place_name: 'Casa Loma (시티패스)',
      type: 'attraction',
      start_time: '16:00',
      map_url: 'https://maps.app.goo.gl/uffbqtHYXAdxgDXy6',
    },
    {
      day: 2,
      place_name: 'Toronto Marriott Markham (체크인)',
      type: 'hotel',
      start_time: '18:00',
      map_url: 'https://maps.app.goo.gl/CJpgAaXoB8A9R1jM6',
    },
    { day: 2, place_name: '클럽 라운지 (시간 확인 필요)', type: 'restaurant', start_time: '19:00' },
  ],

  3: [ // Day 3: 2025-10-07
    { day: 3, place_name: '호텔 조식', type: 'restaurant', start_time: '08:00' },
    { day: 3, place_name: '이동: 오타와 (약 4시간)', type: 'transport', start_time: '08:30' },
    {
      day: 3,
      place_name: 'Parliament Hill (캐나다 연방의회)',
      type: 'attraction',
      start_time: '10:00',
      map_url: 'https://maps.app.goo.gl/PXcTRYz7FTbH9B3p7',
    },
    {
      day: 3,
      place_name: 'The National War Memorial',
      type: 'attraction',
      start_time: '10:40',
      map_url: 'https://maps.app.goo.gl/NEJruaxvs6kkT99i9',
    },
    {
      day: 3,
      place_name: '점심: JOEY Rideau',
      type: 'restaurant',
      start_time: '12:00',
      map_url: 'https://maps.app.goo.gl/6vdh27dWMewd6dhg8',
    },
    {
      day: 3,
      place_name: 'Ottawa Sign, ByWard Market',
      type: 'attraction',
      start_time: '13:30',
      map_url: 'https://maps.app.goo.gl/UDdt7pTqxSdymaoH9',
    },
    {
      day: 3,
      place_name: 'Notre Dame Cathedral Basilica',
      type: 'attraction',
      start_time: '14:00',
      map_url: 'https://maps.app.goo.gl/fFbQW7WBA4LoMFbu5',
    },
    {
      day: 3,
      place_name: 'National Gallery of Canada',
      type: 'attraction',
      start_time: '15:00',
      map_url: 'https://maps.app.goo.gl/RpCKMi3SnishDxwL9',
    },
    {
      day: 3,
      place_name: 'Alexandra Bridge Lookout',
      type: 'attraction',
      start_time: '16:00',
      map_url: 'https://maps.app.goo.gl/B2FUnvHVrTsjoZgz8',
    },
    { day: 3, place_name: '라운지 식사 (시간 확인 필요)', type: 'restaurant', start_time: '18:30' },
  ],
};

export async function seedPlansForTrip(tripId: string) {
  try {
    for (const [day, plans] of Object.entries(plansByDay)) {
      const batch = writeBatch(db);
      
      plans.forEach((planData) => {
        const planRef = doc(collection(db, 'plans'));
        const planWithMetadata = {
          ...planData,
          id: planRef.id,
          trip_id: tripId,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        batch.set(planRef, planWithMetadata);
      });
      
      await batch.commit();
      console.log(`✅ Day ${day}: ${plans.length}개 일정 등록 완료`);
    }
    
    console.log('🎉 모든 일정 등록 완료!');
    return true;
  } catch (error) {
    console.error('❌ 일정 등록 실패:', error);
    return false;
  }
}