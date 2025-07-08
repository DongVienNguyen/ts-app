import { CAMERA_CONFIG } from '@/config';
import { toast } from 'sonner';

export interface CameraCapabilities {
  hasCamera: boolean;
  hasMultipleCameras: boolean;
  supportedConstraints: MediaTrackSupportedConstraints;
  facingModes: string[];
}

export interface CameraError {
  name: string;
  message: string;
  constraint?: string;
}

/**
 * Check camera capabilities and permissions
 */
export async function checkCameraCapabilities(): Promise<CameraCapabilities> {
  const capabilities: CameraCapabilities = {
    hasCamera: false,
    hasMultipleCameras: false,
    supportedConstraints: {},
    facingModes: []
  };

  try {
    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('📱 MediaDevices API not supported');
      return capabilities;
    }

    // Get supported constraints
    capabilities.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    console.log('📋 Supported constraints:', capabilities.supportedConstraints);

    // Try to enumerate devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      capabilities.hasCamera = videoDevices.length > 0;
      capabilities.hasMultipleCameras = videoDevices.length > 1;
      
      console.log(`📷 Found ${videoDevices.length} camera(s)`);
      
      // Detect available facing modes
      if (capabilities.hasMultipleCameras) {
        capabilities.facingModes = ['user', 'environment'];
      } else if (capabilities.hasCamera) {
        capabilities.facingModes = ['user'];
      }
      
    } catch (enumError) {
      console.warn('⚠️ Could not enumerate devices:', enumError);
      // Fallback: assume camera exists if getUserMedia is supported
      capabilities.hasCamera = true;
      capabilities.facingModes = ['user'];
    }

  } catch (error) {
    console.error('❌ Error checking camera capabilities:', error);
  }

  return capabilities;
}

/**
 * Request camera permission and get stream
 */
export async function requestCameraStream(facingMode: 'user' | 'environment' = 'environment'): Promise<MediaStream | null> {
  try {
    console.log(`📱 Requesting camera stream with facingMode: ${facingMode}`);

    const constraints: MediaStreamConstraints = {
      video: {
        ...CAMERA_CONFIG.VIDEO_CONSTRAINTS,
        facingMode: { ideal: facingMode }
      },
      audio: false
    };

    console.log('📋 Camera constraints:', constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Camera stream obtained successfully');
    
    // Log actual stream settings
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      console.log('📊 Actual camera settings:', settings);
    }

    return stream;
  } catch (error) {
    console.error('❌ Error requesting camera stream:', error);
    handleCameraError(error as CameraError);
    return null;
  }
}

/**
 * Capture image from video stream
 */
export function captureImageFromStream(stream: MediaStream): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      console.log('📸 Capturing image from stream...');

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        console.log(`📐 Video dimensions: ${video.videoWidth}x${video.videoHeight}`);

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas dimensions
        canvas.width = Math.min(video.videoWidth, CAMERA_CONFIG.CAPTURE_SETTINGS.imageWidth);
        canvas.height = Math.min(video.videoHeight, CAMERA_CONFIG.CAPTURE_SETTINGS.imageHeight);

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
                type: CAMERA_CONFIG.CAPTURE_SETTINGS.imageType
              });
              
              console.log(`✅ Image captured: ${file.size} bytes`);
              resolve(file);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          CAMERA_CONFIG.CAPTURE_SETTINGS.imageType,
          CAMERA_CONFIG.CAPTURE_SETTINGS.imageQuality
        );

        // Clean up
        video.srcObject = null;
        stream.getTracks().forEach(track => track.stop());
      };

      video.onerror = (error) => {
        console.error('❌ Video error:', error);
        reject(new Error('Video loading failed'));
      };

    } catch (error) {
      console.error('❌ Error capturing image:', error);
      reject(error);
    }
  });
}

/**
 * Handle camera errors with user-friendly messages
 */
export function handleCameraError(error: CameraError): void {
  console.error('📱 Camera error:', error);

  let message = 'Không thể truy cập camera';
  let description = 'Vui lòng thử lại hoặc sử dụng tính năng upload ảnh';

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      message = 'Quyền truy cập camera bị từ chối';
      description = 'Vui lòng cấp quyền camera trong cài đặt trình duyệt và thử lại';
      break;

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      message = 'Không tìm thấy camera';
      description = 'Thiết bị không có camera hoặc camera đang được sử dụng bởi ứng dụng khác';
      break;

    case 'NotReadableError':
    case 'TrackStartError':
      message = 'Camera đang được sử dụng';
      description = 'Vui lòng đóng các ứng dụng khác đang sử dụng camera và thử lại';
      break;

    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      message = 'Camera không hỗ trợ cài đặt yêu cầu';
      description = 'Thử sử dụng camera khác hoặc upload ảnh từ thiết bị';
      break;

    case 'NotSupportedError':
      message = 'Trình duyệt không hỗ trợ camera';
      description = 'Vui lòng sử dụng trình duyệt hiện đại hoặc upload ảnh từ thiết bị';
      break;

    case 'AbortError':
      message = 'Truy cập camera bị hủy';
      description = 'Vui lòng thử lại';
      break;

    default:
      if (error.message.includes('secure')) {
        message = 'Cần kết nối bảo mật (HTTPS)';
        description = 'Camera chỉ hoạt động trên kết nối HTTPS';
      }
      break;
  }

  toast.error(message, {
    description,
    duration: 6000
  });
}

/**
 * Create file input for camera capture (fallback method)
 */
export function createCameraFileInput(onCapture: (file: File) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = CAMERA_CONFIG.SUPPORTED_FORMATS.join(',');
  input.capture = 'environment'; // Prefer rear camera
  input.style.display = 'none';

  input.onchange = (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      console.log('📷 File selected from camera input:', file.name, file.size);
      
      // Validate file
      if (!CAMERA_CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
        toast.error('Định dạng file không được hỗ trợ', {
          description: 'Vui lòng chọn file ảnh (JPG, PNG, WebP)'
        });
        return;
      }

      if (file.size > CAMERA_CONFIG.MAX_FILE_SIZE) {
        toast.error('File quá lớn', {
          description: `Kích thước tối đa: ${(CAMERA_CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`
        });
        return;
      }

      onCapture(file);
    }
  };

  return input;
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get optimal camera facing mode based on device
 */
export function getOptimalFacingMode(): 'user' | 'environment' {
  return isMobileDevice() ? 'environment' : 'user';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  checkCameraCapabilities,
  requestCameraStream,
  captureImageFromStream,
  handleCameraError,
  createCameraFileInput,
  isMobileDevice,
  getOptimalFacingMode,
  formatFileSize
};