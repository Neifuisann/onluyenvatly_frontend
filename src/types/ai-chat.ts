/**
 * AI Chat Types and Interfaces
 */

export type MessageType = 'user' | 'ai' | 'system';
export type MessageStatus = 'normal' | 'error' | 'warning' | 'info';
export type ToolMode = 'urlContext' | 'codeExecution';
export type ToolName = 'search' | 'edit' | 'add' | 'analyze' | 'google' | 'toggle';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  actions?: MessageAction[];
  isStreaming?: boolean;
}

export interface MessageAction {
  type: 'insert_text' | 'replace_text' | 'highlight_text' | 'scroll_to';
  label: string;
  icon: string;
  data: {
    text?: string;
    oldText?: string;
    newText?: string;
    position?: 'end' | 'cursor' | { line: number; ch: number };
    line?: number;
  };
}

export interface LessonContent {
  rawText: string;
  questions: Question[];
  metadata: {
    editingId?: string;
    isEditing?: boolean;
  };
}

export interface Question {
  id?: string;
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface ToolSuggestion {
  type: 'tool-switch';
  from: string;
  to: string;
  message: string;
  action: string;
}

export interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  isProcessing: boolean;
  messages: ChatMessage[];
  currentToolMode: ToolMode;
  googleSearchActive: boolean;
  lastActivatedTool: ToolName | null;
}

export interface StreamingResponse {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface ChatAssistanceRequest {
  message: string;
  lessonContent: LessonContent;
  csrfToken: string;
  stream: boolean;
  useGoogleSearch?: boolean;
  toolMode?: 'url' | 'code';
}

export interface ChatAssistanceResponse {
  success: boolean;
  message?: string;
  actions?: MessageAction[];
  error?: string;
}

export interface LessonAnalysisRequest {
  lessonContent: LessonContent;
  csrfToken: string;
}

export interface LessonAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
}