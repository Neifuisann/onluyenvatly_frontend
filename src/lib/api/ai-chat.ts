/**
 * AI Chat API Client
 */

import { 
  ChatAssistanceRequest, 
  ChatAssistanceResponse, 
  LessonAnalysisRequest, 
  LessonAnalysisResponse,
  StreamingResponse,
  LessonContent
} from '@/types/ai-chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

class AIChatClient {
  private async getCSRFToken(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken;
  }

  /**
   * Send a chat message to the AI assistant
   */
  async sendMessage(
    message: string,
    lessonContent: LessonContent,
    options: {
      stream?: boolean;
      useGoogleSearch?: boolean;
      toolMode?: 'url' | 'code';
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<ChatAssistanceResponse> {
    const csrfToken = await this.getCSRFToken();

    if (options.stream && options.onChunk) {
      return this.sendStreamingMessage(message, lessonContent, csrfToken, options);
    } else {
      return this.sendRegularMessage(message, lessonContent, csrfToken, options);
    }
  }

  private async sendRegularMessage(
    message: string,
    lessonContent: LessonContent,
    csrfToken: string,
    options: {
      useGoogleSearch?: boolean;
      toolMode?: 'url' | 'code';
    }
  ): Promise<ChatAssistanceResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message,
        lessonContent,
        csrfToken,
        stream: false,
        useGoogleSearch: options.useGoogleSearch || false,
        toolMode: options.toolMode || 'url',
      } as ChatAssistanceRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async sendStreamingMessage(
    message: string,
    lessonContent: LessonContent,
    csrfToken: string,
    options: {
      useGoogleSearch?: boolean;
      toolMode?: 'url' | 'code';
      onChunk?: (chunk: string) => void;
    }
  ): Promise<ChatAssistanceResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message,
        lessonContent,
        csrfToken,
        stream: true,
        useGoogleSearch: options.useGoogleSearch || false,
        toolMode: options.toolMode || 'url',
      } as ChatAssistanceRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamingResponse;

              if (data.type === 'chunk' && data.content) {
                fullMessage += data.content;
                if (options.onChunk) {
                  options.onChunk(fullMessage);
                }
              } else if (data.type === 'done') {
                return {
                  success: true,
                  message: fullMessage,
                  actions: [],
                };
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Unknown streaming error');
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete JSON
              console.warn('Parse error in streaming response:', parseError);
            }
          }
        }
      }

      return {
        success: true,
        message: fullMessage,
        actions: [],
      };
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Analyze lesson content
   */
  async analyzeLesson(lessonContent: LessonContent): Promise<LessonAnalysisResponse> {
    const csrfToken = await this.getCSRFToken();

    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        lessonContent,
        csrfToken,
      } as LessonAnalysisRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const aiChatClient = new AIChatClient();