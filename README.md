# 🤖 RAG Chatbot - Tư Vấn Nghề Nghiệp

Hệ thống chatbot tư vấn nghề nghiệp sử dụng Retrieval-Augmented Generation (RAG) với NextJS, Pinecone, và Gemini AI.

## 🚀 Tính Năng

- **Xử lý tài liệu DOCX**: Tự động xử lý và phân tích các file Word
- **Chunking thông minh**: Chia nhỏ văn bản với RecursiveCharacterTextSplitter (350/20)
- **Vector Database**: Lưu trữ trên Pinecone Cloud
- **AI mạnh mẽ**: Sử dụng Google Gemini Pro cho embeddings và generation
- **UI thân thiện**: Giao diện chat đơn giản và trực quan
- **Trả lời tiếng Việt**: Tối ưu cho người dùng Việt Nam

## 🛠️ Cài Đặt

### 1. Clone dự án

```bash
git clone <repository-url>
cd rag-demo
```

### 2. Cài đặt dependencies

```bash
pnpm install
```

### 3. Cấu hình API Keys

Tạo file `.env.local` trong thư mục gốc:

```env
# Pinecone Configuration
PINECONE_API_KEY="your-pinecone-api-key-here"
PINECONE_ENVIRONMENT="your-pinecone-environment"  # e.g., "us-east1-gcp"
PINECONE_INDEX_NAME="careerbot-index"

# Google Gemini AI Configuration
GEMINI_API_KEY="your-gemini-api-key-here"

# OpenAI Configuration (optional - for embeddings)
OPENAI_API_KEY="your-openai-api-key-here"
```

### 4. Lấy API Keys

#### Pinecone API Key:
1. Đăng ký tại [Pinecone](https://pinecone.io)
2. Tạo project mới
3. Vào Dashboard → API Keys → Create API Key
4. Copy API Key và Environment

#### Gemini API Key:
1. Đăng ký tại [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API Key mới
3. Copy API Key

### 5. Chuẩn bị tài liệu

Tạo thư mục `documents/` và đặt các file DOCX:

```bash
mkdir documents
# Copy các file .docx vào thư mục documents/
```

### 6. Chạy ứng dụng

```bash
pnpm dev
```

Truy cập http://localhost:3000

## 📖 Cách Sử Dụng

### 1. Khởi tạo dữ liệu

1. Mở trình duyệt tại http://localhost:3000
2. Nhấn nút "Khởi tạo dữ liệu" để xử lý các file DOCX
3. Đợi quá trình hoàn tất (có thể mất vài phút)

### 2. Chat với bot

1. Sau khi khởi tạo xong, bạn có thể đặt câu hỏi
2. Bot sẽ trả lời dựa trên nội dung trong tài liệu
3. Xem nguồn tham khảo bên dưới mỗi câu trả lời

### 3. Quản lý hệ thống

- **Kiểm tra trạng thái**: Xem system status và số lượng vectors
- **Làm mới dữ liệu**: Xóa và tái khởi tạo index khi cần

## 🔧 API Endpoints

### POST `/api/ask`
Gửi câu hỏi tới chatbot:

```json
{
  "question": "Làm thế nào để phát triển kỹ năng lập trình?"
}
```

Phản hồi:
```json
{
  "success": true,
  "data": {
    "question": "Làm thế nào để phát triển kỹ năng lập trình?",
    "answer": "Để phát triển kỹ năng lập trình...",
    "sources": ["document1.docx", "document2.docx"],
    "hasRelevantContent": true,
    "relevantChunks": [...],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/ingest`
Khởi tạo dữ liệu từ thư mục documents:

```json
{
  "clearIndex": true,
  "documentsPath": "./documents"
}
```

### GET `/api/ingest`
Kiểm tra trạng thái index:

```json
{
  "success": true,
  "data": {
    "isIndexed": true,
    "indexStats": {
      "totalVectors": 150,
      "indexReady": true
    }
  }
}
```

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Documents     │    │   NextJS API    │    │   Pinecone DB   │
│   (.docx)       │───▶│   Routes        │───▶│   (Vectors)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   Gemini AI     │
                       │   (LLM + Embed) │
                       └─────────────────┘
```

### Các thành phần chính:

1. **Document Processor**: Xử lý DOCX với mammoth
2. **Text Splitter**: Chunking với RecursiveCharacterTextSplitter
3. **Pinecone Service**: Quản lý vector database
4. **Gemini Service**: Embedding và text generation
5. **RAG Service**: Tổng hợp các thành phần

## 🔍 Troubleshooting

### Lỗi API Key
```
Error: Service configuration error
```
**Giải pháp**: Kiểm tra API keys trong `.env.local`

### Lỗi không tìm thấy tài liệu
```
Error: No DOCX files found
```
**Giải pháp**: Đảm bảo có file .docx trong thư mục `documents/`

### Lỗi Pinecone Index
```
Error: Vector database error
```
**Giải pháp**: 
- Kiểm tra PINECONE_API_KEY và PINECONE_ENVIRONMENT
- Đảm bảo Pinecone project đang hoạt động

### Lỗi Gemini API
```
Error: Failed to generate embedding
```
**Giải pháp**: Kiểm tra GEMINI_API_KEY và quota

## 📊 Thông Số Kỹ Thuật

- **Chunk Size**: 350 characters
- **Chunk Overlap**: 20 characters
- **Vector Dimension**: 768 (Gemini embedding)
- **Top-K Retrieval**: 3 most relevant chunks
- **Similarity Threshold**: 0.7
- **Max Question Length**: 1000 characters

## 🚀 Deployment

### Vercel
1. Fork repository
2. Kết nối với Vercel
3. Thêm environment variables
4. Deploy

### Railway
1. Kết nối repository với Railway
2. Thêm environment variables
3. Deploy

**Lưu ý**: Tải lên tài liệu qua API hoặc mount volume cho thư mục documents/

## 🤝 Đóng Góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🙋‍♂️ Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần Troubleshooting
2. Xem logs trong console
3. Tạo issue trên GitHub

---

**Được phát triển với ❤️ bằng NextJS + Pinecone + Gemini AI**
