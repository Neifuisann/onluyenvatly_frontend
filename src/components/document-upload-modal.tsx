"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useDocumentUpload } from '@/lib/hooks/useDocumentUpload';
import { formatFileSize } from '@/lib/api/uploads';
import type { ProcessingStep } from '@/types/upload';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContentReady: (content: string) => void;
  showOnMount?: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onContentReady,
  showOnMount = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'choice' | 'upload'>('choice');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    state,
    progress,
    processingStatus,
    error,
    formattedContent,
    uploadFile,
    reset
  } = useDocumentUpload();

  // Show modal on mount if requested (for new lessons)
  useEffect(() => {
    if (showOnMount) {
      setCurrentScreen('choice');
    }
  }, [showOnMount]);

  // Handle successful content formatting
  useEffect(() => {
    if (state === 'success' && formattedContent) {
      // Delay slightly to show success state
      setTimeout(() => {
        onContentReady(formattedContent);
        handleClose();
      }, 1500);
    }
  }, [state, formattedContent, onContentReady]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setCurrentScreen('choice');
    reset();
    onClose();
  }, [onClose, reset]);

  const handleManualCreation = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const handleDocumentUpload = useCallback(() => {
    setCurrentScreen('upload');
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      alert('Vui lòng chọn file PDF hoặc DOCX');
      return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }
    
    setSelectedFile(file);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleProcessDocument = useCallback(async () => {
    if (!selectedFile) return;
    await uploadFile(selectedFile);
  }, [selectedFile, uploadFile]);

  const handleRetry = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  const getStepIcon = (step: ProcessingStep) => {
    if (!processingStatus) return '⏳';
    
    const stepOrder: ProcessingStep[] = ['upload', 'extract', 'ai', 'complete'];
    const currentIndex = stepOrder.indexOf(processingStatus.currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex || (stepIndex === currentIndex && processingStatus.status === 'completed')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (stepIndex === currentIndex && processingStatus.status === 'active') {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentScreen === 'choice' ? 'Tạo bài học' : 'Tải lên tài liệu'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Choice Screen */}
          {currentScreen === 'choice' && state === 'idle' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleManualCreation}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors group"
              >
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Tạo thủ công
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nhập nội dung bài học trực tiếp
                </p>
              </button>
              
              <button
                onClick={handleDocumentUpload}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors group"
              >
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Tải lên file
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI tự động xử lý PDF/DOCX
                </p>
              </button>
            </div>
          )}

          {/* Upload Screen */}
          {currentScreen === 'upload' && state === 'idle' && !selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Kéo thả file vào đây hoặc click để chọn
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hỗ trợ PDF, DOCX (tối đa 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileInputChange}
              />
            </div>
          )}

          {/* File Preview */}
          {selectedFile && state === 'idle' && (
            <div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-10 h-10 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setCurrentScreen('choice');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleProcessDocument}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Xử lý tài liệu
                </button>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {(state === 'uploading' || state === 'processing' || state === 'success') && (
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Upload Step */}
                <div className="flex items-center gap-3">
                  {getStepIcon('upload')}
                  <span className={`text-sm ${
                    processingStatus?.currentStep === 'upload' && processingStatus.status === 'active' 
                      ? 'text-blue-600 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Tải lên tài liệu
                  </span>
                </div>

                {/* Extract Step */}
                <div className="flex items-center gap-3">
                  {getStepIcon('extract')}
                  <span className={`text-sm ${
                    processingStatus?.currentStep === 'extract' && processingStatus.status === 'active' 
                      ? 'text-blue-600 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Trích xuất nội dung
                  </span>
                </div>

                {/* AI Step */}
                <div className="flex items-center gap-3">
                  {getStepIcon('ai')}
                  <span className={`text-sm ${
                    processingStatus?.currentStep === 'ai' && processingStatus.status === 'active' 
                      ? 'text-blue-600 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    AI đang xử lý
                  </span>
                </div>

                {/* Complete Step */}
                <div className="flex items-center gap-3">
                  {getStepIcon('complete')}
                  <span className={`text-sm ${
                    processingStatus?.currentStep === 'complete' && processingStatus.status === 'completed' 
                      ? 'text-green-600 font-medium' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Hoàn thành
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status Message */}
              {processingStatus?.message && (
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {processingStatus.message}
                </p>
              )}

              {state === 'success' && (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">
                    Xử lý thành công! Đang chuyển đến trình soạn thảo...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Lỗi xử lý tài liệu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Đã xảy ra lỗi khi xử lý tài liệu'}
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};