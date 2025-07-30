import apiClient from './client';
import type { 
  DocumentUploadResponse, 
  ImageUploadResponse,
  UploadConfig 
} from '@/types/upload';

/**
 * Upload and process a document (PDF/DOCX) with AI formatting
 */
export const uploadDocument = async (file: File): Promise<DocumentUploadResponse> => {
  const formData = new FormData();
  formData.append('document', file);

  try {
    const response = await apiClient.post<DocumentUploadResponse>(
      '/uploads/document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Longer timeout for document processing
        timeout: 60000, // 60 seconds
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Document upload error:', error);
    
    // Extract error message from response
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to upload document';

    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};

/**
 * Upload an image for lessons
 */
export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await apiClient.post<ImageUploadResponse>(
      '/uploads/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Image upload error:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to upload image';

    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};

/**
 * Get upload configuration (file size limits, allowed types, etc.)
 */
export const getUploadConfig = async (): Promise<UploadConfig | null> => {
  try {
    const response = await apiClient.get<{ success: boolean; config: UploadConfig }>(
      '/uploads/config'
    );

    if (response.data.success) {
      return response.data.config;
    }

    return null;
  } catch (error) {
    console.error('Failed to get upload config:', error);
    return null;
  }
};

/**
 * Delete an uploaded image
 */
export const deleteImage = async (filename: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/uploads/image/${filename}`);
    return response.data.success === true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File, 
  allowedTypes: string[], 
  maxSize: number
): { valid: boolean; error?: string } => {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const extensions = allowedTypes
      .map(type => {
        const parts = type.split('/');
        return parts[1] || parts[0];
      })
      .join(', ');
    
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${extensions}`
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};