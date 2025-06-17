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
  hasRelevantContent?: boolean;
  isCareerRelated?: boolean;
  confidence?: number;
  feedbackGiven?: boolean;
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
  const [conversationId] = useState(() => Date.now().toString());

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
          conversationId: conversationId
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
          hasRelevantContent: data.data.hasRelevantContent,
          isCareerRelated: data.data.isCareerRelated,
          confidence: data.data.confidence,
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

      // Send feedback to API
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer: message.content,
          rating,
          isCareerRelated: message.isCareerRelated,
          sources: message.sources,
          hasRelevantContent: message.hasRelevantContent,
        }),
      });

      // Update message to show feedback was given
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex 
          ? { ...msg, feedbackGiven: true }
          : msg
      ));

    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  // Initialize on component mount
  React.useEffect(() => {
    if (isHydrated) {
      void checkSystemStatus();
    }
  }, [isHydrated]);

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
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  
                  {message.type === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        <strong>Nguồn tài liệu:</strong>
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !systemStatus?.isReady}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || !systemStatus?.isReady}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳' : '🚀'}
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
