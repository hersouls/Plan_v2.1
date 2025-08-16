// 유튜브 URL을 임베드 URL로 변환하는 함수
export const getYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // 다양한 유튜브 URL 형식 지원
    let videoId: string | null = null;
    
    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    }
    // youtube.com/watch?v=VIDEO_ID
    else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      }
      // youtube.com/embed/VIDEO_ID
      else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.slice(7);
      }
      // youtube.com/v/VIDEO_ID
      else if (urlObj.pathname.startsWith('/v/')) {
        videoId = urlObj.pathname.slice(3);
      }
    }
    
    if (videoId) {
      // 시간 파라미터 처리 (t=123s 또는 start=123)
      const timeParam = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
      let startTime = '';
      
      if (timeParam) {
        // "123s" 형식이거나 숫자만 있는 경우
        const seconds = parseInt(timeParam.replace(/[^\d]/g, ''));
        if (!isNaN(seconds)) {
          startTime = `?start=${seconds}`;
        }
      }
      
      return `https://www.youtube.com/embed/${videoId}${startTime}`;
    }
    
    return null;
  } catch (error) {
    console.error('Invalid YouTube URL:', error);
    return null;
  }
};

// 유튜브 비디오 ID 추출
export const getYouTubeVideoId = (url: string): string | null => {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (embedUrl) {
    const match = embedUrl.match(/\/embed\/([^?]+)/);
    return match ? match[1] : null;
  }
  return null;
};

// 유튜브 썸네일 URL 생성
export const getYouTubeThumbnail = (url: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
  }
  return null;
};