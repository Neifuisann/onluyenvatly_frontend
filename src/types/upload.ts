export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  originalText?: string;
  formattedContent?: string;
  filename?: string;
  error?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  filename?: string;
  error?: string;
}

export type ProcessingStep = 'upload' | 'extract' | 'ai' | 'complete';

export interface ProcessingStatus {
  currentStep: ProcessingStep;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
  error?: string;
}

export interface UploadConfig {
  maxFileSize: number;
  maxImageDimension: number;
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
  imageBucket: string;
}

export type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface DocumentUploadHookState {
  state: UploadState;
  progress: number;
  processingStatus?: ProcessingStatus;
  error?: string;
  formattedContent?: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}