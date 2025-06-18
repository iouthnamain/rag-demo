# 🎓 FPT School Counseling Assistant - User Preferences Feature

## Overview

The User Preferences feature allows prospective students, current students, and parents to customize their counseling experience with FPT School's admission advisor. This AI-powered system provides personalized guidance on academic programs, career paths, and technology education opportunities based on individual profiles and communication preferences.

## Features

### 🎯 Core Functionality

1. **Personal Information**
   - User name customization
   - Occupation/profession setting
   - Additional context and notes

2. **Communication Style**
   - 10 personality traits to choose from (max 5)
   - Vietnamese-localized trait descriptions
   - Visual trait selection with emojis

3. **Persistent Storage**
   - Local storage-based persistence
   - Automatic loading on page refresh
   - Cross-session memory

4. **AI Integration**
   - Personalized responses based on user traits
   - Context-aware communication style
   - Customized greetings and interactions

## Available Personality Traits

| Trait ID | Vietnamese Label | Icon | Description |
|----------|------------------|------|-------------|
| `friendly` | thân thiện | 😊 | warm, approachable, creating comfortable counseling environment |
| `professional` | chuyên nghiệp | 💼 | formal, structured, providing clear academic and career guidance |
| `concise` | súc tích | 📝 | brief, clear answers without overwhelming details |
| `detailed` | chi tiết | 🔍 | thorough explanations of programs, career paths, study requirements |
| `empathetic` | đồng cảm | 💝 | understanding student concerns, fears, and family expectations |
| `encouraging` | động viên | 🌟 | motivational, building confidence in students about their potential |
| `patient` | kiên nhẫn | ⏳ | calm, taking time to explain concepts and answer all questions |
| `practical` | thực tế | 🎯 | focused on real-world applications, job market insights |
| `analytical` | phân tích | 📊 | data-driven career guidance using market trends and statistics |
| `inspiring` | truyền cảm hứng | ✨ | motivating students to pursue dreams in technology and innovation |

## User Interface

### 📱 Preferences Page (`/preferences`)

**URL**: `/preferences`

**Features**:
- Clean, modern interface with gradient background
- Form validation and character limits
- Real-time trait selection (max 5)
- Save/cancel functionality with confirmation dialogs
- Reset to defaults option
- Responsive design for mobile and desktop

**Navigation**:
- Accessible via "Tùy chỉnh" button in main chat interface
- Back button with unsaved changes warning
- Direct navigation to home page

### 🏠 Main Chat Integration

**Enhanced Greeting**:
- Personalized welcome from FPT School admission advisor
- Context-aware introduction for students, parents, or working professionals
- Smart recognition of user type (high school students, parents, career changers)

**Visual Indicators**:
- Purple "Cá nhân hóa" button with user icon
- FPT School branding and context
- Educational focus in messaging and design

## Technical Implementation

### 🏗️ Architecture

```
src/lib/services/userPreferencesService.ts
├── UserPreferencesService (Singleton)
├── UserPreferences Interface
├── TraitDefinition Interface
└── localStorage Management
```

### 📋 Data Structure

```typescript
interface UserPreferences {
  name: string;          // Student's preferred name (max 50 chars)
  occupation: string;    // Current status: student, parent, working professional (max 100 chars)  
  traits: string[];      // Preferred counseling style traits (max 5)
  additionalInfo: string; // Academic interests, career goals, concerns (max 3000 chars)
}

interface TraitDefinition {
  id: string;          // Unique trait identifier
  label: string;       // Vietnamese display label
  icon: string;        // Emoji icon
  description: string; // English description for AI prompting
}
```

### 🔧 Service Methods

**Core Methods**:
- `loadPreferences()`: Load from localStorage
- `savePreferences(preferences)`: Save to localStorage
- `getPreferences()`: Get current preferences
- `hasPreferences()`: Check if user has set preferences
- `clearPreferences()`: Remove all preferences

**AI Integration Methods**:
- `buildPersonalizedGreeting()`: Create custom welcome message
- `getPersonalityInstruction()`: Generate AI personality prompt
- `getUserContext()`: Build context string for AI
- `buildPersonalizedContext()`: Full context for prompting

### 🤖 AI Integration

**Prompt Enhancement**:
```
Original: "Bạn là chuyên gia tư vấn tuyển sinh của FPT School..."

With Preferences:
"Bạn là chuyên gia tư vấn tuyển sinh của FPT School - trường đào tạo công nghệ hàng đầu Việt Nam...

BỐI CẢNH FPT SCHOOL:
- Chuyên đào tạo các ngành công nghệ: Công nghệ thông tin, An ninh mạng, Thiết kế đồ họa...
- Phương pháp học tập thực hành, dự án thực tế từ doanh nghiệp
- Cơ hội thực tập và làm việc tại hệ sinh thái FPT Corporation

THÔNG TIN HỌC VIÊN CẦN TƯ VẤN:
- Tên: [student name]
- Hiện tại: [student status]  
- Phong cách tư vấn mong muốn: [selected traits]
- Thông tin bổ sung: [academic interests, goals]

NGUYÊN TẮC TƯ VẤN:
6. Hãy trả lời theo phong cách: [trait descriptions for counseling]
```

**Integration Points**:
- Career-related questions (`buildContextualCareerPrompt`)
- General conversations (`processGeneralQuestion`)
- Web search responses (`processGeneralQuestionWithWebSearch`)

## Usage Guide

### 👤 For Users

1. **Setting Up Preferences**:
   - Click "Cá nhân hóa" button in admission advisor interface
   - Fill in your preferred name and current status
   - Select up to 5 counseling style preferences
   - Share academic interests, career goals, or concerns
   - Click "Lưu tùy chọn" to save

2. **Managing Preferences**:
   - Return to preferences page anytime to update information
   - Use "Reset về mặc định" to start fresh
   - Changes apply immediately to new counseling sessions

3. **Experiencing Personalized Counseling**:
   - Receive FPT School-specific guidance
   - Get advice tailored to your student/parent perspective
   - Benefit from counseling style matching your preferences
   - Access relevant program and career information

### 👨‍💻 For Developers

1. **Accessing User Preferences**:
```typescript
import { UserPreferencesService } from '@/lib/services/userPreferencesService';

const preferencesService = UserPreferencesService.getInstance();
const userPrefs = preferencesService.getPreferences();
```

2. **Checking for Preferences**:
```typescript
if (preferencesService.hasPreferences()) {
  const greeting = preferencesService.buildPersonalizedGreeting();
  // Use personalized greeting
}
```

3. **AI Prompt Integration**:
```typescript
const userContext = preferencesService.getUserContext();
const personalityInstruction = preferencesService.getPersonalityInstruction();
const prompt = `${basePrompt}${userContext}\n\n5. ${personalityInstruction}`;
```

## Data Privacy & Security

### 🔒 Storage

- **Local Storage Only**: All preferences stored in browser localStorage
- **No Server Transmission**: Preferences never sent to backend APIs
- **User Control**: Users can clear preferences at any time
- **No Tracking**: No analytics or tracking of preference data

### 🛡️ Security Considerations

- **Client-Side Only**: No server-side preference storage
- **No Sensitive Data**: Only basic profile information collected
- **User Consent**: Clear indication of what data is used and how
- **Easy Removal**: One-click preference clearing

## File Structure

```
src/
├── app/
│   ├── preferences/
│   │   └── page.tsx                    # Preferences page component
│   └── page.tsx                        # Main chat page (updated)
├── lib/
│   └── services/
│       ├── userPreferencesService.ts   # Core service
│       └── ragService.ts               # Updated with preferences
└── USER_PREFERENCES_FEATURE.md        # This documentation
```

## Configuration Options

### 🎛️ Customizable Settings

**Character Limits**:
- Name: 50 characters
- Occupation: 100 characters  
- Additional Info: 3000 characters
- Traits: Maximum 5 selections

**UI Behavior**:
- Auto-save on changes
- Confirmation dialogs for destructive actions
- Real-time validation feedback
- Responsive design breakpoints

## Future Enhancements

### 🚀 Planned Features

1. **Backend Persistence**
   - Optional server-side storage
   - Cross-device synchronization
   - User accounts integration

2. **Advanced Customization**
   - Custom trait definitions
   - Response style examples
   - Conversation history analysis

3. **AI Improvements**
   - Learning from user feedback
   - Dynamic personality adjustment
   - Context-aware trait suggestions

4. **Export/Import**
   - Preference backup/restore
   - Sharing preference templates
   - Migration tools

## Testing

### ✅ Manual Testing Checklist

- [ ] Preferences page loads correctly
- [ ] Form validation works for all fields
- [ ] Trait selection respects 5-item limit
- [ ] Save/cancel functionality works
- [ ] Reset button clears all preferences
- [ ] Navigation between pages preserves data
- [ ] Personalized greetings display correctly
- [ ] AI responses reflect selected traits
- [ ] localStorage persistence works across sessions
- [ ] Responsive design works on mobile

### 🧪 Test Scenarios

1. **New User Experience**:
   - First visit shows encouragement to set preferences
   - Can complete full preference setup
   - Receives personalized greeting after setup

2. **Existing User Experience**:
   - Preferences load automatically
   - Can modify existing preferences
   - Changes reflect in AI responses immediately

3. **Edge Cases**:
   - Handles localStorage unavailable
   - Graceful degradation without preferences
   - Form validation prevents invalid submissions

## Troubleshooting

### 🐛 Common Issues

**Preferences Not Saving**:
- Check browser localStorage is enabled
- Ensure no browser extensions blocking storage
- Verify form passes validation

**Personalization Not Working**:
- Confirm preferences are saved in localStorage
- Check AI service integration
- Verify conversation context is being built

**UI Issues**:
- Clear browser cache
- Check responsive design breakpoints
- Verify all required styles are loaded

### 📞 Support

For technical issues or feature requests related to user preferences:
1. Check this documentation first
2. Review the code in `userPreferencesService.ts`
3. Test with browser developer tools
4. Check console for error messages

## Changelog

### Version 1.0.0 (Current)
- ✅ FPT School context integration
- ✅ 10 counseling style traits optimized for education guidance
- ✅ localStorage-based preference persistence
- ✅ AI integration for personalized academic counseling
- ✅ Responsive preferences page with FPT School branding
- ✅ Admission advisor interface integration
- ✅ Student/parent-focused user experience
- ✅ Technology education context and career guidance

---

*This feature transforms the RAG system into a sophisticated FPT School admission advisor, providing personalized guidance for students choosing technology careers and academic programs.* 