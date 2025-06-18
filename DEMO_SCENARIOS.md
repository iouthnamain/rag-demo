# FPT School Counseling System - Demo Scenarios

## 🎭 Kịch bản demo để thể hiện tính năng

### Scenario 1: Học sinh THPT mới tìm hiểu
**Đối tượng**: Nguyễn Văn An - Học sinh lớp 12, chưa biết chọn ngành gì

**Hành trình demo**:
1. **Landing**: Vào trang chính, thấy Welcome Card với tổng quan 4 ngành
2. **Quick Question**: Click "Ngành nào phù hợp với người thích toán và logic?"
3. **Initial Response**: Nhận câu trả lời chung về IT và Cybersecurity
4. **Personalization**: Click "🚀 Cá nhân hóa trợ lý tư vấn"
5. **Setup Profile**:
   - Tên: Nguyễn Văn An
   - Hiện tại: Học sinh lớp 12
   - Tính cách: Phân tích, Chi tiết, Chuyên nghiệp
   - Thông tin thêm: "Em thích toán, học khá về lý, muốn có việc làm ổn định sau này"
6. **Personalized Chat**: Quay lại chat, thấy lời chào cá nhân hóa
7. **Follow-up Question**: "Mức lương kỹ sư IT thế nào? Em lo kinh tế gia đình"
8. **Web Search**: Bật web search để có thông tin lương mới nhất
9. **Feedback**: Đánh giá câu trả lời 👍

**Kết quả mong đợi**: Câu trả lời chi tiết, phân tích, chuyên nghiệp về triển vọng nghề IT

### Scenario 2: Phụ huynh quan tâm chi phí
**Đối tượng**: Chị Trần Thị Bình - Phụ huynh, con đang học lớp 11

**Hành trình demo**:
1. **Direct Question**: "Học phí FPT School bao nhiêu? Con tôi quan tâm ngành thiết kế"
2. **Initial Response**: Thông tin chung về học phí và ngành thiết kế
3. **Setup Profile**: 
   - Tên: Trần Thị Bình
   - Hiện tại: Phụ huynh
   - Tính cách: Đồng cảm, Kiên nhẫn, Thực tế
   - Thông tin: "Con gái tôi thích vẽ, năng khiếu nghệ thuật nhưng gia đình kinh tế trung bình"
4. **Follow-up**: "Có học bổng hay hỗ trợ tài chính không?"
5. **Career Prospects**: "Ngành thiết kế đồ họa có dễ xin việc không?"

**Kết quả mong đợi**: Câu trả lời đồng cảm, thực tế về chi phí và cơ hội nghề nghiệp

### Scenario 3: Người đi làm muốn chuyển ngành  
**Đối tượng**: Anh Lê Minh Tuấn - Nhân viên bán hàng, muốn chuyển sang IT

**Hành trình demo**:
1. **Complex Question**: "Tôi 25 tuổi, làm bán hàng 3 năm, muốn chuyển sang IT có được không?"
2. **Setup Profile**:
   - Tên: Lê Minh Tuấn  
   - Hiện tại: Nhân viên bán hàng
   - Tính cách: Động viên, Thực tế, Phân tích
   - Thông tin: "Làm việc từ 9-6, muốn học thêm buổi tối, có thể đầu tư 1-2 năm"
3. **Web Search Enabled**: "Lộ trình học lập trình cho người mới bắt đầu 2024"
4. **Time Management**: "Học part-time có tốt nghiệp được không?"
5. **Salary Transition**: "Lương junior dev so với nhân viên bán hàng thế nào?"

**Kết quả mong đợi**: Lộ trình rõ ràng, động viên nhưng thực tế về timeline và expectations

### Scenario 4: Sinh viên khác ngành muốn học thêm
**Đối tượng**: Em Phạm Thu Hà - Sinh viên Kinh tế, muốn học thêm Digital Marketing

**Hành trình demo**:
1. **Question**: "Em học kinh tế nhưng thấy Digital Marketing hot, có nên học thêm không?"
2. **Profile Setup**:
   - Tên: Phạm Thu Hà
   - Hiện tại: Sinh viên năm 3 Kinh tế  
   - Tính cách: Sáng tạo, Thân thiện, Động viên
   - Thông tin: "Em thích social media, hay post content, muốn kết hợp với kiến thức kinh tế"
3. **Integration Question**: "Digital Marketing có phù hợp với background kinh tế không?"
4. **Web Search**: "Cơ hội việc làm Digital Marketing ở Việt Nam"
5. **Practical Learning**: "Có thực tập hay dự án thực tế không?"

**Kết quả mong đợi**: Khuyến khích kết hợp strengths, gợi ý career path phù hợp

## 🧪 Test Cases cho tính năng

### Web Search Integration
```
Input: "Mức lương lập trình viên mới ra trường 2024"
Expected: Kết hợp thông tin từ tài liệu FPT + web search results
Badge: 🔍 Web Search hiển thị
Sources: Cả document sources + clickable web links
```

### Conversation Context  
```
User: "Ngành IT ra trường làm gì?"
AI: [Response about IT careers]
User: "Lương thế nào?"
Expected: AI hiểu "lương" refers to IT careers from previous context
```

### Personalization
```
Profile: Tính cách "Súc tích" + "Chuyên nghiệp"
Expected Response Style: Bullet points, brief, formal tone
Profile: Tính cách "Thân thiện" + "Chi tiết"  
Expected Response Style: Detailed explanation, casual tone
```

### Feedback System
```
Give 👍 feedback → "✅ Cảm ơn phản hồi của bạn!"
Give 👎 feedback → "✅ Cảm ơn phản hồi của bạn! Tôi sẽ học từ điều này."
Feedback stored for future improvements
```

### Quick Questions
```
Click "Ngành nào phù hợp với người thích toán và logic?"
→ Auto-fills input field
→ Auto-sends question  
→ Gets personalized response based on profile
```

## 📱 Mobile Testing Scenarios

### Touch Interactions
- Toggle web search switch
- Scroll through long AI responses
- Click quick question buttons
- Navigate to preferences page

### Responsive Layout
- Chat bubbles adapt to screen width
- Welcome card stacks vertically
- Preferences form remains usable
- Sources display wraps properly

## 🎯 Success Metrics

### User Engagement
- **Time on page**: Users stay longer with personalized experience
- **Question depth**: Follow-up questions indicate engagement  
- **Preference setup**: % users who complete personalization
- **Quick questions**: Usage rate of suggested questions

### Quality Indicators
- **Positive feedback**: >70% positive ratings
- **Web search usage**: Balanced usage shows feature value
- **Conversation length**: Multi-turn conversations
- **Return visits**: localStorage shows returning users

### Technical Performance
- **Response time**: <3 seconds for RAG responses
- **Web search time**: <5 seconds additional for web enhancement
- **Build success**: No compilation errors
- **Mobile performance**: Smooth interactions on mobile

## 🔄 Regression Testing

### After each update, verify:
1. **Basic Chat**: Send question, get response with sources
2. **Web Search**: Toggle works, sources appear correctly  
3. **Personalization**: Profile saves, affects responses
4. **Quick Questions**: Click works, auto-sends
5. **Feedback**: Buttons work, confirmation appears
6. **Mobile**: All features work on mobile
7. **Build**: `pnpm build` succeeds
8. **Document Ingestion**: New documents can be processed

---

Các kịch bản này giúp demo đầy đủ khả năng của hệ thống FPT School Counseling và đảm bảo tất cả tính năng hoạt động như mong đợi. 