import { getAuth } from 'firebase/auth';
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  StorageReference,
  uploadBytesResumable,
} from 'firebase/storage';
import { FileAttachment, FileUploadProgress } from '../types/task';
import { storage } from './firebase';
import { getFileSizeInMB, optimizeAvatarImage } from './imageUtils';

// 간단한 파일 업로드 함수
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ storageUrl: string; downloadUrl: string }> {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('사용자가 인증되지 않았습니다.');
  }

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      error => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            storageUrl: path,
            downloadUrl: downloadURL,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * 아바타 이미지 업로드 전용 함수
 */
export async function uploadAvatarImage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ storageUrl: string; downloadUrl: string }> {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('사용자가 인증되지 않았습니다.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }

  // 파일 확장자 추출
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
    throw new Error(
      '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)'
    );
  }

  // 이미지 최적화 (파일 용량 제한 없음)
  let optimizedFile = file;
  const originalSizeMB = getFileSizeInMB(file);

  try {
    console.log(
      `원본 이미지 크기: ${originalSizeMB.toFixed(2)}MB (용량 제한 없음)`
    );
    optimizedFile = await optimizeAvatarImage(file);
    const optimizedSizeMB = getFileSizeInMB(optimizedFile);

    if (originalSizeMB !== optimizedSizeMB) {
      console.log(
        `이미지 최적화 완료: ${originalSizeMB.toFixed(
          2
        )}MB → ${optimizedSizeMB.toFixed(2)}MB`
      );
    }
  } catch (error) {
    console.error('이미지 최적화 실패:', error);
    throw new Error('이미지 처리에 실패했습니다.');
  }

  // 아바타 파일 경로 생성
  const timestamp = Date.now();
  const fileName = `avatar_${timestamp}.${fileExtension}`;
  const avatarPath = `users/${userId}/profile/${fileName}`;

  const storageRef = ref(storage, avatarPath);
  const uploadTask = uploadBytesResumable(storageRef, optimizedFile);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      error => {
        console.error('Avatar upload error:', error);
        reject(new Error(getAvatarUploadErrorMessage(error)));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            storageUrl: avatarPath,
            downloadUrl: downloadURL,
          });
        } catch (error) {
          reject(
            new Error('아바타 업로드 완료 후 URL을 가져오는데 실패했습니다.')
          );
        }
      }
    );
  });
}

/**
 * 아바타 이미지 삭제
 */
export async function deleteAvatarImage(
  userId: string,
  storageUrl: string
): Promise<void> {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('사용자가 인증되지 않았습니다.');
  }

  try {
    const storageRef = ref(storage, storageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Avatar deletion error:', error);
    throw new Error('아바타 삭제에 실패했습니다.');
  }
}

/**
 * 아바타 업로드 에러 메시지 변환
 */
function getAvatarUploadErrorMessage(error: any): string {
  if (error.code === 'storage/unauthorized') {
    return '아바타 업로드 권한이 없습니다.';
  } else if (error.code === 'storage/canceled') {
    return '아바타 업로드가 취소되었습니다.';
  } else if (error.code === 'storage/unknown') {
    return '알 수 없는 오류가 발생했습니다.';
  } else if (error.code === 'storage/quota-exceeded') {
    return '저장 공간이 부족합니다.';
  } else if (error.code === 'storage/unauthenticated') {
    return '인증이 필요합니다.';
  } else if (error.code === 'storage/retry-limit-exceeded') {
    return '업로드 재시도 횟수를 초과했습니다.';
  } else if (error.code === 'storage/invalid-checksum') {
    return '파일이 손상되었습니다.';
  } else if (error.code === 'storage/cannot-slice-blob') {
    return '파일을 처리할 수 없습니다.';
  } else if (error.code === 'storage/server-file-wrong-size') {
    return '서버 파일 크기가 일치하지 않습니다.';
  }

  console.error('Avatar upload error:', error);
  return error.message || '아바타 업로드 중 오류가 발생했습니다.';
}

export interface UploadOptions {
  onProgress?: (progress: FileUploadProgress) => void;
  onComplete?: (fileAttachment: FileAttachment) => void;
  onError?: (error: string) => void;
}

export class StorageService {
  private static readonly MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER; // 파일 용량 제한 없음
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  /**
   * 파일 업로드
   */
  static async uploadFile(
    file: File,
    taskId: string,
    commentId?: string,
    options?: UploadOptions
  ): Promise<FileAttachment> {
    try {
      // 인증 상태 확인
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error(
          '사용자가 인증되지 않았습니다. 로그인 후 다시 시도해주세요.'
        );
      }

      console.log('현재 인증된 사용자:', currentUser.uid);
      console.log('인증 토큰 확인 중...');

      // 토큰 갱신 시도
      try {
        await currentUser.getIdToken(true);
        console.log('토큰 갱신 완료');
      } catch (tokenError) {
        console.error('토큰 갱신 실패:', tokenError);
        throw new Error('인증 토큰이 만료되었습니다. 다시 로그인해주세요.');
      }

      // 파일 유효성 검사
      this.validateFile(file);

      // 파일 경로 생성
      const fileId = this.generateFileId();
      const filePath = commentId
        ? `tasks/${taskId}/comments/${commentId}/files/${fileId}_${file.name}`
        : `tasks/${taskId}/files/${fileId}_${file.name}`;

      const storageRef = ref(storage, filePath);

      // 업로드 시작
      const uploadTask = uploadBytesResumable(storageRef, file);

      // 진행률 모니터링
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options?.onProgress?.({
            fileId,
            fileName: file.name,
            progress,
            status: 'uploading',
          });
        },
        error => {
          console.error('Upload error details:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error serverResponse:', error.serverResponse);

          const errorMessage = this.getErrorMessage(error);
          options?.onError?.(errorMessage);
          options?.onProgress?.({
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: errorMessage,
          });

          // 에러 발생 시 업로드 작업 중단
          throw new Error(errorMessage);
        },
        async () => {
          try {
            // 다운로드 URL 가져오기
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // 이미지인 경우 썸네일 생성
            let thumbnailURL: string | undefined;
            let width: number | undefined;
            let height: number | undefined;

            if (this.isImage(file.type)) {
              const thumbnailRef = ref(
                storage,
                `${filePath.replace(/\.[^/.]+$/, '')}_thumb.jpg`
              );
              // 썸네일 생성 로직은 별도로 구현 필요
              // thumbnailURL = await this.generateThumbnail(file, thumbnailRef);
            }

            const fileAttachment: FileAttachment = {
              id: fileId,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              storageUrl: filePath,
              downloadUrl: downloadURL,
              uploadedBy: currentUser?.uid || 'unknown-user',
              uploadedAt: new Date() as any, // Timestamp로 교체 필요
              thumbnailUrl: thumbnailURL,
              isImage: this.isImage(file.type),
              width,
              height,
            };

            options?.onProgress?.({
              fileId,
              fileName: file.name,
              progress: 100,
              status: 'completed',
            });

            options?.onComplete?.(fileAttachment);

            return fileAttachment;
          } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            options?.onError?.(errorMessage);
            throw new Error(errorMessage);
          }
        }
      );

      // 업로드 완료 대기
      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      // 이미지인 경우 썸네일 생성 (현재는 기본값으로 설정)
      let thumbnailURL: string | undefined;
      let width: number | undefined;
      let height: number | undefined;

      if (this.isImage(file.type)) {
        // 썸네일 생성 로직은 별도로 구현 필요
        // thumbnailURL = await this.generateThumbnail(file, thumbnailRef);
      }

      const fileAttachment: FileAttachment = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageUrl: filePath,
        downloadUrl: downloadURL,
        uploadedBy: currentUser?.uid || 'unknown-user',
        uploadedAt: new Date() as any, // Timestamp로 교체 필요
        thumbnailUrl: thumbnailURL,
        isImage: this.isImage(file.type),
        width,
        height,
      };

      return fileAttachment;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      options?.onError?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * 파일 다운로드
   */
  static async downloadFile(fileAttachment: FileAttachment): Promise<Blob> {
    try {
      const response = await fetch(fileAttachment.downloadUrl!);
      if (!response.ok) {
        throw new Error('파일 다운로드에 실패했습니다.');
      }
      return await response.blob();
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 파일 삭제
   */
  static async deleteFile(fileAttachment: FileAttachment): Promise<void> {
    try {
      const storageRef = ref(storage, fileAttachment.storageUrl);
      await deleteObject(storageRef);

      // 썸네일이 있는 경우 함께 삭제
      if (fileAttachment.thumbnailUrl) {
        const thumbnailRef = ref(storage, fileAttachment.thumbnailUrl);
        await deleteObject(thumbnailRef);
      }
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 태스크의 모든 파일 삭제
   */
  static async deleteTaskFiles(taskId: string): Promise<void> {
    try {
      const taskFilesRef = ref(storage, `tasks/${taskId}`);
      await this.deleteFolder(taskFilesRef);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 댓글의 모든 파일 삭제
   */
  static async deleteCommentFiles(
    taskId: string,
    commentId: string
  ): Promise<void> {
    try {
      const commentFilesRef = ref(
        storage,
        `tasks/${taskId}/comments/${commentId}`
      );
      await this.deleteFolder(commentFilesRef);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 폴더 및 하위 파일들 삭제
   */
  private static async deleteFolder(
    folderRef: StorageReference
  ): Promise<void> {
    try {
      const result = await listAll(folderRef);

      // 하위 파일들 삭제
      const deletePromises = result.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);

      // 하위 폴더들 재귀적으로 삭제
      const folderPromises = result.prefixes.map(prefix =>
        this.deleteFolder(prefix)
      );
      await Promise.all(folderPromises);
    } catch (error) {
      console.error('폴더 삭제 중 오류:', error);
    }
  }

  /**
   * 파일 유효성 검사
   */
  private static validateFile(file: File): void {
    // 파일 용량 제한 없음

    const allowedTypes = [
      ...this.ALLOWED_IMAGE_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES,
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }
  }

  /**
   * 이미지 파일 여부 확인
   */
  private static isImage(mimeType: string): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(mimeType);
  }

  /**
   * 파일 ID 생성
   */
  private static generateFileId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 에러 메시지 변환
   */
  private static getErrorMessage(error: any): string {
    // CORS 오류 처리
    if (error.message && error.message.includes('CORS')) {
      console.error('CORS 오류 발생:', error);
      return '브라우저 보안 정책으로 인해 파일 업로드가 차단되었습니다. 개발자에게 문의해주세요.';
    }

    // 네트워크 오류 처리
    if (
      error.code === 'storage/network-request-failed' ||
      error.message?.includes('ERR_FAILED')
    ) {
      console.error('네트워크 오류 발생:', error);
      return '네트워크 연결을 확인하고 다시 시도해주세요.';
    }

    if (error.code === 'storage/unauthorized') {
      return '파일 접근 권한이 없습니다.';
    } else if (error.code === 'storage/canceled') {
      return '파일 업로드가 취소되었습니다.';
    } else if (error.code === 'storage/unknown') {
      return '알 수 없는 오류가 발생했습니다.';
    } else if (error.code === 'storage/quota-exceeded') {
      return '저장 공간이 부족합니다.';
    } else if (error.code === 'storage/unauthenticated') {
      return '인증이 필요합니다.';
    } else if (error.code === 'storage/retry-limit-exceeded') {
      return '업로드 재시도 횟수를 초과했습니다.';
    } else if (error.code === 'storage/invalid-checksum') {
      return '파일이 손상되었습니다.';
    } else if (error.code === 'storage/cannot-slice-blob') {
      return '파일을 처리할 수 없습니다.';
    } else if (error.code === 'storage/server-file-wrong-size') {
      return '서버 파일 크기가 일치하지 않습니다.';
    }

    console.error('Storage 오류:', error);
    return error.message || '파일 처리 중 오류가 발생했습니다.';
  }

  /**
   * 파일 크기 포맷팅
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 파일 아이콘 가져오기
   */
  static getFileIcon(mimeType: string): string {
    if (this.isImage(mimeType)) {
      return '🖼️';
    } else if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else if (mimeType.includes('text')) {
      return '📄';
    } else {
      return '📎';
    }
  }
}

/**
 * 채팅 첨부파일 업로드 함수
 */
export async function uploadChatAttachment(
  file: File,
  groupId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ storageUrl: string; downloadUrl: string }> {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('사용자가 인증되지 않았습니다.');
  }

  // 파일 용량 제한 없음

  // 파일 확장자 추출
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  // 허용된 파일 형식 검사
  const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const allowedFileTypes = [
    'pdf',
    'doc',
    'docx',
    'txt',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
  ];

  if (file.type.startsWith('image/')) {
    if (!allowedImageTypes.includes(fileExtension || '')) {
      throw new Error(
        '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)'
      );
    }
  } else {
    if (!allowedFileTypes.includes(fileExtension || '')) {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }
  }

  // 채팅 첨부파일 경로 생성
  const timestamp = Date.now();
  const fileName = `chat_${timestamp}_${file.name}`;
  const chatPath = `groups/${groupId}/chat/${userId}/${fileName}`;

  const storageRef = ref(storage, chatPath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      error => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            storageUrl: chatPath,
            downloadUrl: downloadURL,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export default StorageService;
