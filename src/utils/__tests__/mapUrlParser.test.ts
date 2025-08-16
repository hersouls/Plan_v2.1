import { MapUrlParser, parseMapUrl } from '../mapUrlParser';

describe('MapUrlParser', () => {
  describe('Google Maps', () => {
    test('should parse Google Maps @ format', () => {
      const url = 'https://www.google.com/maps/@37.5665,126.9780,15z';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
      expect(result.source).toBe('Google Maps');
    });

    test('should parse Google Maps q= format', () => {
      const url = 'https://maps.google.com/?q=37.5665,126.9780';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
    });
  });

  describe('Naver Maps', () => {
    test('should parse Naver Maps c= format', () => {
      const url = 'https://map.naver.com/v5/?c=126.9780,37.5665,15';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
      expect(result.source).toBe('Naver Map');
    });
  });

  describe('Kakao Maps', () => {
    test('should parse Kakao Maps urlX/urlY format', () => {
      const url = 'https://map.kakao.com/?urlX=126.9780&urlY=37.5665';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
      expect(result.source).toBe('Kakao Map');
    });
  });

  describe('Apple Maps', () => {
    test('should parse Apple Maps ll= format', () => {
      const url = 'https://maps.apple.com/?ll=37.5665,126.9780';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
      expect(result.source).toBe('Apple Maps');
    });
  });

  describe('Generic coordinates', () => {
    test('should parse generic lat,lng format', () => {
      const url = 'https://example.com/location?lat=37.5665&lng=126.9780';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
      expect(result.source).toBe('Generic');
    });

    test('should parse latitude/longitude format', () => {
      const url = 'https://example.com?latitude=37.5665&longitude=126.9780';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBe(37.5665);
      expect(result.coordinates?.longitude).toBe(126.9780);
    });
  });

  describe('Invalid inputs', () => {
    test('should handle empty string', () => {
      const result = parseMapUrl('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL');
    });

    test('should handle invalid coordinates', () => {
      const result = parseMapUrl('https://example.com?lat=999&lng=999');
      expect(result.success).toBe(false);
    });

    test('should handle unsupported format', () => {
      const result = parseMapUrl('https://example.com');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported map URL format');
    });
  });

  describe('Utility functions', () => {
    test('should format coordinates correctly', () => {
      const coords = { latitude: 37.566535, longitude: 126.977969 };
      const formatted = MapUrlParser.formatCoordinates(coords);
      
      expect(formatted.lat).toBe('37.566535');
      expect(formatted.lng).toBe('126.977969');
    });

    test('should calculate distance between coordinates', () => {
      const coord1 = { latitude: 37.5665, longitude: 126.9780 }; // Seoul
      const coord2 = { latitude: 35.6762, longitude: 139.6503 }; // Tokyo
      
      const distance = MapUrlParser.calculateDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(1000); // Should be > 1000km
      expect(distance).toBeLessThan(1500); // Should be < 1500km
    });

    test('should convert coordinates to Google Maps URL', () => {
      const coords = { latitude: 37.5665, longitude: 126.9780 };
      const url = MapUrlParser.coordinatesToGoogleMapsUrl(coords);
      
      expect(url).toBe('https://maps.google.com/?q=37.5665,126.978');
    });

    test('should convert coordinates to Naver Map URL', () => {
      const coords = { latitude: 37.5665, longitude: 126.9780 };
      const url = MapUrlParser.coordinatesToNaverMapUrl(coords);
      
      expect(url).toBe('https://map.naver.com/v5/?c=126.978,37.5665,15');
    });
  });

  describe('Real world examples', () => {
    test('should parse Seoul City Hall Google Maps URL', () => {
      const url = 'https://www.google.com/maps/place/Seoul+City+Hall/@37.5663,126.9779,17z';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBeCloseTo(37.5663, 3);
      expect(result.coordinates?.longitude).toBeCloseTo(126.9779, 3);
    });

    test('should parse Naver Map search result URL', () => {
      const url = 'https://map.naver.com/v5/search/서울시청?c=126.9779,37.5663,15';
      const result = parseMapUrl(url);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.latitude).toBeCloseTo(37.5663, 3);
      expect(result.coordinates?.longitude).toBeCloseTo(126.9779, 3);
    });
  });
});