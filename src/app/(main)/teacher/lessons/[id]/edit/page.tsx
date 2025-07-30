"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import "./lesson-editor.css";
import apiClient from "@/lib/api/client";
import { useToast } from "@/lib/hooks/useToast";

// Extend window type for admin editor
declare global {
  interface Window {
    CodeMirror: any;
    renderMathInElement: any;
    getCSRFToken: () => Promise<string>;
    AdminEditorV2: any;
    adminEditor: any;
  }
}

// Simple interface for minimal type safety
interface LessonData {
  id: string;
  title: string;
  questions?: any;
  quiz_data?: { questions?: any };
  content?: any;
}

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  const { user } = useAuthStore();
  const { error: showError } = useToast();
  const editorInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);

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
      
      // Set edit mode and lesson ID
      window.adminEditor.editingId = lessonId;
      window.adminEditor.isEditMode = true;
      
      await window.adminEditor.initialize();
      console.log("Admin editor initialized successfully");

      // Load lesson data into editor
      if (lessonData) {
        console.log("Loading lesson data into editor:", lessonData);
        await window.adminEditor.loadLessonContent(lessonId);
      }

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

  // Fetch lesson data
  useEffect(() => {
    if (!user || !lessonId) return;

    const fetchLessonData = async () => {
      try {
        setLoading(true);
        console.log("Fetching lesson data for ID:", lessonId);
        const response = await apiClient.get(`/lessons/${lessonId}`);
        console.log("Lesson data received:", response.data);
        
        const lesson = response.data.lesson || response.data;
        setLessonData(lesson);
        
        // If editor is already initialized, load the lesson data
        if (window.adminEditor && editorInitialized.current) {
          await window.adminEditor.loadLessonContent(lessonId);
        }
      } catch (error) {
        console.error("Failed to fetch lesson data:", error);
        showError("Không thể tải dữ liệu bài học");
        router.push("/teacher/lessons");
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [user, lessonId, router]);

  // Load dependencies after lesson data is fetched
  useEffect(() => {
    if (user && lessonData && !editorInitialized.current) {
      loadAllDependencies();
    }
  }, [user, lessonData]);

  if (!user) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Đang tải bài học...</span>
        </div>
      </div>
    );
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
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>

            {/* Center: Title - will be updated by the editor */}
            <h1 id="lesson-title" className="text-xl font-semibold text-gray-900">
              {lessonData?.title || "Chỉnh sửa bài học"}
            </h1>

            {/* Right: Save button - will be populated by admin editor */}
            <div id="save-button-container">
              {/* Admin editor will add save button here */}
            </div>
          </div>
        </nav>

        {/* Main Editor Area */}
        <div className="flex-1 grid grid-cols-[1fr_4px_1fr] h-[calc(100vh-64px)] overflow-hidden">
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

        {/* Modal Container */}
        <div id="modal-container"></div>
      </div>
    </>
  );
}