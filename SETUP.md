# 🚀 Hướng Dẫn Cài Đặt Nhanh

## 1. Tạo file `.env.local`

Tạo file `.env.local` trong thư mục gốc với nội dung sau:

```env
# RAG System Configuration
# Pinecone Configuration
PINECONE_API_KEY="your-pinecone-api-key-here"
PINECONE_ENVIRONMENT="us-east1-gcp"
PINECONE_INDEX_NAME="careerbot-index"

# Google Gemini AI Configuration  
GEMINI_API_KEY="your-gemini-api-key-here"

# OpenAI Configuration (optional - for embeddings)
OPENAI_API_KEY="your-openai-api-key-here"

# Skip validation for build (remove this line when you have real API keys)
SKIP_ENV_VALIDATION=true
```

## 2. Lấy API Keys

### Pinecone API Key:
1. Đăng ký tại [Pinecone](https://pinecone.io)
2. Tạo project mới
3. Vào Dashboard → API Keys → Create API Key
4. Copy API Key và Environment

### Gemini API Key:
1. Đăng ký tại [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API Key mới
3. Copy API Key

## 3. Tạo tài liệu mẫu

Tạo file DOCX trong thư mục `documents/` hoặc convert file txt đã có:

```bash
# Convert sample text to DOCX (sử dụng Word hoặc Google Docs)
# Copy file .docx vào thư mục documents/
```

## 4. Chạy ứng dụng

```bash
pnpm dev
```

Truy cập http://localhost:3000 và thử nghiệm hệ thống!

## 5. Test với dữ liệu mẫu

1. Convert file `documents/sample-career-guide.txt` thành DOCX
2. Đặt vào thư mục `documents/`
3. Nhấn "Khởi tạo dữ liệu" 
4. Hỏi bot: "Làm thế nào để phát triển kỹ năng lập trình?" 