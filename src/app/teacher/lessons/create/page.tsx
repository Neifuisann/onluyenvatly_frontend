"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Image,
  Calculator,
  Undo,
  Redo,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
  Check,
  User,
  ChevronDown,
} from "lucide-react";
import Script from "next/script";
import { DocumentUploadModal } from "@/components/document-upload-modal";
import { AIChatbot } from "@/components/ai-chatbot/AIChatbot";
import "./lesson-editor.css";

// Extend Window interface for global variables
declare global {
  interface Window {
    CodeMirror: any;
    renderMathInElement: any;
    getCSRFToken: () => Promise<string>;
    AdminEditorV2: any;
    adminEditor: any;
  }
}

export default function CreateLessonPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const editorInitialized = useRef(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isNewLesson, setIsNewLesson] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  const loadedScripts = useRef({
    codemirror: false,
    codemirrorMode: false,
    katex: false,
    katexAutoRender: false,
    csrfUtils: false,
    adminEditor: false
  });

  const checkDependencies = () => {
    const deps = {
      codemirror: typeof window !== "undefined" && typeof window.CodeMirror !== "undefined",
      katex: typeof window !== "undefined" && typeof window.renderMathInElement !== "undefined",
      csrf: typeof window !== "undefined" && typeof window.getCSRFToken === "function",
      admin: typeof window !== "undefined" && typeof window.AdminEditorV2 !== "undefined"
    };

    console.log("Dependency check:", deps);
    return deps.codemirror && deps.katex && deps.csrf && deps.admin;
  };

  const waitForDOMElement = (id: string, timeout = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const element = document.getElementById(id);
      if (element) {
        resolve(element);
        return;
      }

      const startTime = Date.now();
      const checkElement = () => {
        const element = document.getElementById(id);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element with id "${id}" not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      checkElement();
    });
  };

  const initializeEditor = async () => {
    if (editorInitialized.current) return true;

    if (!checkDependencies()) {
      console.log("Dependencies not ready yet");
      return false;
    }

    try {
      // Wait for critical DOM elements to be available
      console.log("Waiting for DOM elements...");
      await Promise.all([
        waitForDOMElement("lesson-editor"),
        waitForDOMElement("notification-container"),
        waitForDOMElement("preview-content")
      ]);
      console.log("All required DOM elements found");

      editorInitialized.current = true;

      console.log("Initializing admin editor...");
      window.adminEditor = new window.AdminEditorV2();
      await window.adminEditor.initialize();
      console.log("Admin editor initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize admin editor:", error);
      editorInitialized.current = false; // Allow retry
      return false;
    }
  };

  const loadScript = (src: string, onLoad?: () => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        console.log(`Script already loaded: ${src}`);
        if (onLoad) onLoad();
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        console.log(`Script loaded successfully: ${src}`);
        if (onLoad) onLoad();
        resolve();
      };
      script.onerror = (error) => {
        console.error(`Failed to load script: ${src}`, error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  };

  const loadAllDependencies = async () => {
    try {
      console.log("Loading dependencies sequentially...");

      // Load CodeMirror
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js");
      console.log("CodeMirror loaded");
      loadedScripts.current.codemirror = true;

      // Load CodeMirror mode
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js");
      console.log("CodeMirror mode loaded");
      loadedScripts.current.codemirrorMode = true;

      // Load KaTeX
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.11/katex.min.js");
      console.log("KaTeX loaded");
      loadedScripts.current.katex = true;

      // Load KaTeX auto-render
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.11/contrib/auto-render.min.js");
      console.log("KaTeX auto-render loaded");
      loadedScripts.current.katexAutoRender = true;

      // Load CSRF utils
      await loadScript("/csrf-utils.js");
      console.log("CSRF utils loaded");
      loadedScripts.current.csrfUtils = true;

      // Load admin editor
      await loadScript("/admin-new-v2.js");
      console.log("Admin editor script loaded");
      loadedScripts.current.adminEditor = true;

      // Try to initialize
      setTimeout(async () => {
        const success = await initializeEditor();
        if (!success) {
          console.log("Initial initialization failed, retrying...");
          let attempts = 0;
          const maxAttempts = 5;

          const retryInit = async () => {
            attempts++;
            console.log(`Retry attempt ${attempts}/${maxAttempts}`);

            const success = await initializeEditor();
            if (success) {
              console.log("Editor initialized successfully after retry");
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(retryInit, 500);
            } else {
              console.error("Failed to initialize editor after all attempts");
            }
          };

          setTimeout(retryInit, 500);
        }
      }, 100);

    } catch (error) {
      console.error("Failed to load dependencies:", error);
    }
  };

  useEffect(() => {
    if (user && !editorInitialized.current) {
      loadAllDependencies();
    }
  }, [user]);

  // Show upload modal for new lessons
  useEffect(() => {
    if (user && editorInitialized.current && isNewLesson) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        setShowUploadModal(true);
        setIsNewLesson(false); // Only show once
      }, 500);
    }
  }, [user, editorInitialized.current, isNewLesson]);

  // Handle content insertion from document upload
  const handleContentReady = useCallback(async (content: string) => {
    console.log('📝 Inserting content into editor...');

    // Ensure editor is available
    let attempts = 0;
    const maxAttempts = 20;
    const waitTime = 300;

    const insertContent = async () => {
      // Try to get the editor instance
      let editor = null;

      // Strategy 1: Check window.adminEditor
      if (window.adminEditor && window.adminEditor.editor) {
        editor = window.adminEditor.editor;
        console.log('✅ Found editor via window.adminEditor');
      }

      // Strategy 2: Check window.CodeMirror instances
      if (!editor && window.CodeMirror && window.CodeMirror.instances) {
        for (let instance of window.CodeMirror.instances) {
          if (instance && typeof instance.setValue === 'function') {
            editor = instance;
            console.log('✅ Found editor via CodeMirror.instances');
            break;
          }
        }
      }

      // Strategy 3: Look for CodeMirror DOM elements
      if (!editor) {
        const cmElements = document.querySelectorAll('.CodeMirror');
        for (let cmElement of cmElements) {
          if ((cmElement as any).CodeMirror && typeof (cmElement as any).CodeMirror.setValue === 'function') {
            editor = (cmElement as any).CodeMirror;
            console.log('✅ Found editor via DOM CodeMirror element');
            break;
          }
        }
      }

      if (editor && typeof editor.setValue === 'function') {
        try {
          // Set the content
          editor.setValue(content);
          
          // Focus and position cursor
          editor.focus();
          editor.setCursor(editor.lineCount(), 0);
          
          // Refresh the editor
          if (editor.refresh) {
            editor.refresh();
          }

          // Trigger content change event for preview update
          if (window.adminEditor && window.adminEditor.handleContentChange) {
            window.adminEditor.handleContentChange({ content });
          }

          console.log('✅ Content successfully inserted into editor');
          return true;
        } catch (error) {
          console.error('❌ Error inserting content:', error);
        }
      }

      // Retry if editor not found and attempts remaining
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`🔄 Retrying... (${attempts}/${maxAttempts})`);
        setTimeout(insertContent, waitTime);
      } else {
        console.error('❌ Failed to find editor after all attempts');
        alert('Không thể chèn nội dung vào trình soạn thảo. Vui lòng thử sao chép nội dung thủ công.');
      }
    };

    // Start insertion process
    insertContent();
  }, []);

  // Handle upload button click
  const handleUploadClick = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  // AI Chatbot callbacks
  const handleContentInsert = useCallback((text: string, position?: any) => {
    if (!window.adminEditor || !window.adminEditor.editor) {
      console.error('Editor not available');
      return;
    }

    const editor = window.adminEditor.editor;
    const doc = editor.getDoc();

    if (position === 'end') {
      const lastLine = doc.lastLine();
      const lastLineLength = doc.getLine(lastLine).length;
      doc.replaceRange('\n' + text, { line: lastLine, ch: lastLineLength });
    } else if (position === 'cursor') {
      doc.replaceSelection(text);
    } else if (typeof position === 'object' && position.line !== undefined) {
      doc.replaceRange(text, position);
    }

    // Trigger content change
    if (window.adminEditor.handleContentChange) {
      window.adminEditor.handleContentChange();
    }
  }, []);

  const handleContentReplace = useCallback((oldText: string, newText: string) => {
    if (!window.adminEditor || !window.adminEditor.editor) {
      console.error('Editor not available');
      return;
    }

    const editor = window.adminEditor.editor;
    const doc = editor.getDoc();
    const content = doc.getValue();

    if (content.includes(oldText)) {
      const newContent = content.replace(oldText, newText);
      doc.setValue(newContent);
      if (window.adminEditor.handleContentChange) {
        window.adminEditor.handleContentChange();
      }
    }
  }, []);

  const handleTextHighlight = useCallback((text: string) => {
    if (!window.adminEditor || !window.adminEditor.editor) {
      console.error('Editor not available');
      return;
    }

    const editor = window.adminEditor.editor;
    const searchCursor = editor.getSearchCursor(text);

    if (searchCursor.findNext()) {
      editor.setSelection(searchCursor.from(), searchCursor.to());
      editor.scrollIntoView(searchCursor.from());
    }
  }, []);

  const handleScrollToLine = useCallback((lineNumber: number) => {
    if (!window.adminEditor || !window.adminEditor.editor) {
      console.error('Editor not available');
      return;
    }

    const editor = window.adminEditor.editor;
    const line = Math.max(0, lineNumber - 1); // Convert to 0-based

    editor.scrollIntoView({ line, ch: 0 });
    editor.setCursor(line, 0);
  }, []);

  const getLessonContent = useCallback(() => {
    if (window.adminEditor && window.adminEditor.editor) {
      return {
        rawText: window.adminEditor.editor.getValue(),
        questions: window.adminEditor.currentQuestions || [],
        metadata: {
          editingId: window.adminEditor.editingId,
          isEditing: !!window.adminEditor.editingId
        }
      };
    }
    
    return {
      rawText: '',
      questions: [],
      metadata: {}
    };
  }, []);

  if (!user) {
    return null; // Will redirect
  }

  return (
    <>

      {/* CSS Dependencies */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/material.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.11/katex.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teacher/lessons")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>

            {/* Center: Title */}
            <h1 className="text-lg font-semibold text-gray-900">
              Phần 1. TRẮC NGHIỆM
            </h1>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                id="continue-btn"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Đến
              </Button>
            </div>
          </div>
        </nav>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Left Section - Document Actions */}
            <div className="flex items-center gap-2">
              {/* Upload File */}
              <Button 
                id="upload-file-btn" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* Split Points */}
              <Button 
                id="split-points-btn" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                Chia điểm
              </Button>

              {/* Document Info */}
              <Button 
                id="doc-info-btn" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                Thông tin đề
              </Button>

              {/* Go to Question */}
              <select 
                id="go-to-question"
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Đi đến câu</option>
                <option value="1">Câu 1</option>
                <option value="2">Câu 2</option>
                <option value="3">Câu 3</option>
              </select>
            </div>

            {/* Right Section - Editor Actions */}
            <div className="flex items-center gap-2">
              {/* Bold */}
              <Button 
                variant="outline" 
                size="sm"
                className="px-2"
              >
                <span className="font-bold">B</span>
              </Button>

              {/* Italic */}
              <Button 
                variant="outline" 
                size="sm"
                className="px-2"
              >
                <span className="italic">I</span>
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* LaTeX */}
              <Button 
                id="add-latex-btn" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                LaTeX
              </Button>

              {/* Image */}
              <Button 
                id="add-image-btn" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Hình ảnh
              </Button>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 grid grid-cols-[1fr_4px_1fr] h-[calc(100vh-140px)] overflow-hidden">
          {/* Preview Panel */}
          <div className="preview-panel bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex-1 overflow-auto p-4">
              <div id="preview-content" className="space-y-4">
                {/* Preview content will be rendered here */}
              </div>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            id="resize-handle"
            className="bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          ></div>

          {/* Editor Panel */}
          <div className="editor-panel bg-white dark:bg-gray-800 flex flex-col">
            <div className="flex-1 relative">
              <textarea
                id="lesson-editor"
                className="w-full h-full resize-none border-0 outline-none p-4 bg-transparent text-gray-900 dark:text-gray-100"
                placeholder="Nhập nội dung câu hỏi tại đây..."
              />
            </div>
          </div>
        </div>

        {/* Notification Container */}
        <div
          id="notification-container"
          className="fixed top-4 right-4 z-50 space-y-2"
        >
          {/* Notifications will be rendered here */}
        </div>

        {/* Loading Overlay */}
        <div
          id="loading-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-gray-100">
              Đang khởi tạo...
            </span>
          </div>
        </div>

        {/* Document Upload Modal */}
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onContentReady={handleContentReady}
          showOnMount={isNewLesson}
        />

        {/* Image Upload Modal */}
        <div
          id="image-upload-modal"
          className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="modal-content bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4">
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thêm hình ảnh
              </h3>
              <button className="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body p-6">
              <div className="tab-buttons flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                  className="tab-btn px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 active"
                  data-tab="upload"
                >
                  Tải lên
                </button>
                <button
                  className="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  data-tab="url"
                >
                  URL
                </button>
                <button
                  className="tab-btn px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  data-tab="gallery"
                >
                  Thư viện
                </button>
              </div>

              <div id="upload-tab" className="tab-content active">
                <div className="image-dropzone border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <i className="fas fa-image text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Kéo thả hình ảnh vào đây
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hoặc click để chọn file
                  </p>
                  <input
                    type="file"
                    id="image-input"
                    className="hidden"
                    accept="image/*"
                    multiple
                  />
                </div>
              </div>

              <div id="url-tab" className="tab-content hidden">
                <div className="space-y-4">
                  <input
                    type="url"
                    id="image-url"
                    placeholder="Nhập URL hình ảnh"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    id="add-url-image"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Thêm hình ảnh
                  </button>
                </div>
              </div>

              <div id="gallery-tab" className="tab-content hidden">
                <div className="image-gallery grid grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {/* Gallery images will be loaded here */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LaTeX Modal */}
        <div
          id="latex-modal"
          className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="modal-content bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4">
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thêm công thức LaTeX
              </h3>
              <button className="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nhập công thức LaTeX:
                  </label>
                  <textarea
                    id="latex-input"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                    placeholder="Ví dụ: x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                  />
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phím tắt:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className="shortcut-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        data-latex="\frac{}{}"
                      >
                        Phân số
                      </button>
                      <button
                        className="shortcut-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        data-latex="\sqrt{}"
                      >
                        Căn bậc hai
                      </button>
                      <button
                        className="shortcut-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        data-latex="^{}"
                      >
                        Lũy thừa
                      </button>
                      <button
                        className="shortcut-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        data-latex="_{}"
                      >
                        Chỉ số dưới
                      </button>
                      <button
                        className="shortcut-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        data-latex="\sum_{}^{}"
                      >
                        Tổng
                      </button>
                      <button
                        className="shortcut-btn px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        data-latex="\int_{}^{}"
                      >
                        Tích phân
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Xem trước:
                  </label>
                  <div
                    id="latex-preview-content"
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 overflow-auto"
                  >
                    <em className="text-gray-500 dark:text-gray-400">
                      Nhập công thức để xem trước
                    </em>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  id="cancel-latex"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
                <button
                  id="insert-latex"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Chèn công thức
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <AIChatbot
        onContentInsert={handleContentInsert}
        onContentReplace={handleContentReplace}
        onTextHighlight={handleTextHighlight}
        onScrollToLine={handleScrollToLine}
        getLessonContent={getLessonContent}
      />
    </>
  );
}
