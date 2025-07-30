import { useState, useCallback } from 'react';
import { uploadDocument, getUploadConfig, validateFile } from '@/lib/api/uploads';
import type { 
  DocumentUploadHookState, 
  ProcessingStep, 
  ProcessingStatus,
  UploadConfig
} from '@/types/upload';

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const useDocumentUpload = () => {
  const [state, setState] = useState<DocumentUploadHookState>({
    state: 'idle',
    progress: 0,
  });

  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);

  // Fetch upload config on first use
  const ensureUploadConfig = useCallback(async () => {
    if (!uploadConfig) {
      const config = await getUploadConfig();
      if (config) {
        setUploadConfig(config);
      } else {
        // Fallback config
        setUploadConfig({
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxImageDimension: 2000,
          allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          allowedDocumentTypes: ALLOWED_DOCUMENT_TYPES,
          imageBucket: 'lesson-images'
        });
      }
    }
  }, [uploadConfig]);

  const updateProcessingStep = useCallback((
    step: ProcessingStep, 
    status: ProcessingStatus['status'],
    message?: string
  ) => {
    setState(prev => ({
      ...prev,
      processingStatus: {
        currentStep: step,
        status,
        message
      }
    }));
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    try {
      // Ensure we have config
      await ensureUploadConfig();

      // Reset state
      setState({
        state: 'uploading',
        progress: 0,
        error: undefined,
        formattedContent: undefined
      });

      // Validate file
      const allowedTypes = uploadConfig?.allowedDocumentTypes || ALLOWED_DOCUMENT_TYPES;
      const maxSize = uploadConfig?.maxFileSize || (10 * 1024 * 1024);
      
      const validation = validateFile(file, allowedTypes, maxSize);
      if (!validation.valid) {
        setState({
          state: 'error',
          progress: 0,
          error: validation.error
        });
        return null;
      }

      // Update to processing state
      setState({ state: 'processing', progress: 25 });
      updateProcessingStep('upload', 'active', 'Uploading document...');

      // Upload document
      const response = await uploadDocument(file);

      if (!response.success) {
        setState({
          state: 'error',
          progress: 0,
          error: response.error || 'Upload failed'
        });
        updateProcessingStep('upload', 'error', response.error);
        return null;
      }

      // Update progress through steps
      updateProcessingStep('upload', 'completed');
      setState(prev => ({ ...prev, progress: 50 }));
      updateProcessingStep('extract', 'active', 'Extracting text from document...');

      // Simulate extraction progress (actual extraction happens on server)
      await new Promise(resolve => setTimeout(resolve, 500));
      updateProcessingStep('extract', 'completed');
      setState(prev => ({ ...prev, progress: 75 }));
      updateProcessingStep('ai', 'active', 'AI is formatting the content...');

      // AI processing is already done by server, just update UI
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProcessingStep('ai', 'completed');
      setState(prev => ({ ...prev, progress: 90 }));
      updateProcessingStep('complete', 'active', 'Finalizing...');

      // Final step
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProcessingStep('complete', 'completed');

      // Success state
      setState({
        state: 'success',
        progress: 100,
        formattedContent: response.formattedContent,
        processingStatus: {
          currentStep: 'complete',
          status: 'completed',
          message: 'Document processed successfully!'
        }
      });

      return response.formattedContent;

    } catch (error) {
      console.error('Document upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setState({
        state: 'error',
        progress: 0,
        error: errorMessage
      });

      return null;
    }
  }, [uploadConfig, ensureUploadConfig, updateProcessingStep]);

  const reset = useCallback(() => {
    setState({
      state: 'idle',
      progress: 0,
      error: undefined,
      formattedContent: undefined,
      processingStatus: undefined
    });
  }, []);

  return {
    state: state.state,
    progress: state.progress,
    processingStatus: state.processingStatus,
    error: state.error,
    formattedContent: state.formattedContent,
    uploadFile,
    reset
  };
};