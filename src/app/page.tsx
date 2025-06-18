"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  webSources?: string[];
  hasRelevantContent?: boolean;
  isCareerRelated?: boolean;
  confidence?: number;
  feedbackGiven?: boolean;
  usedWebSearch?: boolean;
}

interface SystemStatus {
  isReady: boolean;
  totalVectors: number;
  message: string;
}

// Custom hook to handle hydration
function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  return isHydrated;
}

// Component for safe timestamp rendering
function TimestampDisplay({ timestamp }: { timestamp: Date }) {
  const isHydrated = useHydration();
  
  if (!isHydrated) {
    return <span className="text-xs opacity-75 mt-1">...</span>;
  }

  return (
    <span className="text-xs opacity-75 mt-1">
      {timestamp.toLocaleTimeString('vi-VN')}
    </span>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const isHydrated = useHydration();
  const [conversationId, setConversationId] = useState(() => Date.now().toString());
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Reset conversation function
  const resetConversation = () => {
    if (messages.length === 0 || window.confirm('Bạn có chắc chắn muốn xóa tất cả tin nhắn?')) {
      setMessages([]);
      setConversationId(Date.now().toString());
    }
  };

  // Generate unique ID function
  const generateId = () => {
    if (typeof window !== 'undefined') {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return Math.random().toString(36).substr(2, 9);
  };

  // Check system status
  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/ask');
      const data = await response.json() as {
        data?: {
          isReady?: boolean;
          indexStats?: { totalVectors?: number };
        };
      };
      
      setSystemStatus({
        isReady: data.data?.isReady ?? false,
        totalVectors: data.data?.indexStats?.totalVectors ?? 0,
        message: data.data?.isReady ? 'Hệ thống sẵn sàng' : 'Cần khởi tạo dữ liệu'
      });
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus({
        isReady: false,
        totalVectors: 0,
        message: 'Lỗi kết nối hệ thống'
      });
    }
  };

  // Ingest documents
  const ingestDocuments = async () => {
    setIsIngesting(true);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clearIndex: true }),
      });
      
      const data = await response.json() as {
        success?: boolean;
        data?: {
          totalChunks?: number;
          processedFiles?: unknown[];
        };
        message?: string;
      };
      
      if (data.success) {
        alert(`Khởi tạo thành công! Đã xử lý ${data.data?.totalChunks ?? 0} đoạn văn từ ${data.data?.processedFiles?.length ?? 0} file.`);
        void checkSystemStatus();
      } else {
        alert(`Lỗi: ${data.message ?? 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error ingesting documents:', error);
      alert('Lỗi khi khởi tạo dữ liệu');
    } finally {
      setIsIngesting(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: inputMessage.trim(),
          conversationId: conversationId,
          webSearchEnabled: webSearchEnabled
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.success && data.data) {
        const assistantMessage: ChatMessage = {
          id: generateId(),
          type: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
          sources: data.data.sources,
          webSources: data.data.webSources,
          hasRelevantContent: data.data.hasRelevantContent,
          isCareerRelated: data.data.isCareerRelated,
          confidence: data.data.confidence,
          usedWebSearch: data.data.usedWebSearch,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user feedback
  const handleFeedback = async (messageIndex: number, rating: 'positive' | 'negative' | 'neutral') => {
    const message = messages[messageIndex];
    if (!message || message.type !== 'assistant') return;

    try {
      // Find the corresponding user question
      const userMessage = messages[messageIndex - 1];
      const question = userMessage?.content || '';

      // Prepare feedback data
      const feedbackData = {
        question,
        answer: message.content,
        rating,
        isCareerRelated: message.isCareerRelated,
        sources: message.sources,
        hasRelevantContent: message.hasRelevantContent,
      };

      try {
        // Send feedback to API with error handling
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData),
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (apiError) {
        console.error('API Error sending feedback:', apiError);
        
        // Store feedback locally as fallback
        try {
          const localFeedback = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
          localFeedback.push({
            ...feedbackData,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem('pendingFeedback', JSON.stringify(localFeedback));
          console.log('Feedback stored locally as fallback');
        } catch (storageError) {
          console.error('Failed to store feedback locally:', storageError);
        }
      }

      // Update message to show feedback was given (regardless of API success)
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex 
          ? { ...msg, feedbackGiven: true }
          : msg
      ));

    } catch (error) {
      console.error('Error in feedback handling:', error);
    }
  };

  // Initialize on component mount
  React.useEffect(() => {
    if (isHydrated) {
      void checkSystemStatus();
      
      // Try to send any pending feedback
      void retryPendingFeedback();
    }
  }, [isHydrated]);

  // Function to retry sending any pending feedback
  const retryPendingFeedback = async () => {
    try {
      // Define the feedback item type
      interface PendingFeedbackItem {
        question: string;
        answer: string;
        rating: 'positive' | 'negative' | 'neutral';
        isCareerRelated?: boolean;
        sources?: string[];
        hasRelevantContent?: boolean;
        timestamp: string;
      }
      
      const pendingFeedback = JSON.parse(localStorage.getItem('pendingFeedback') || '[]') as PendingFeedbackItem[];
      if (pendingFeedback.length === 0) return;
      
      console.log(`Found ${pendingFeedback.length} pending feedback items to retry`);
      
      const successfulItems: number[] = [];
      
      for (let i = 0; i < pendingFeedback.length; i++) {
        const feedback = pendingFeedback[i];
        try {
          const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedback),
          });
          
          if (response.ok) {
            successfulItems.push(i);
            console.log(`Successfully sent pending feedback item ${i+1}/${pendingFeedback.length}`);
          }
        } catch (error) {
          console.error(`Failed to retry sending feedback item ${i+1}/${pendingFeedback.length}:`, error);
        }
      }
      
      // Remove successfully sent items
      if (successfulItems.length > 0) {
        const remainingFeedback = pendingFeedback.filter((_: PendingFeedbackItem, index: number) => !successfulItems.includes(index));
        localStorage.setItem('pendingFeedback', JSON.stringify(remainingFeedback));
        console.log(`Removed ${successfulItems.length} successfully sent feedback items. ${remainingFeedback.length} items remaining.`);
      }
    } catch (error) {
      console.error('Error retrying pending feedback:', error);
    }
  };

  // Add keyboard shortcut for reset (Ctrl+Shift+C)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        resetConversation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetConversation]);

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🤖 Chatbot Tư Vấn Nghề Nghiệp
            </h1>
            <p className="text-gray-600">
              Đang tải hệ thống...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🤖 Chatbot Tư Vấn Nghề Nghiệp
          </h1>
          <p className="text-gray-600">
            Hệ thống RAG (Retrieval-Augmented Generation) với NextJS + Pinecone + Gemini AI
          </p>
          
          {/* System Status */}
          {systemStatus && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.isReady ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {systemStatus.message}
                </span>
                {systemStatus.totalVectors > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {systemStatus.totalVectors} vectors
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={checkSystemStatus}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Kiểm tra trạng thái
                </button>
                <button
                  onClick={ingestDocuments}
                  disabled={isIngesting}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {isIngesting ? 'Đang khởi tạo...' : 'Khởi tạo dữ liệu'}
                </button>
                <button
                  onClick={resetConversation}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm flex items-center group relative"
                  title="Phím tắt: Ctrl+Shift+C"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa cuộc hội thoại
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Phím tắt: Ctrl+Shift+C
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-center items-center h-32">
                <div className="text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className={`px-2 py-1 rounded-full text-white ${
                        message.isCareerRelated ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {message.isCareerRelated ? '💼 Tư vấn nghề nghiệp' : '💬 Trò chuyện'}
                      </span>
                      {message.usedWebSearch && (
                        <span className="px-2 py-1 rounded-full bg-purple-500 text-white">
                          🔍 Web Search
                        </span>
                      )}
                      {message.confidence && (
                        <span className="text-gray-500">
                          Độ tin cậy: {Math.round(message.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                  
                  {message.type === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom styling for markdown elements
                          h1: ({children}) => <h1 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-3">{children}</h3>,
                          p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 pl-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 pl-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-900 leading-relaxed">{children}</li>,
                          code: ({children}) => <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm font-mono border">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm overflow-x-auto mb-3 font-mono">{children}</pre>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 italic text-gray-700 mb-3 rounded-r">{children}</blockquote>,
                          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                          a: ({href, children}) => <a href={href} className="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">{children}</a>,
                          hr: () => <hr className="border-gray-300 my-4" />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  
                  {message.type === 'assistant' && ((message.sources?.length ?? 0) > 0 || (message.webSources?.length ?? 0) > 0) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>📄 Nguồn tài liệu:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.sources.map((source, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {message.webSources && message.webSources.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <strong>🔗 Nguồn web:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.webSources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs hover:bg-purple-200 transition-colors"
                              >
                                🔗 Web {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Buttons for Assistant Messages */}
                  {message.type === 'assistant' && !message.feedbackGiven && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Câu trả lời này có hữu ích không?</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFeedback(index, 'positive')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          👍 Hữu ích
                        </button>
                        <button
                          onClick={() => handleFeedback(index, 'negative')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          👎 Không hữu ích
                        </button>
                        <button
                          onClick={() => handleFeedback(index, 'neutral')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          😐 Bình thường
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Confirmation */}
                  {message.type === 'assistant' && message.feedbackGiven && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        ✅ Cảm ơn phản hồi của bạn! Tôi sẽ học từ điều này.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Đang xử lý...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {/* Web Search Toggle */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  🔍 Tìm kiếm web
                </span>
                <span className="text-xs text-gray-500">
                  (Bổ sung thông tin từ internet)
                </span>
              </div>
              <button
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  webSearchEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    webSearchEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={webSearchEnabled ? "Nhập câu hỏi của bạn (sẽ tìm kiếm trên web)..." : "Nhập câu hỏi của bạn..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !systemStatus?.isReady}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || !systemStatus?.isReady}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>⏳</span>
                  </>
                ) : (
                  <>
                    {webSearchEnabled && <span>🔍</span>}
                    <span>🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            💡 Để sử dụng hệ thống, vui lòng đặt các file DOCX vào thư mục <code>documents/</code> và khởi tạo dữ liệu.
          </p>
          <p className="mt-1">
            🔧 Cấu hình API keys trong file <code>.env.local</code>
          </p>
        </div>
      </div>
    </div>
  );
}
