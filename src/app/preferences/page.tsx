"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPreferencesService, type UserPreferences } from "@/lib/services/userPreferencesService";

export default function PreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences>({
    name: '',
    occupation: '',
    traits: [],
    additionalInfo: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get service instance
  const preferencesService = UserPreferencesService.getInstance();
  const availableTraits = preferencesService.getAvailableTraits();

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = preferencesService.getPreferences();
      if (saved) {
        setPreferences(saved);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      // Save using the service
      preferencesService.savePreferences(preferences);
      
      setHasChanges(false);
      
      // Show success message
      alert('Tùy chọn đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Có lỗi xảy ra khi lưu tùy chọn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const toggleTrait = (traitId: string) => {
    const newTraits = preferences.traits.includes(traitId)
      ? preferences.traits.filter(t => t !== traitId)
      : [...preferences.traits, traitId];
    
    updatePreferences({ traits: newTraits });
  };

  const resetPreferences = () => {
    if (window.confirm('Bạn có chắc chắn muốn reset tất cả tùy chọn về mặc định?')) {
      setPreferences({
        name: '',
        occupation: '',
        traits: [],
        additionalInfo: ''
      });
      setHasChanges(true);
    }
  };

  const goBack = () => {
    if (hasChanges && window.confirm('Bạn có thay đổi chưa lưu. Bạn có muốn rời khỏi trang này?')) {
      router.push('/');
    } else if (!hasChanges) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎓 Tùy chỉnh Trợ lý Tư vấn FPT School
              </h1>
              <p className="text-gray-600 mt-2">
                Cá nhân hóa trải nghiệm tư vấn tuyển sinh và định hướng nghề nghiệp
              </p>
            </div>
            <button
              onClick={goBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Quay lại
            </button>
          </div>

          {/* Name Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Trợ lý tư vấn nên gọi bạn là gì?
            </label>
            <input
              type="text"
              value={preferences.name}
              onChange={(e) => updatePreferences({ name: e.target.value })}
              placeholder="Ví dụ: Minh, Hà, hoặc tên bạn muốn được gọi"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              maxLength={50}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {preferences.name.length}/50
            </div>
          </div>

          {/* Occupation Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Bạn hiện tại đang là gì?
            </label>
            <input
              type="text"
              value={preferences.occupation}
              onChange={(e) => updatePreferences({ occupation: e.target.value })}
              placeholder="Ví dụ: Học sinh lớp 12, Sinh viên năm 1, Phụ huynh, Người đi làm muốn học thêm"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              maxLength={100}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {preferences.occupation.length}/100
            </div>
          </div>

          {/* Traits Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Bạn muốn trợ lý tư vấn có phong cách giao tiếp như thế nào?
              <span className="text-sm font-normal text-gray-600 ml-2">
                (chọn tối đa 5 đặc điểm)
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableTraits.map((trait) => (
                <button
                  key={trait.id}
                  onClick={() => toggleTrait(trait.id)}
                  disabled={!preferences.traits.includes(trait.id) && preferences.traits.length >= 5}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    preferences.traits.includes(trait.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } ${
                    !preferences.traits.includes(trait.id) && preferences.traits.length >= 5
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <span className="text-lg">{trait.icon}</span>
                  <span className="font-medium">{trait.label}</span>
                </button>
              ))}
            </div>
            <div className="text-right text-sm text-gray-500 mt-2">
              {preferences.traits.length}/5 đặc điểm đã chọn
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Chia sẻ thêm về bản thân để được tư vấn phù hợp hơn
            </label>
            <textarea
              value={preferences.additionalInfo}
              onChange={(e) => updatePreferences({ additionalInfo: e.target.value })}
              placeholder="Ví dụ: Sở thích công nghệ, mong muốn về môi trường làm việc, mục tiêu nghề nghiệp, điều lo lắng về việc chọn ngành..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg resize-none"
              maxLength={3000}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {preferences.additionalInfo.length}/3000
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={resetPreferences}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              🔄 Reset về mặc định
            </button>
            
            <div className="flex gap-4">
              <button
                onClick={goBack}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={savePreferences}
                disabled={isLoading || !hasChanges}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  hasChanges && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang lưu...
                  </span>
                ) : (
                  '💾 Lưu tùy chọn'
                )}
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-xl">💡</span>
              <div className="text-blue-800">
                <p className="font-medium mb-2">Mẹo sử dụng:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Thông tin cá nhân giúp trợ lý tư vấn định hướng chính xác hơn</li>
                  <li>Phong cách giao tiếp được chọn sẽ ảnh hưởng đến cách trả lời</li>
                  <li>Bạn có thể cập nhật thông tin bất cứ lúc nào</li>
                  <li>Tất cả dữ liệu được lưu an toàn trên thiết bị của bạn</li>
                  <li>Thông tin này chỉ dùng để cải thiện trải nghiệm tư vấn</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 