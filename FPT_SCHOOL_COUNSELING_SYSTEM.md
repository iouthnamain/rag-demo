# FPT School AI Counseling System

## 📋 Tổng quan hệ thống

Hệ thống tư vấn tuyển sinh AI của FPT School là một chatbot thông minh được thiết kế để hỗ trợ học sinh trung học, phụ huynh và người đang đi làm trong việc tìm hiểu các chương trình đào tạo và định hướng nghề nghiệp công nghệ tại FPT School.

## 🎯 Mục tiêu

- **Tư vấn cá nhân hóa**: Cung cấp lời khuyên phù hợp dựa trên thông tin cá nhân của từng người dùng
- **Thông tin chính xác**: Dựa trên tài liệu chính thức và kiến thức cập nhật về FPT School
- **Hỗ trợ đa dạng**: Phục vụ nhiều đối tượng khác nhau với nhu cầu tư vấn khác nhau
- **Trải nghiệm tốt**: Giao diện thân thiện, dễ sử dụng

## 🏗️ Kiến trúc hệ thống

### Frontend
- **Framework**: Next.js 15 với TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks với localStorage persistence
- **Markdown Rendering**: ReactMarkdown với remark-gfm

### Backend
- **API Routes**: Next.js API routes
- **Vector Database**: Pinecone
- **AI Service**: Google Gemini
- **Web Search**: Firecrawl API
- **Document Processing**: LangChain text splitters

### Dữ liệu
- **Tài liệu FPT School**: Được xử lý và lưu trữ dưới dạng vector embeddings
- **Conversation History**: Lưu trữ trong memory với conversation ID
- **User Preferences**: Lưu trữ local trong browser

## 🔧 Tính năng chính

### 1. Hệ thống Chat Thông minh

#### RAG (Retrieval-Augmented Generation)
- Truy xuất thông tin từ tài liệu FPT School
- Kết hợp với kiến thức AI để đưa ra câu trả lời chính xác
- Phân loại câu hỏi: Tư vấn nghề nghiệp vs Trò chuyện thường

#### Context Management
- Duy trì ngữ cảnh cuộc trò chuyện trong session
- Tích hợp lịch sử 3 tin nhắn gần nhất cho câu hỏi nghề nghiệp
- Reset conversation với xác nhận

#### Feedback System
- Thu thập phản hồi người dùng (👍 👎 😐)
- Lưu trữ feedback để cải thiện chất lượng
- Retry mechanism cho feedback thất bại

### 2. Tìm kiếm Web mở rộng

#### Firecrawl Integration
- Tìm kiếm thông tin bổ sung từ internet
- Hỗ trợ tiếng Việt với country='vn', lang='vi'
- Trích xuất nội dung chính từ các trang web
- Hiển thị nguồn web clickable

#### Toggle Control
- Bật/tắt tìm kiếm web theo ý muốn
- Hiển thị trạng thái và nguồn thông tin rõ ràng
- Icon và badge cho web search results

### 3. Cá nhân hóa người dùng

#### User Preferences
- **Thông tin cơ bản**: Tên, nghề nghiệp/học lớp
- **10 tính cách tư vấn**: Chọn tối đa 5 trong số:
  - 😊 Thân thiện, 💼 Chuyên nghiệp, 📝 Súc tích, 🔍 Chi tiết
  - 💝 Đồng cảm, 🎨 Sáng tạo, ⏳ Kiên nhẫn, 🌟 Động viên
  - 📊 Phân tích, 🤝 Hỗ trợ
- **Thông tin bổ sung**: Mục tiêu, sở thích, khả năng tài chính

#### AI Personalization
- Tích hợp thông tin người dùng vào prompts
- Điều chỉnh phong cách trả lời theo tính cách đã chọn
- Lời chào cá nhân hóa dựa trên profile
- Context-aware responses cho từng đối tượng

### 4. Welcome Experience

#### Comprehensive Welcome Card
- **Personalized Greeting**: Lời chào tùy chỉnh cho người đã setup preferences
- **Program Overview**: Tổng quan 4 chương trình chính của FPT School
  - 💻 Công nghệ thông tin
  - 🛡️ An ninh mạng  
  - 🎨 Thiết kế đồ họa
  - 📱 Marketing số
- **Quick Questions**: 4 câu hỏi gợi ý có thể click để gửi ngay
- **CTA Button**: Dẫn đến trang cá nhân hóa

### 5. FPT School Context

#### AI Identity
- Nhận dạng là trợ lý tư vấn chính thức của FPT School
- Kiến thức sâu về các chương trình đào tạo
- Hiểu biết về FPT Corporation ecosystem
- Focus vào giáo dục thực hành, dự án

#### Target Audience Recognition
- **Học sinh THPT**: Định hướng ngành học phù hợp
- **Phụ huynh**: Thông tin về chi phí, cơ hội việc làm
- **Người đi làm**: Chương trình học song song công việc
- **Sinh viên khác**: Chuyển ngành, bổ sung kỹ năng

## 🎨 Giao diện người dùng

### Design System
- **Color Scheme**: Blue & Purple gradient chủ đạo
- **Typography**: Professional với Vietnamese language support
- **Icons**: Emoji-based để thân thiện và dễ hiểu
- **Responsive**: Mobile-first design
- **Accessibility**: Contrast tốt, readable fonts

### Key Components
- **Chat Interface**: Message bubbles với markdown support
- **Toggle Switch**: Animated web search toggle
- **Badge System**: Career-related vs General chat classification
- **Source Display**: Separate document và web sources
- **Feedback Buttons**: Inline rating system

## 📁 Cấu trúc thư mục

```
src/
├── app/
│   ├── _components/           # Shared components
│   │   └── WelcomeCard.tsx   # Welcome experience
│   ├── api/                  # API endpoints
│   │   ├── ask/              # Main chat endpoint
│   │   ├── feedback/         # Feedback collection
│   │   └── ingest/           # Document processing
│   ├── preferences/          # User preferences page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main chat interface
├── lib/
│   ├── services/            # Business logic
│   │   ├── ragService.ts    # Core RAG functionality
│   │   ├── webSearchService.ts  # Firecrawl integration
│   │   ├── userPreferencesService.ts  # User data management
│   │   ├── feedbackService.ts   # Feedback handling
│   │   ├── documentProcessor.ts # Document processing
│   │   ├── pinecone.ts      # Vector database
│   │   └── gemini.ts        # AI service
│   └── utils/               # Utilities
└── styles/                  # Global styles
```

## 🔄 Luồng hoạt động

### 1. User Journey
1. **Landing**: Người dùng vào trang chính, thấy Welcome Card
2. **Setup** (Optional): Click "Cá nhân hóa" để thiết lập preferences
3. **Chat**: Bắt đầu hỏi đáp, có thể sử dụng quick questions
4. **Web Search** (Optional): Bật web search để có thêm thông tin
5. **Feedback**: Đánh giá câu trả lời để cải thiện chất lượng

### 2. Technical Flow
1. **Question Processing**: Phân loại career-related vs general
2. **RAG Retrieval**: Tìm kiếm trong tài liệu FPT School
3. **Web Enhancement** (if enabled): Bổ sung từ Firecrawl
4. **AI Generation**: Gemini tạo câu trả lời với context
5. **Response Delivery**: Hiển thị với sources và feedback options

## 🛠️ Cài đặt và triển khai

### Environment Variables
```env
# Required
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Optional
PINECONE_ENVIRONMENT=your_pinecone_environment
```

### Installation
```bash
# Clone và install dependencies
git clone [repository-url]
cd rag-demo
pnpm install

# Build và start
pnpm build
pnpm start
```

### Document Ingestion
1. Đặt tài liệu vào thư mục `documents/`
2. Vào giao diện web, click "Khởi tạo dữ liệu"
3. Hệ thống sẽ xử lý và đưa vào vector database

## 📊 Metrics và Analytics

### User Feedback
- Positive/Negative/Neutral ratings
- Question-answer pairs với quality scores
- User preference patterns

### Usage Patterns
- Career-related vs General questions ratio
- Web search usage frequency
- Most common quick questions

### Technical Metrics
- Response time
- Retrieval accuracy
- Vector database performance

## 🔮 Tương lai phát triển

### Planned Features
- **Advanced Analytics**: Dashboard cho admin
- **Multi-language**: English support
- **Voice Interface**: Speech-to-text integration
- **Mobile App**: React Native version
- **Integration**: CRM/LMS connectivity

### Potential Improvements
- **Better Personalization**: ML-based recommendation
- **Content Management**: Admin panel for documents
- **Advanced Search**: Semantic search với filters
- **Real-time Updates**: WebSocket cho live features

## 🤝 Đóng góp

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configuration
- Component-driven development
- Responsive design principles

### Documentation
- Function-level JSDoc comments
- API endpoint documentation
- User guide updates
- Technical architecture docs

---

Hệ thống FPT School AI Counseling được thiết kế để mang lại trải nghiệm tư vấn cá nhân hóa và chính xác nhất cho người dùng, đồng thời đảm bảo tính scalable và maintainable cho việc phát triển tương lai. 