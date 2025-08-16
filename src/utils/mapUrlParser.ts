/**
 * 지도 URL에서 위도, 경도를 추출하는 유틸리티 함수들
 * 
 * 지원하는 지도 서비스:
 * - Google Maps
 * - Naver 지도  
 * - Kakao Map
 * - Apple Maps
 * - 기타 표준 좌표 형식
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParseResult {
  success: boolean;
  coordinates?: Coordinates;
  error?: string;
  source?: string;
}

export class MapUrlParser {
  /**
   * 다양한 지도 URL에서 위도, 경도를 추출
   */
  static parseMapUrl(url: string): ParseResult {
    if (!url || typeof url !== 'string') {
      return { success: false, error: 'Invalid URL' };
    }

    try {
      const cleanUrl = url.trim();
      
      // 도메인별로 우선순위를 두어 파싱 (더 구체적인 것부터)
      
      // Apple Maps 파싱 (maps.apple.com 우선)
      if (cleanUrl.includes('maps.apple.com')) {
        const appleResult = this.parseAppleMaps(cleanUrl);
        if (appleResult.success) return appleResult;
      }

      // Naver 지도 파싱 (naver.com 우선)
      if (cleanUrl.includes('naver.com')) {
        const naverResult = this.parseNaverMap(cleanUrl);
        if (naverResult.success) return naverResult;
      }

      // Kakao Map 파싱 (kakao.com 우선)
      if (cleanUrl.includes('kakao.com')) {
        const kakaoResult = this.parseKakaoMap(cleanUrl);
        if (kakaoResult.success) return kakaoResult;
      }

      // Google Maps 파싱 (google.com 또는 goo.gl 우선)
      if (cleanUrl.includes('google.com') || cleanUrl.includes('goo.gl')) {
        const googleResult = this.parseGoogleMaps(cleanUrl);
        if (googleResult.success) return googleResult;
      }

      // 도메인이 일치하지 않는 경우 순서대로 시도
      const googleResult = this.parseGoogleMaps(cleanUrl);
      if (googleResult.success) return googleResult;

      const naverResult = this.parseNaverMap(cleanUrl);
      if (naverResult.success) return naverResult;

      const kakaoResult = this.parseKakaoMap(cleanUrl);
      if (kakaoResult.success) return kakaoResult;

      const appleResult = this.parseAppleMaps(cleanUrl);
      if (appleResult.success) return appleResult;

      // 일반적인 좌표 형식 파싱
      const genericResult = this.parseGenericCoordinates(cleanUrl);
      if (genericResult.success) return genericResult;

      return { success: false, error: 'Unsupported map URL format' };
    } catch (error) {
      return { success: false, error: `Parsing failed: ${error}` };
    }
  }

  /**
   * Google Maps URL 파싱
   * 지원 형식:
   * - https://maps.google.com/?q=37.123,127.456
   * - https://www.google.com/maps/@37.123,127.456,15z
   * - https://maps.google.com/maps?q=37.123,127.456
   * - https://goo.gl/maps/xxx (단축 URL은 제한적 지원)
   */
  private static parseGoogleMaps(url: string): ParseResult {
    const patterns = [
      // @lat,lng,zoom 형식
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // q=lat,lng 형식
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // ll=lat,lng 형식
      /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // center=lat,lng 형식
      /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        if (this.isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { latitude: lat, longitude: lng },
            source: 'Google Maps'
          };
        }
      }
    }

    return { success: false, error: 'Google Maps coordinates not found' };
  }

  /**
   * Naver 지도 URL 파싱
   * 지원 형식:
   * - https://map.naver.com/v5/search/주소?c=lng,lat,zoom
   * - https://map.naver.com/v5/?c=lng,lat,zoom
   */
  private static parseNaverMap(url: string): ParseResult {
    const patterns = [
      // c=lng,lat,zoom 형식 (Naver는 경도가 먼저)
      /[?&]c=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // lng,lat 형식
      /naver\.com.*?(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        
        if (this.isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { latitude: lat, longitude: lng },
            source: 'Naver Map'
          };
        }
      }
    }

    return { success: false, error: 'Naver Map coordinates not found' };
  }

  /**
   * Kakao Map URL 파싱
   * 지원 형식:
   * - https://map.kakao.com/?q=위치&urlX=lng&urlY=lat
   * - https://map.kakao.com/link/map/위치,lat,lng
   */
  private static parseKakaoMap(url: string): ParseResult {
    const patterns = [
      // urlX=lng&urlY=lat 형식
      /[?&]urlX=(-?\d+\.?\d*).*?[?&]urlY=(-?\d+\.?\d*)/,
      // /map/name,lat,lng 형식
      /\/map\/[^,]*,(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let lat: number, lng: number;
        
        if (pattern.source.includes('urlX')) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        } else {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
        
        if (this.isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { latitude: lat, longitude: lng },
            source: 'Kakao Map'
          };
        }
      }
    }

    return { success: false, error: 'Kakao Map coordinates not found' };
  }

  /**
   * Apple Maps URL 파싱
   * 지원 형식:
   * - https://maps.apple.com/?ll=lat,lng
   * - https://maps.apple.com/?q=lat,lng
   */
  private static parseAppleMaps(url: string): ParseResult {
    const patterns = [
      // ll=lat,lng 형식
      /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // q=lat,lng 형식
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        if (this.isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { latitude: lat, longitude: lng },
            source: 'Apple Maps'
          };
        }
      }
    }

    return { success: false, error: 'Apple Maps coordinates not found' };
  }

  /**
   * 일반적인 좌표 형식 파싱
   * 지원 형식:
   * - lat,lng
   * - latitude=lat&longitude=lng
   * - lat=lat&lng=lng
   */
  private static parseGenericCoordinates(url: string): ParseResult {
    const patterns = [
      // latitude=lat&longitude=lng 형식
      /latitude=(-?\d+\.?\d*).*?longitude=(-?\d+\.?\d*)/,
      // lat=lat&lng=lng 형식  
      /lat=(-?\d+\.?\d*).*?lng=(-?\d+\.?\d*)/,
      // 단순 lat,lng 형식 (URL에서)
      /(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        if (this.isValidCoordinate(lat, lng)) {
          return {
            success: true,
            coordinates: { latitude: lat, longitude: lng },
            source: 'Generic'
          };
        }
      }
    }

    return { success: false, error: 'Generic coordinates not found' };
  }

  /**
   * 위도, 경도 유효성 검증
   */
  private static isValidCoordinate(lat: number, lng: number): boolean {
    return (
      !isNaN(lat) && 
      !isNaN(lng) && 
      lat >= -90 && 
      lat <= 90 && 
      lng >= -180 && 
      lng <= 180
    );
  }

  /**
   * 좌표를 Google Maps URL로 변환
   */
  static coordinatesToGoogleMapsUrl(coordinates: Coordinates): string {
    const { latitude, longitude } = coordinates;
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  /**
   * 좌표를 Naver 지도 URL로 변환
   */
  static coordinatesToNaverMapUrl(coordinates: Coordinates): string {
    const { latitude, longitude } = coordinates;
    return `https://map.naver.com/v5/?c=${longitude},${latitude},15`;
  }

  /**
   * 좌표 포맷팅 (소수점 6자리)
   */
  static formatCoordinates(coordinates: Coordinates): { lat: string; lng: string } {
    return {
      lat: coordinates.latitude.toFixed(6),
      lng: coordinates.longitude.toFixed(6)
    };
  }

  /**
   * 두 좌표 간의 거리 계산 (km)
   */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * 편의 함수들
 */
export const parseMapUrl = (url: string) => MapUrlParser.parseMapUrl(url);
export const coordinatesToGoogleMaps = (coordinates: Coordinates) => 
  MapUrlParser.coordinatesToGoogleMapsUrl(coordinates);
export const coordinatesToNaverMap = (coordinates: Coordinates) => 
  MapUrlParser.coordinatesToNaverMapUrl(coordinates);
export const formatCoordinates = (coordinates: Coordinates) => 
  MapUrlParser.formatCoordinates(coordinates);