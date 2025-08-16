import {
  Camera,
  File,
  FileText,
  Image,
  Link,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { FileAttachment, UrlAttachment } from '../../types/task';
import { uploadFile } from '../../lib/storage';
import { Timestamp } from 'firebase/firestore';

interface AttachmentSectionProps {
  attachments: FileAttachment[];
  urls: UrlAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  onUrlsChange: (urls: UrlAttachment[]) => void;
  disabled?: boolean;
}

export function AttachmentSection({
  attachments,
  urls,
  onAttachmentsChange,
  onUrlsChange,
  disabled = false,
}: AttachmentSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlDescription, setUrlDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'urls'>('files');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null, source: 'camera' | 'gallery' | 'file') => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}-${Math.random()}`;
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // 파일 업로드
        const uploadResult = await uploadFile(file, `task-attachments/${fileId}`, (progress) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        });

        // 이미지인지 확인
        const isImage = file.type.startsWith('image/');
        let width, height;
        
        if (isImage) {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise((resolve) => {
            img.onload = () => {
              width = img.width;
              height = img.height;
              resolve(null);
            };
          });
        }

        const attachment: FileAttachment = {
          id: fileId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storageUrl: uploadResult.storageUrl,
          downloadUrl: uploadResult.downloadUrl,
          uploadedBy: 'current-user', // 실제로는 현재 사용자 ID
          uploadedAt: Timestamp.now(),
          thumbnailUrl: isImage ? uploadResult.downloadUrl : undefined,
          isImage,
          width,
          height,
        };

        newAttachments.push(attachment);
      } catch (error) {
        console.error('File upload failed:', error);
        // 에러 처리
      }
    }

    onAttachmentsChange([...attachments, ...newAttachments]);
    setIsUploading(false);
    setUploadProgress({});
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== attachmentId));
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    const urlId = `${Date.now()}-${Math.random()}`;
    const domain = new URL(urlInput).hostname;
    
    const newUrl: UrlAttachment = {
      id: urlId,
      url: urlInput.trim(),
      title: urlTitle.trim() || undefined,
      description: urlDescription.trim() || undefined,
      domain,
      addedBy: 'current-user', // 실제로는 현재 사용자 ID
      addedAt: Timestamp.now(),
    };

    onUrlsChange([...urls, newUrl]);
    setUrlInput('');
    setUrlTitle('');
    setUrlDescription('');
    setShowUrlInput(false);
  };

  const handleRemoveUrl = (urlId: string) => {
    onUrlsChange(urls.filter(url => url.id !== urlId));
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.accept = 'image/*';
      cameraInputRef.current.capture = 'environment';
      cameraInputRef.current.click();
    }
  };

  const openImagePicker = () => {
    if (imageInputRef.current) {
      imageInputRef.current.accept = 'image/*';
      imageInputRef.current.click();
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-white/20">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === 'files'
              ? 'bg-white/20 text-white border-b-2 border-blue-400'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          첨부파일 ({attachments.length})
        </button>
        <button
          onClick={() => setActiveTab('urls')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === 'urls'
              ? 'bg-white/20 text-white border-b-2 border-blue-400'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Link size={16} className="inline mr-2" />
          URL ({urls.length})
        </button>
      </div>

      {/* 첨부파일 탭 */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          {/* 업로드 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <WaveButton
              variant="ghost"
              onClick={openCamera}
              disabled={disabled || isUploading}
              className="flex items-center gap-3 p-4 border-2 border-white/20 hover:border-blue-400 bg-white/10 hover:bg-white/20 transition-all"
            >
              <Camera size={20} className="text-blue-400" />
              <div className="text-left">
                <Typography.BodySmall className="text-white font-medium">
                  카메라
                </Typography.BodySmall>
                <Typography.Caption className="text-white/70">
                  사진 촬영
                </Typography.Caption>
              </div>
            </WaveButton>

            <WaveButton
              variant="ghost"
              onClick={openImagePicker}
              disabled={disabled || isUploading}
              className="flex items-center gap-3 p-4 border-2 border-white/20 hover:border-blue-400 bg-white/10 hover:bg-white/20 transition-all"
            >
              <Image size={20} className="text-green-400" />
              <div className="text-left">
                <Typography.BodySmall className="text-white font-medium">
                  사진
                </Typography.BodySmall>
                <Typography.Caption className="text-white/70">
                  갤러리에서 선택
                </Typography.Caption>
              </div>
            </WaveButton>

            <WaveButton
              variant="ghost"
              onClick={openFilePicker}
              disabled={disabled || isUploading}
              className="flex items-center gap-3 p-4 border-2 border-white/20 hover:border-blue-400 bg-white/10 hover:bg-white/20 transition-all"
            >
              <File size={20} className="text-purple-400" />
              <div className="text-left">
                <Typography.BodySmall className="text-white font-medium">
                  파일
                </Typography.BodySmall>
                <Typography.Caption className="text-white/70">
                  파일 선택
                </Typography.Caption>
              </div>
            </WaveButton>
          </div>

          {/* 업로드 진행률 */}
          {isUploading && Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Typography.Caption className="text-white">
                      업로드 중...
                    </Typography.Caption>
                    <Typography.Caption className="text-white">
                      {progress}%
                    </Typography.Caption>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 첨부파일 목록 */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <Typography.Label className="text-white font-medium">
                첨부된 파일 ({attachments.length})
              </Typography.Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20"
                  >
                    {attachment.isImage && attachment.thumbnailUrl ? (
                      <img
                        src={attachment.thumbnailUrl}
                        alt={attachment.fileName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                        <File size={20} className="text-white/70" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Typography.BodySmall className="text-white font-medium truncate">
                        {attachment.fileName}
                      </Typography.BodySmall>
                      <Typography.Caption className="text-white/70">
                        {formatFileSize(attachment.fileSize)}
                      </Typography.Caption>
                    </div>
                    <WaveButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      disabled={disabled}
                      className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </WaveButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 숨겨진 파일 입력들 */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileUpload(e.target.files, 'camera')}
            className="hidden"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e.target.files, 'gallery')}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files, 'file')}
            className="hidden"
          />
        </div>
      )}

      {/* URL 탭 */}
      {activeTab === 'urls' && (
        <div className="space-y-4">
          {/* URL 추가 버튼 */}
          {!showUrlInput && (
            <WaveButton
              variant="ghost"
              onClick={() => setShowUrlInput(true)}
              disabled={disabled}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-white/30 hover:border-blue-400 bg-white/10 hover:bg-white/20 transition-all w-full"
            >
              <Plus size={20} className="text-blue-400" />
              <Typography.BodySmall className="text-white font-medium">
                URL 추가
              </Typography.BodySmall>
            </WaveButton>
          )}

          {/* URL 입력 폼 */}
          {showUrlInput && (
            <div className="p-4 bg-white/10 rounded-lg border border-white/20 space-y-4">
              <div>
                <Typography.Label className="text-white mb-2 block">
                  URL *
                </Typography.Label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <Typography.Label className="text-white mb-2 block">
                  제목 (선택사항)
                </Typography.Label>
                <input
                  type="text"
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  placeholder="링크 제목"
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <Typography.Label className="text-white mb-2 block">
                  설명 (선택사항)
                </Typography.Label>
                <textarea
                  value={urlDescription}
                  onChange={(e) => setUrlDescription(e.target.value)}
                  placeholder="링크에 대한 설명"
                  rows={2}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <WaveButton
                  variant="primary"
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim()}
                  className="flex-1"
                >
                  <Link size={16} className="mr-2" />
                  추가
                </WaveButton>
                <WaveButton
                  variant="ghost"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput('');
                    setUrlTitle('');
                    setUrlDescription('');
                  }}
                  className="px-4"
                >
                  <X size={16} />
                </WaveButton>
              </div>
            </div>
          )}

          {/* URL 목록 */}
          {urls.length > 0 && (
            <div className="space-y-3">
              <Typography.Label className="text-white font-medium">
                추가된 URL ({urls.length})
              </Typography.Label>
              <div className="space-y-3">
                {urls.map((url) => (
                  <div
                    key={url.id}
                    className="p-4 bg-white/10 rounded-lg border border-white/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Link size={16} className="text-blue-400 flex-shrink-0" />
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-medium truncate"
                          >
                            {url.title || url.url}
                          </a>
                        </div>
                        {url.description && (
                          <Typography.Caption className="text-white/70 block mb-2">
                            {url.description}
                          </Typography.Caption>
                        )}
                        <Typography.Caption className="text-white/50">
                          {url.domain}
                        </Typography.Caption>
                      </div>
                      <WaveButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUrl(url.id)}
                        disabled={disabled}
                        className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </WaveButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
