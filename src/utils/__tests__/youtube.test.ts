import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../youtube';

describe('YouTube 유틸리티 함수', () => {
  describe('getYouTubeEmbedUrl', () => {
    it('일반 YouTube URL을 임베드 URL로 변환해야 한다', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const embedUrl = getYouTubeEmbedUrl(url);
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('youtu.be 단축 URL을 임베드 URL로 변환해야 한다', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const embedUrl = getYouTubeEmbedUrl(url);
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('YouTube 임베드 URL을 그대로 반환해야 한다', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const embedUrl = getYouTubeEmbedUrl(url);
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('추가 쿼리 파라미터가 있는 URL을 처리해야 한다', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxx&index=1';
      const embedUrl = getYouTubeEmbedUrl(url);
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('시간 스탬프가 있는 URL을 처리해야 한다', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
      const embedUrl = getYouTubeEmbedUrl(url);
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=42');
    });

    it('유효하지 않은 URL에 대해 null을 반환해야 한다', () => {
      // console.error 모킹
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const invalidUrls = [
        'https://vimeo.com/123456',
        'https://www.google.com',
        'not-a-url',
        '',
        'https://youtube.com/invalid'
      ];

      invalidUrls.forEach(url => {
        expect(getYouTubeEmbedUrl(url)).toBeNull();
      });
      
      consoleSpy.mockRestore();
    });

    it('이미 임베드 URL인 경우 그대로 반환해야 한다', () => {
      const embedUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const result = getYouTubeEmbedUrl(embedUrl);
      
      expect(result).toBe(embedUrl);
    });
  });

  describe('getYouTubeThumbnail', () => {
    const videoId = 'dQw4w9WgXcQ';
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    it('기본 품질 썸네일 URL을 반환해야 한다', () => {
      const thumbnailUrl = getYouTubeThumbnail(url);
      
      expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/mediumdefault.jpg`);
    });

    it('고품질 썸네일 URL을 반환해야 한다', () => {
      const thumbnailUrl = getYouTubeThumbnail(url, 'high');
      
      expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/highdefault.jpg`);
    });

    it('최고품질 썸네일 URL을 반환해야 한다', () => {
      const thumbnailUrl = getYouTubeThumbnail(url, 'maxres');
      
      expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    });

    it('저품질 썸네일 URL을 반환해야 한다', () => {
      const thumbnailUrl = getYouTubeThumbnail(url, 'default');
      
      expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/defaultdefault.jpg`);
    });

    it('youtu.be URL에서도 썸네일을 생성해야 한다', () => {
      const shortUrl = 'https://youtu.be/dQw4w9WgXcQ';
      const thumbnailUrl = getYouTubeThumbnail(shortUrl, 'high');
      
      expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/highdefault.jpg`);
    });

    it('유효하지 않은 URL에 대해 null을 반환해야 한다', () => {
      // console.error 모킹
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const invalidUrls = [
        'https://vimeo.com/123456',
        'https://www.google.com',
        'not-a-url',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(getYouTubeThumbnail(url)).toBeNull();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('비디오 ID 추출', () => {
    it('다양한 YouTube URL 형식에서 올바른 비디오 ID를 추출해야 한다', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://www.youtube.com/v/dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ'
        }
      ];

      testCases.forEach(({ url, expectedId }) => {
        const embedUrl = getYouTubeEmbedUrl(url);
        expect(embedUrl).toContain(expectedId);
        
        const thumbnailUrl = getYouTubeThumbnail(url);
        expect(thumbnailUrl).toContain(expectedId);
      });
    });

    it('11자리 비디오 ID 형식을 검증해야 한다', () => {
      // YouTube 비디오 ID는 일반적으로 11자리
      const validIds = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', 'MejbOFk7H6c'];
      
      validIds.forEach(id => {
        const url = `https://www.youtube.com/watch?v=${id}`;
        const embedUrl = getYouTubeEmbedUrl(url);
        const thumbnailUrl = getYouTubeThumbnail(url);
        
        expect(embedUrl).toContain(id);
        expect(thumbnailUrl).toContain(id);
      });
    });
  });

  describe('에러 처리', () => {
    beforeEach(() => {
      // console.error를 모킹하여 에러 출력 방지
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('빈 문자열 입력 시 적절히 처리해야 한다', () => {
      expect(getYouTubeEmbedUrl('')).toBeNull();
      expect(getYouTubeThumbnail('')).toBeNull();
    });

    it('null/undefined 입력 시 적절히 처리해야 한다', () => {
      expect(getYouTubeEmbedUrl(null as any)).toBeNull();
      expect(getYouTubeEmbedUrl(undefined as any)).toBeNull();
      expect(getYouTubeThumbnail(null as any)).toBeNull();
      expect(getYouTubeThumbnail(undefined as any)).toBeNull();
    });

    it('잘못된 형식의 URL에 대해 적절히 처리해야 한다', () => {
      const malformedUrls = [
        'youtube.com/watch?v=', // 비디오 ID 없음
        'https://youtube.com/watch', // v 파라미터 없음
        'https://youtu.be/', // 비디오 ID 없음
        'youtube', // 프로토콜 없음
      ];

      malformedUrls.forEach(url => {
        expect(getYouTubeEmbedUrl(url)).toBeNull();
        expect(getYouTubeThumbnail(url)).toBeNull();
      });
    });
  });
});