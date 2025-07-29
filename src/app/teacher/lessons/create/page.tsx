"use client";

import { useEffect, useRef } from "react";
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

  const initializeEditor = () => {
    if (editorInitialized.current) return true;

    if (!checkDependencies()) {
      console.log("Dependencies not ready yet");
      return false;
    }

    editorInitialized.current = true;

    try {
      console.log("Initializing admin editor...");
      window.adminEditor = new window.AdminEditorV2();
      window.adminEditor.initialize();
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
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        if (onLoad) onLoad();
        resolve();
      };
      script.onerror = reject;
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
      setTimeout(() => {
        if (!initializeEditor()) {
          console.log("Initial initialization failed, retrying...");
          let attempts = 0;
          const maxAttempts = 5;

          const retryInit = () => {
            attempts++;
            console.log(`Retry attempt ${attempts}/${maxAttempts}`);

            if (initializeEditor()) {
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
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
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

            {/* Center: Title and status */}
            <div className="flex flex-col items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                Tạo bài học mới
              </h1>
              <p className="text-sm text-gray-500">Chưa lưu</p>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-3">
<Button
                id="continue-btn"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        </nav>

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-2">
              {/* Preview Button */}
              <Button id="preview-btn" variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Xem trước
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

              {/* Text Formatting */}
              <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="normal">Bình thường</option>
                <option value="heading">Tiêu đề</option>
                <option value="subheading">Phụ đề</option>
              </select>
              
              <Button variant="outline" size="sm">
                Thể
              </Button>
              
              <Button variant="outline" size="sm">
                Thị
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

              {/* LaTeX Button */}
              <Button id="add-latex-btn" variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                LaTeX
              </Button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <span className="text-sm text-gray-600 dark:text-gray-400">100%</span>
              <Button variant="outline" size="sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

              {/* Check Button */}
              <Button variant="outline" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Kiểm tra
              </Button>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

              {/* User Info */}
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Tài liên
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              {/* Content Type */}
              <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="image">Hình ảnh</option>
                <option value="text">Văn bản</option>
                <option value="mixed">Hỗn hợp</option>
              </select>

              {/* Question Type */}
              <select
                id="question-type-select"
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Trắc nghiệm ABCD</option>
                <option value="abcd">Trắc nghiệm ABCD</option>
                <option value="truefalse">Đúng/Sai</option>
                <option value="number">Câu hỏi số</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 grid grid-cols-[1fr_4px_1fr] h-[calc(100vh-140px)] overflow-hidden">
          {/* Preview Panel */}
          <div className="preview-panel bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Xem trước
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    id="preview-mode-normal"
                    className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 active"
                  >
                    Bình thường
                  </button>
                  <button
                    id="preview-mode-card"
                    className="px-2 py-1 text-xs rounded text-gray-600 hover:bg-gray-100"
                  >
                    Thẻ
                  </button>
                  <button
                    id="preview-mode-exam"
                    className="px-2 py-1 text-xs rounded text-gray-600 hover:bg-gray-100"
                  >
                    Thi
                  </button>
                </div>
              </div>
            </div>
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
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Soạn thảo
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    id="zoom-out-btn"
                    className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="zoom-level">100%</span>
                  <button
                    id="zoom-in-btn"
                    className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <textarea
                id="lesson-editor"
                className="w-full h-full resize-none border-0 outline-none p-4 bg-transparent text-gray-900 dark:text-gray-100"
                placeholder="Nhập nội dung câu hỏi tại đây..."
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div id="validation-status" className="flex items-center gap-2">
                <span className="status-text">Sẵn sàng</span>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  Hợp lệ:{" "}
                  <span id="valid-questions" className="text-green-600">
                    0
                  </span>
                </span>
                <span>
                  Cảnh báo:{" "}
                  <span id="warning-questions" className="text-yellow-600">
                    0
                  </span>
                </span>
                <span>
                  Lỗi:{" "}
                  <span id="error-questions" className="text-red-600">
                    0
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="validate-btn"
                className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Kiểm tra
              </button>
              <button
                id="refresh-preview-btn"
                className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fas fa-refresh"></i>
              </button>
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
        <div
          id="document-upload-modal"
          className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="modal-content bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4">
            <div className="modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tải lên tài liệu
              </h3>
              <button className="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body p-6">
              <div className="document-upload-options grid grid-cols-2 gap-4">
                <div className="upload-option border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <i className="fas fa-edit text-3xl text-blue-500 mb-3"></i>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tạo thủ công
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nhập nội dung bài học trực tiếp
                  </p>
                </div>
                <div className="upload-option border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <i className="fas fa-upload text-3xl text-blue-500 mb-3"></i>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tải lên file
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI tự động xử lý PDF/DOCX
                  </p>
                </div>
              </div>
              <div className="document-dropzone mt-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors hidden">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Kéo thả file vào đây hoặc click để chọn
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hỗ trợ PDF, DOCX (tối đa 10MB)
                </p>
                <input
                  type="file"
                  id="document-input"
                  className="hidden"
                  accept=".pdf,.docx,.doc"
                />
              </div>
            </div>
          </div>
        </div>

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

        {/* Fullscreen Preview Modal */}
        <div
          id="fullscreen-preview-modal"
          className="modal fixed inset-0 bg-white dark:bg-gray-900 z-50"
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Xem trước toàn màn hình
              </h3>
              <button className="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div id="fullscreen-preview-content">
                {/* Fullscreen preview content will be rendered here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
