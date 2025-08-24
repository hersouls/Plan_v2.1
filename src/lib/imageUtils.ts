import logger from '@/lib/logger';
/**
 * 이미지 리사이징 및 압축 유틸리티
 */

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * 이미지를 캔버스에 그려서 리사이징
 */
export function resizeImage(
  file: File,
  options: ImageResizeOptions = {}
): Promise<File> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      format = 'jpeg',
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 원본 이미지 크기
      const { width: originalWidth, height: originalHeight } = img;

      // 새로운 크기 계산 (비율 유지)
      const { width: newWidth, height: newHeight } = calculateNewSize(
        originalWidth,
        originalHeight,
        maxWidth,
        maxHeight
      );

      // 캔버스 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        blob => {
          if (blob) {
            // 새로운 파일 생성
            const resizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('이미지 리사이징에 실패했습니다.'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    // 파일을 URL로 변환하여 이미지 로드
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 새로운 크기 계산 (비율 유지)
 */
function calculateNewSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width: newWidth, height: newHeight } = {
    width: originalWidth,
    height: originalHeight,
  };

  // 너비가 최대 너비를 초과하는 경우
  if (newWidth > maxWidth) {
    newHeight = (newHeight * maxWidth) / newWidth;
    newWidth = maxWidth;
  }

  // 높이가 최대 높이를 초과하는 경우
  if (newHeight > maxHeight) {
    newWidth = (newWidth * maxHeight) / newHeight;
    newHeight = maxHeight;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * 파일 크기를 MB 단위로 변환
 */
export function getFileSizeInMB(file: File): number {
  return file.size / (1024 * 1024);
}

/**
 * 이미지 파일의 크기와 해상도를 확인
 */
export function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  sizeInMB: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        sizeInMB: getFileSizeInMB(file),
      });
    };
    img.onerror = () => {
      reject(new Error('이미지 정보를 가져올 수 없습니다.'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 아바타 이미지 최적화 (파일 용량 제한 없음, 자동 리사이징)
 */
export async function optimizeAvatarImage(file: File): Promise<File> {
  const fileSizeMB = getFileSizeInMB(file);

  // 파일 크기 제한 없이 원본 반환
  logger.info(
    'image',
    `아바타 이미지 크기: ${fileSizeMB.toFixed(2)}MB (용량 제한 없음)`
  );

  // 파일 크기가 적절한 경우 원본 반환
  return file;
}

/**
 * 일반 이미지 최적화 (100MB 제한)
 */
export async function optimizeImage(file: File): Promise<File> {
  const MAX_SIZE_MB = 100;
  const MAX_DIMENSION = 4096;
  const QUALITY = 0.8;

  const fileSizeMB = getFileSizeInMB(file);

  if (fileSizeMB > MAX_SIZE_MB) {
    logger.warn(
      'image',
      `이미지 크기가 ${fileSizeMB.toFixed(
        2
      )}MB로 100MB를 초과합니다. 자동으로 크기를 조정합니다.`
    );

    const options: ImageResizeOptions = {
      maxWidth: MAX_DIMENSION,
      maxHeight: MAX_DIMENSION,
      quality: QUALITY,
      format: 'jpeg',
    };

    try {
      const resizedFile = await resizeImage(file, options);
      const newSize = getFileSizeInMB(resizedFile);
      logger.info('image', `리사이징 후 크기: ${newSize.toFixed(2)}MB`);
      return resizedFile;
    } catch (error) {
      logger.error('image', '이미지 리사이징 실패', error);
      throw new Error('이미지 크기 조정에 실패했습니다.');
    }
  }

  return file;
}
