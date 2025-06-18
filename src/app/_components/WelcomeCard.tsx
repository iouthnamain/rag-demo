"use client";

import React from 'react';

interface WelcomeCardProps {
  hasPreferences: boolean;
  personalizedGreeting: string;
  onQuestionClick?: (question: string) => void;
}

export default function WelcomeCard({ hasPreferences, personalizedGreeting, onQuestionClick }: WelcomeCardProps) {
  const quickQuestions = [
    "Ngành nào phù hợp với người thích toán và logic?",
    "Cơ hội việc làm sau khi tốt nghiệp IT như thế nào?",
    "Học phí và thời gian đào tạo của các chương trình?",
    "Điều kiện đầu vào và yêu cầu học tập?"
  ];
  if (hasPreferences && personalizedGreeting) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🎓</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-700 font-medium leading-relaxed mb-3">
              {personalizedGreeting}
            </div>
            <div className="text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded-lg">
              ✨ Tôi đã được cá nhân hóa dựa trên thông tin của bạn để tư vấn tốt nhất!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Welcome */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl">🎓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Chào mừng đến với FPT School!
        </h2>
        <p className="text-gray-600 mb-4">
          Tôi là trợ lý AI sẽ giúp bạn tìm hiểu về các chương trình đào tạo và định hướng nghề nghiệp công nghệ
        </p>
      </div>

      {/* Quick Programs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💻</span>
            <h3 className="font-semibold text-gray-800">Công nghệ thông tin</h3>
          </div>
          <p className="text-sm text-gray-600">Lập trình, phát triển ứng dụng, quản trị hệ thống</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🛡️</span>
            <h3 className="font-semibold text-gray-800">An ninh mạng</h3>
          </div>
          <p className="text-sm text-gray-600">Bảo mật thông tin, phân tích rủi ro, ethical hacking</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎨</span>
            <h3 className="font-semibold text-gray-800">Thiết kế đồ họa</h3>
          </div>
          <p className="text-sm text-gray-600">UI/UX, graphic design, multimedia, motion graphics</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📱</span>
            <h3 className="font-semibold text-gray-800">Marketing số</h3>
          </div>
          <p className="text-sm text-gray-600">Digital marketing, social media, content strategy</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="text-center">
          <p className="text-gray-700 mb-3">
            💡 Để nhận được tư vấn phù hợp nhất với bản thân bạn
          </p>
          <button 
            onClick={() => window.location.href = '/preferences'}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            🚀 Cá nhân hóa trợ lý tư vấn
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">💬 Câu hỏi gợi ý:</h3>
        <div className="space-y-2">
          {quickQuestions.map((question, index) => (
            <button 
              key={index}
              onClick={() => onQuestionClick?.(question)}
              className="w-full text-left text-sm text-gray-700 hover:text-blue-600 hover:bg-white p-2 rounded transition-colors border border-transparent hover:border-blue-200"
            >
              "{question}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 