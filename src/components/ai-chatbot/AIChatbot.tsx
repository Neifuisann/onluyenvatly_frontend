"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChatMessage, 
  ChatState, 
  MessageAction, 
  LessonContent,
  ToolMode,
  ToolName,
  ToolSuggestion,
  MessageType
} from '@/types/ai-chat';
import { aiChatClient } from '@/lib/api/ai-chat';
import './ai-chatbot.css';

interface AIChatbotProps {
  onContentInsert?: (text: string, position?: any) => void;
  onContentReplace?: (oldText: string, newText: string) => void;
  onTextHighlight?: (text: string) => void;
  onScrollToLine?: (line: number) => void;
  getLessonContent?: () => LessonContent;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  onContentInsert,
  onContentReplace,
  onTextHighlight,
  onScrollToLine,
  getLessonContent
}) => {
  const [state, setState] = useState<ChatState>({
    isOpen: false,
    isMinimized: false,
    isProcessing: false,
    messages: [],
    currentToolMode: 'urlContext',
    googleSearchActive: false,
    lastActivatedTool: null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageRef = useRef<string>('');

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Alt + A: Toggle chat
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'a') {
        e.preventDefault();
        toggleChat();
      }

      // Escape: Close if open
      if (e.key === 'Escape' && state.isOpen) {
        closeChat();
      }

      // Quick tool shortcuts when chat is open
      if (state.isOpen && (e.ctrlKey || e.metaKey)) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            activateTool('search');
            break;
          case '2':
            e.preventDefault();
            activateTool('edit');
            break;
          case '3':
            e.preventDefault();
            activateTool('add');
            break;
          case '4':
            e.preventDefault();
            activateTool('analyze');
            break;
          case '5':
            e.preventDefault();
            activateTool('google');
            break;
          case '6':
            e.preventDefault();
            toggleToolMode();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
    if (!state.isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const closeChat = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const toggleToolMode = () => {
    setState(prev => ({
      ...prev,
      currentToolMode: prev.currentToolMode === 'urlContext' ? 'codeExecution' : 'urlContext'
    }));

    const modeMessage = state.currentToolMode === 'urlContext' 
      ? '💻 **Chế độ Code Execution đã được kích hoạt**\n\nTôi có thể:\n- Thực thi code Python để tính toán\n- Vẽ đồ thị và biểu đồ\n- Giải phương trình toán học\n- Tạo mô phỏng vật lý\n- Xử lý dữ liệu và thống kê\n\nHãy cho tôi biết bạn cần tính toán hoặc thực thi code gì!'
      : '🔗 **Chế độ URL Context đã được kích hoạt**\n\nTôi có thể:\n- Đọc và phân tích nội dung từ các URL\n- Tóm tắt bài viết và tài liệu trực tuyến\n- Trích xuất thông tin từ trang web\n- Phân tích nội dung giáo dục\n\nHãy cung cấp URL hoặc yêu cầu phân tích nội dung web!';

    addMessage('ai', modeMessage);
  };

  const activateTool = async (toolName: ToolName) => {
    setState(prev => ({ ...prev, lastActivatedTool: toolName }));

    // Visual feedback
    const button = document.querySelector(`[data-tool="${toolName}"]`);
    if (button && toolName !== 'google') {
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 3000);
    }

    switch (toolName) {
      case 'search':
        await activateSearchTool();
        break;
      case 'edit':
        await activateEditTool();
        break;
      case 'add':
        await activateAddTool();
        break;
      case 'analyze':
        await activateAnalyzeTool();
        break;
      case 'google':
        await activateGoogleTool();
        break;
      case 'toggle':
        toggleToolMode();
        break;
    }
  };

  const activateSearchTool = async () => {
    const lessonContent = getLessonContent ? getLessonContent() : { rawText: '', questions: [], metadata: {} };

    if (!lessonContent.rawText.trim()) {
      addMessage('ai', '🔍 **Công cụ tìm kiếm**\n\nBài học hiện tại chưa có nội dung để tìm kiếm. Hãy thêm một số câu hỏi trước!');
      return;
    }

    const searchSuggestions = generateSearchSuggestions(lessonContent);

    let message = '🔍 **Công cụ tìm kiếm đã được kích hoạt**\n\nTôi có thể giúp bạn tìm kiếm:\n';
    message += '- Câu hỏi theo chủ đề cụ thể\n';
    message += '- Câu hỏi theo độ khó\n';
    message += '- Công thức và khái niệm\n';
    message += '- Lỗi cần sửa\n\n';

    if (searchSuggestions.length > 0) {
      message += '**Gợi ý tìm kiếm dựa trên nội dung hiện tại:**\n';
      searchSuggestions.forEach(suggestion => {
        message += `- ${suggestion}\n`;
      });
    }

    message += '\nHãy cho tôi biết bạn muốn tìm gì!';

    addMessage('ai', message);
    inputRef.current?.focus();
  };

  const activateEditTool = async () => {
    const lessonContent = getLessonContent ? getLessonContent() : { rawText: '', questions: [], metadata: {} };

    if (!lessonContent.rawText.trim()) {
      addMessage('ai', '✏️ **Công cụ chỉnh sửa**\n\nBài học hiện tại chưa có nội dung để chỉnh sửa. Hãy thêm một số câu hỏi trước!');
      return;
    }

    const improvements = analyzeForImprovements(lessonContent);

    let message = '✏️ **Công cụ chỉnh sửa đã được kích hoạt**\n\nTôi có thể giúp bạn:\n';
    message += '- Cải thiện câu hỏi hiện có\n';
    message += '- Sửa lỗi ngữ pháp và chính tả\n';
    message += '- Điều chỉnh độ khó câu hỏi\n';
    message += '- Thêm giải thích chi tiết\n';
    message += '- Cải thiện cấu trúc câu hỏi\n\n';

    if (improvements.length > 0) {
      message += '**Tôi phát hiện một số điểm có thể cải thiện:**\n';
      improvements.forEach((improvement, index) => {
        message += `${index + 1}. ${improvement}\n`;
      });
      message += '\n';
    }

    message += 'Hãy cho tôi biết bạn muốn chỉnh sửa gì cụ thể!';

    const actions: MessageAction[] = improvements.length > 0 ? [{
      type: 'highlight_text',
      label: 'Đánh dấu vấn đề đầu tiên',
      icon: 'fas fa-search',
      data: { text: improvements[0].split(':')[0] }
    }] : [];

    addMessage('ai', message, actions);
    inputRef.current?.focus();
  };

  const activateAddTool = async () => {
    const lessonContent = getLessonContent ? getLessonContent() : { rawText: '', questions: [], metadata: {} };
    const suggestions = generateAddSuggestions(lessonContent);

    let message = '➕ **Công cụ thêm nội dung đã được kích hoạt**\n\nTôi có thể tạo:\n';
    message += '- Câu hỏi mới theo chủ đề cụ thể\n';
    message += '- Câu hỏi với độ khó phù hợp\n';
    message += '- Biến thể của câu hỏi hiện có\n';
    message += '- Câu hỏi thực tế ứng dụng\n';
    message += '- Câu hỏi lý thuyết cơ bản\n\n';

    if (suggestions.length > 0) {
      message += '**Dựa trên nội dung hiện tại, tôi đề xuất thêm:**\n';
      suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
      message += '\n';
    }

    message += 'Hãy cho tôi biết bạn muốn thêm loại câu hỏi nào!';

    const actions: MessageAction[] = [
      {
        type: 'insert_text',
        label: 'Thêm câu hỏi trắc nghiệm',
        icon: 'fas fa-list',
        data: {
          text: '\n\n// Câu hỏi mới\n1. [Nhập câu hỏi ở đây]\nA. [Đáp án A]\nB. [Đáp án B]\nC. [Đáp án C]\nD. [Đáp án D]\nĐáp án: A\nGiải thích: [Nhập giải thích]',
          position: 'end'
        }
      }
    ];

    if (lessonContent.questions && lessonContent.questions.length > 0) {
      actions.push({
        type: 'insert_text',
        label: 'Thêm biến thể câu hỏi cuối',
        icon: 'fas fa-copy',
        data: {
          text: '\n\n// Biến thể câu hỏi\n[Sẽ được tạo dựa trên câu hỏi cuối cùng]',
          position: 'end'
        }
      });
    }

    addMessage('ai', message, actions);
    inputRef.current?.focus();
  };

  const activateAnalyzeTool = async () => {
    const lessonContent = getLessonContent ? getLessonContent() : { rawText: '', questions: [], metadata: {} };
    
    if (!lessonContent.rawText.trim()) {
      addMessage('ai', '📊 **Phân tích bài học**\n\nBài học hiện tại chưa có nội dung. Hãy thêm một số câu hỏi để tôi có thể phân tích!');
      return;
    }
    
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await aiChatClient.analyzeLesson(lessonContent);
      if (result.success && result.analysis) {
        addMessage('ai', result.analysis);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      addMessage('ai', 'Không thể phân tích bài học. Vui lòng thử lại.', [], 'error');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const activateGoogleTool = async () => {
    setState(prev => ({ ...prev, googleSearchActive: !prev.googleSearchActive }));

    const message = state.googleSearchActive
      ? '🔍 **Công cụ tìm kiếm Google đã được tắt**\n\nTôi sẽ không sử dụng Google Search trong các phản hồi tiếp theo.'
      : '🔍 **Công cụ tìm kiếm Google đã được kích hoạt**\n\nTôi có thể tìm kiếm thông tin trên Google để hỗ trợ bạn:\n\n- Tìm kiếm tài liệu tham khảo về vật lý\n- Tìm ví dụ câu hỏi tương tự\n- Tìm kiếm công thức và định lý\n- Tìm hình ảnh minh họa\n- Tìm video giải thích\n\nHãy cho tôi biết bạn muốn tìm kiếm gì trên Google!';

    addMessage('ai', message);
    inputRef.current?.focus();
  };

  const generateSearchSuggestions = (lessonContent: LessonContent): string[] => {
    const suggestions: string[] = [];
    const text = lessonContent.rawText.toLowerCase();

    const topics = [
      { keyword: 'động lực', suggestion: 'Tìm câu hỏi về động lực học' },
      { keyword: 'nhiệt', suggestion: 'Tìm câu hỏi về nhiệt học' },
      { keyword: 'điện', suggestion: 'Tìm câu hỏi về điện học' },
      { keyword: 'quang', suggestion: 'Tìm câu hỏi về quang học' },
      { keyword: 'sóng', suggestion: 'Tìm câu hỏi về sóng' },
      { keyword: 'nguyên tử', suggestion: 'Tìm câu hỏi về vật lý nguyên tử' }
    ];

    topics.forEach(topic => {
      if (text.includes(topic.keyword)) {
        suggestions.push(topic.suggestion);
      }
    });

    if (lessonContent.questions && lessonContent.questions.length > 5) {
      suggestions.push('Tìm câu hỏi khó nhất');
      suggestions.push('Tìm câu hỏi dễ nhất');
    }

    if (text.includes('=') || text.includes('\\frac') || text.includes('\\sqrt')) {
      suggestions.push('Tìm tất cả công thức');
    }

    return suggestions.slice(0, 4);
  };

  const analyzeForImprovements = (lessonContent: LessonContent): string[] => {
    const improvements: string[] = [];
    const text = lessonContent.rawText;

    if (text.includes('??')) {
      improvements.push('Có dấu hỏi chưa hoàn thành (??)');
    }

    if (text.includes('TODO') || text.includes('todo')) {
      improvements.push('Có ghi chú TODO chưa hoàn thành');
    }

    const lines = text.split('\n');
    lines.forEach((line) => {
      if (line.match(/^\d+\./) && !line.includes('?') && line.length < 20) {
        improvements.push(`Câu hỏi ${line.split('.')[0]} có vẻ chưa hoàn thành`);
      }
    });

    if (lessonContent.questions && lessonContent.questions.length > 0) {
      const questionsWithoutExplanation = lessonContent.questions.filter(q =>
        !q.explanation || q.explanation.trim().length < 10
      );

      if (questionsWithoutExplanation.length > 0) {
        improvements.push(`${questionsWithoutExplanation.length} câu hỏi chưa có giải thích chi tiết`);
      }
    }

    return improvements.slice(0, 5);
  };

  const generateAddSuggestions = (lessonContent: LessonContent): string[] => {
    const suggestions: string[] = [];
    const questionCount = lessonContent.questions ? lessonContent.questions.length : 0;

    if (questionCount === 0) {
      suggestions.push('Câu hỏi cơ bản để bắt đầu bài học');
      suggestions.push('Câu hỏi kiểm tra kiến thức nền tảng');
    } else if (questionCount < 5) {
      suggestions.push('Thêm câu hỏi để đạt số lượng tối thiểu (5-10 câu)');
      suggestions.push('Câu hỏi với độ khó tăng dần');
    } else if (questionCount >= 10) {
      suggestions.push('Câu hỏi thách thức cho học sinh giỏi');
      suggestions.push('Câu hỏi ứng dụng thực tế');
    }

    if (lessonContent.rawText) {
      const text = lessonContent.rawText.toLowerCase();
      const topicSuggestions: { [key: string]: string } = {
        'động lực': 'Câu hỏi về định luật Newton và ứng dụng',
        'nhiệt': 'Câu hỏi về truyền nhiệt và nhiệt dung',
        'điện': 'Câu hỏi về mạch điện và định luật Ohm',
        'quang': 'Câu hỏi về khúc xạ và phản xạ ánh sáng',
        'sóng': 'Câu hỏi về tần số và bước sóng'
      };

      Object.entries(topicSuggestions).forEach(([keyword, suggestion]) => {
        if (text.includes(keyword)) {
          suggestions.push(suggestion);
        }
      });
    }

    return suggestions.slice(0, 4);
  };

  const addMessage = (
    type: MessageType, 
    content: string, 
    actions?: MessageAction[], 
    status?: 'normal' | 'error' | 'warning' | 'info'
  ) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      status: status || 'normal',
      actions
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  };

  const checkForToolSuggestion = (message: string): ToolSuggestion | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const hasUrls = urlRegex.test(message);

    if (hasUrls && state.currentToolMode === 'codeExecution') {
      return {
        type: 'tool-switch',
        from: 'Code Execution',
        to: 'URL Context',
        message: 'Tôi phát hiện bạn có URL trong tin nhắn. Bạn có muốn chuyển sang chế độ URL Context để phân tích nội dung web không?',
        action: 'switch-to-url-context'
      };
    }

    return null;
  };

  const handleSendMessage = async () => {
    const message = inputRef.current?.value.trim();
    if (!message || state.isProcessing) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Add user message
      addMessage('user', message);

      // Clear input
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      // Check for tool suggestion
      const suggestion = checkForToolSuggestion(message);
      if (suggestion) {
        addSuggestionMessage(suggestion);
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Get current lesson content
      const lessonContent = getLessonContent ? getLessonContent() : { rawText: '', questions: [], metadata: {} };

      // Create streaming message placeholder
      const streamingMessageId = `msg-streaming-${Date.now()}`;
      const streamingMessage: ChatMessage = {
        id: streamingMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, streamingMessage]
      }));

      // Send message with streaming
      streamingMessageRef.current = '';
      
      await aiChatClient.sendMessage(message, lessonContent, {
        stream: true,
        useGoogleSearch: state.googleSearchActive,
        toolMode: state.currentToolMode === 'codeExecution' ? 'code' : 'url',
        onChunk: (content) => {
          streamingMessageRef.current = content;
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === streamingMessageId
                ? { ...msg, content }
                : msg
            )
          }));
        }
      });

      // Finalize streaming message
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === streamingMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('ai', 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.', [], 'error');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const addSuggestionMessage = (suggestion: ToolSuggestion) => {
    const suggestionMessage: ChatMessage = {
      id: `msg-suggestion-${Date.now()}`,
      type: 'ai',
      content: suggestion.message,
      timestamp: new Date(),
      status: 'warning'
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, suggestionMessage]
    }));
  };

  const executeAction = async (action: MessageAction) => {
    try {
      switch (action.type) {
        case 'insert_text':
          if (onContentInsert && action.data.text) {
            onContentInsert(action.data.text, action.data.position);
            addMessage('ai', `✅ Đã thực hiện: ${action.label}`);
          }
          break;
        case 'replace_text':
          if (onContentReplace && action.data.oldText && action.data.newText) {
            onContentReplace(action.data.oldText, action.data.newText);
            addMessage('ai', `✅ Đã thực hiện: ${action.label}`);
          }
          break;
        case 'highlight_text':
          if (onTextHighlight && action.data.text) {
            onTextHighlight(action.data.text);
            addMessage('ai', `✅ Đã thực hiện: ${action.label}`);
          }
          break;
        case 'scroll_to':
          if (onScrollToLine && action.data.line) {
            onScrollToLine(action.data.line);
            addMessage('ai', `✅ Đã thực hiện: ${action.label}`);
          }
          break;
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      addMessage('ai', `❌ Không thể thực hiện: ${action.label}`, [], 'error');
    }
  };

  const formatMessage = (content: string): string => {
    let formatted = content;

    // Handle code blocks first (```code```)
    formatted = formatted.replace(/```([\s\S]*?)```/g, (_, code) => {
      const codeId = 'code-' + Math.random().toString(36).substring(2, 11);
      const trimmedCode = code.trim();
      return `<div class="code-block-container">
        <div class="code-block-header">
          <span class="code-block-label">Code</span>
          <button class="copy-code-btn" onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').textContent).then(() => { this.innerHTML = '<i class=\\"fas fa-check\\"></i> Copied!'; this.classList.add('copied'); setTimeout(() => { this.innerHTML = '<i class=\\"fas fa-copy\\"></i> Copy'; this.classList.remove('copied'); }, 2000); })">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <pre class="code-block" id="${codeId}"><code>${escapeHtml(trimmedCode)}</code></pre>
      </div>`;
    });

    // Handle headers
    formatted = formatted.replace(/^## (.*$)/gm, '<h3 class="message-header">$1</h3>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h2 class="message-header">$1</h2>');

    // Handle bold and italic
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Handle bullet points
    formatted = formatted.replace(/^- (.*$)/gm, '<li>$1</li>');
    // Group consecutive li elements into ul - using [\s\S] instead of . with /s flag
    formatted = formatted.replace(/(<li>[\s\S]*?<\/li>)/, '<ul>$1</ul>');

    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <>
      {/* Chat Bubble */}
      <div
        className="ai-chat-bubble"
        onClick={toggleChat}
        aria-label="Toggle AI Chat"
        aria-expanded={state.isOpen}
        role="button"
      >
        <i className="fas fa-robot"></i>
      </div>

      {/* Chat Window */}
      <div
        className={`ai-chat-window ${state.isOpen ? 'open' : ''} ${state.isMinimized ? 'minimized' : ''}`}
        aria-hidden={!state.isOpen}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <i className="fas fa-robot"></i>
            <span>AI Assistant</span>
          </div>
          <div className="chat-header-actions">
            <button
              className="header-btn"
              onClick={closeChat}
              aria-label="Close chat"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {state.messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.type}-message`}>
              <div className="message-avatar">
                <i className={message.type === 'ai' ? 'fas fa-robot' : 'fas fa-user'}></i>
              </div>
              <div className="message-content">
                <div
                  className={`message-text ${message.isStreaming ? 'streaming-text' : ''}`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {message.actions && message.actions.length > 0 && (
                  <div className="message-actions">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        className="action-btn"
                        onClick={() => executeAction(action)}
                      >
                        <i className={action.icon}></i> {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Tools */}
        <div className="chat-tools">
          <button
            className="tool-btn"
            data-tool="search"
            onClick={() => activateTool('search')}
            title="Tìm kiếm - Phím tắt: Ctrl+1"
          >
            <i className="fas fa-search"></i>
            <span>Tìm kiếm</span>
          </button>
          <button
            className="tool-btn"
            data-tool="edit"
            onClick={() => activateTool('edit')}
            title="Chỉnh sửa - Phím tắt: Ctrl+2"
          >
            <i className="fas fa-edit"></i>
            <span>Chỉnh sửa</span>
          </button>
          <button
            className="tool-btn"
            data-tool="add"
            onClick={() => activateTool('add')}
            title="Thêm nội dung - Phím tắt: Ctrl+3"
          >
            <i className="fas fa-plus"></i>
            <span>Thêm</span>
          </button>
          <button
            className="tool-btn"
            data-tool="analyze"
            onClick={() => activateTool('analyze')}
            title="Phân tích - Phím tắt: Ctrl+4"
          >
            <i className="fas fa-chart-bar"></i>
            <span>Phân tích</span>
          </button>
          <button
            className={`tool-btn ${state.googleSearchActive ? 'active' : ''}`}
            data-tool="google"
            onClick={() => activateTool('google')}
            title="Google Search - Phím tắt: Ctrl+5"
          >
            <i className="fab fa-google"></i>
            <span>Google</span>
          </button>
          <button
            className="tool-btn"
            data-tool="toggle"
            data-mode={state.currentToolMode}
            onClick={() => activateTool('toggle')}
            title="Chuyển đổi: URL Context / Code Execution - Phím tắt: Ctrl+6"
          >
            <i className={state.currentToolMode === 'urlContext' ? 'fas fa-link' : 'fas fa-code'}></i>
            <span>{state.currentToolMode === 'urlContext' ? 'URL Context' : 'Code Execution'}</span>
          </button>
        </div>

        {/* Status */}
        <div className={`chat-status ${state.isProcessing ? 'processing' : ''}`}>
          <span className="status-text">
            {state.isProcessing ? 'Đang xử lý...' : 'Sẵn sàng'}
          </span>
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={state.isProcessing}
            />
            <button
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={state.isProcessing || !inputRef.current?.value.trim()}
              aria-label="Send message"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};