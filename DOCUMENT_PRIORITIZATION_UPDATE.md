# Document Prioritization Update - FPT School Focus

## 🎯 Objective
Aggressively prioritize FPT School document content over general conversation, ensuring that even loosely related questions route through the RAG system to provide FPT-specific guidance.

## 🔧 Changes Made

### 1. **Enhanced Question Classification** (`src/lib/services/gemini.ts`)

#### Expanded Keyword Categories
- **FPT Education Keywords**: `fpt`, `school`, `trường`, `học phí`, `tuyển sinh`, `chương trình`, etc.
- **Technology & Career Keywords**: `it`, `lập trình`, `thiết kế`, `marketing`, `cybersecurity`, etc.  
- **Career Keywords**: `nghề nghiệp`, `lương`, `tương lai`, `kỹ năng`, etc.
- **Learning Keywords**: `học`, `kiến thức`, `tài liệu`, `hướng dẫn`, etc.
- **General Interest Keywords**: `gì`, `nào`, `như thế nào`, `có thể`, etc.

#### Aggressive Classification Logic
```typescript
// Only exclude very specific non-career topics
const definitivelyNotCareerKeywords = [
  'thời tiết', 'weather', 'ăn uống', 'food', 'du lịch', 'travel',
  'phim', 'movie', 'nhạc', 'music', 'thể thao', 'sport',
  // etc.
];

// Default to career-related unless explicitly non-career
return true; // This ensures we prioritize FPT document content
```

### 2. **Enhanced RAG Processing** (`src/lib/services/ragService.ts`)

#### Increased Document Retrieval
- **Search Results**: Increased from 5 to 8 top results for better coverage
- **Score Threshold**: Lowered from 0.3 to 0.15 to include more document content
- **Fallback Threshold**: Added 0.05 threshold to use ANY available documents

#### Multi-tier Document Usage
```typescript
// Primary: Score > 0.15
const relevantResults = searchResults.filter(result => result.score > 0.15);

// Fallback: Score > 0.05 (any document content is better than none)
const anyResults = searchResults.filter(result => result.score > 0.05);

// Only use general knowledge if absolutely NO documents found
```

#### Enhanced Logging
- `🎯 Question type: Career-related (using FPT documents)`
- `📚 Prioritizing FPT School document content...`
- `📄 Using X low-score documents as better than no documents`

### 3. **Strengthened AI Prompts**

#### Updated Counseling Principles
```
NGUYÊN TẮC TƯ VẤN (QUAN TRỌNG):
1. **ƯU TIÊN TUYỆT ĐỐI**: Luôn dựa vào thông tin từ tài liệu FPT School
2. **TẬP TRUNG FPT SCHOOL**: Mọi lời khuyên phải liên kết với chương trình FPT
3. **TRÍCH DẪN TÀI LIỆU**: Luôn trích dẫn thông tin từ tài liệu FPT School
...
**CHỈ THỊ ĐẶC BIỆT**: Bắt buộc phải sử dụng và trích dẫn tài liệu FPT khi có.
```

## 📊 Expected Behavior Changes

### Before Update
- **Question**: "Lập trình khó không?"
- **Classification**: General conversation
- **Response**: Generic programming advice

### After Update  
- **Question**: "Lập trình khó không?"
- **Classification**: Career-related (contains "lập trình")
- **Document Search**: FPT School programming curriculum
- **Response**: FPT-specific programming education guidance

### Classification Examples

#### Now Treated as Career-Related:
✅ "Học gì để có việc làm tốt?" (general → career-related)  
✅ "Công nghệ thông tin thế nào?" (tech keyword)  
✅ "Tương lai ngành thiết kế?" (career + field keywords)  
✅ "FPT School có gì đặc biệt?" (FPT keyword)  
✅ "Học phí bao nhiêu?" (education keyword)  

#### Still General Conversation:
❌ "Hôm nay thời tiết thế nào?" (weather)  
❌ "Phim nào hay nhất?" (entertainment)  
❌ "Ăn gì ngon?" (food)  

## 🔄 System Flow

### 1. Question Processing
```
Input Question → Aggressive Classification → Career-Related (90%+ of questions)
```

### 2. Document Retrieval
```
RAG Search → High Score (0.15+) → Medium Score (0.05+) → Fallback (General)
```

### 3. Response Generation
```
FPT Documents + User Context + Conversation History → Tailored FPT Guidance
```

## 📈 Quality Improvements

### Document Usage Priority
1. **Primary**: High-confidence FPT document matches (score > 0.15)
2. **Secondary**: Any FPT document content (score > 0.05)  
3. **Fallback**: General knowledge only if NO documents available

### Response Characteristics
- **Always FPT-focused** when documents available
- **Specific program mentions** (IT, Cybersecurity, Design, Marketing)
- **Direct document citations** using blockquotes
- **Practical FPT pathways** instead of generic advice

### User Experience
- **More relevant answers** for FPT School inquiries
- **Consistent branding** and institutional voice
- **Document-backed credibility** in all responses
- **Reduced generic responses** that don't help with FPT decisions

## 🧪 Testing Scenarios

### High-Priority Questions (Should Always Use Documents)
```
"Ngành IT ra trường làm gì?"
"Học phí FPT School bao nhiêu?"
"Điều kiện tuyển sinh như thế nào?"
"Cơ hội việc làm sau khi tốt nghiệp?"
```

### Medium-Priority Questions (Should Use Documents When Available)
```
"Lập trình có khó không?"
"Marketing số triển vọng thế nào?"
"Thiết kế đồ họa cần kỹ năng gì?"
"Học công nghệ có tương lai không?"
```

### Low-Priority Questions (May Use General Knowledge)
```
"Hôm nay thời tiết thế nào?"
"Phim nào đang hot?"
"Ăn gì cho healthy?"
```

## ✅ Success Metrics

### Document Utilization
- **Target**: >80% of questions should use FPT documents
- **Measurement**: Check `hasRelevantContent: true` ratio
- **Current Threshold**: Even 0.05 similarity scores now count as relevant

### Response Quality
- **FPT-specific content** in answers
- **Direct document quotes** using `>` markdown
- **Program-specific guidance** rather than generic advice
- **Institutional credibility** maintained

### User Satisfaction
- **Relevant answers** for FPT School inquiries
- **Actionable guidance** based on actual programs
- **Consistent messaging** aligned with FPT School values

---

**Result**: The system now aggressively prioritizes FPT School document content, ensuring that almost all educational and career-related questions (which covers most user inquiries) will receive responses based on official FPT School information rather than generic AI knowledge. 