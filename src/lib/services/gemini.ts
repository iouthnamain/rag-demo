import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '~/env';

/**
 * Google Gemini AI Service
 * Handles text generation and embeddings for RAG system
 */
class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI;
  private model: unknown;
  private embeddingModel: unknown;

  private constructor() {
    // Check if we're in demo mode
    if (env.GEMINI_API_KEY === 'demo') {
      console.log('🔧 Running in demo mode - Gemini AI disabled');
      // Create mock objects for demo mode
      this.genAI = {} as GoogleGenerativeAI;
      this.model = {} as unknown;
      this.embeddingModel = {} as unknown;
      return;
    }
    
    // Initialize Google Generative AI with API key
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  /**
   * Get singleton instance of GeminiService
   */
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Generate embeddings for text using Gemini
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    // Demo mode - return mock embedding
    if (env.GEMINI_API_KEY === 'demo') {
      return this.generateMockEmbedding(text);
    }
    
    try {
      const result = await (this.embeddingModel as { embedContent: (text: string) => Promise<{ embedding: { values: number[] } }> }).embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Generate answer using Gemini AI with context array
   */
  public async generateAnswer(
    question: string, 
    context: string[]
  ): Promise<string>;

  /**
   * Generate answer using Gemini AI with string context and custom prompt
   */
  public async generateAnswer(
    question: string, 
    context: string, 
    customPrompt?: string
  ): Promise<string>;

  /**
   * Implementation of generateAnswer
   */
  public async generateAnswer(
    question: string, 
    context: string | string[],
    customPrompt?: string
  ): Promise<string> {
    // Demo mode - return mock answer
    if (env.GEMINI_API_KEY === 'demo') {
      const contextArray = Array.isArray(context) ? context : [context];
      return this.generateMockAnswer(question, contextArray);
    }
    
    try {
      let prompt: string;
      
      if (customPrompt) {
        // Use custom prompt if provided
        prompt = customPrompt;
      } else {
        // Create prompt with context and question
        const contextText = Array.isArray(context) ? context.join('\n\n') : context;
        prompt = this.buildPrompt(question, contextText);
      }
      
      const result = await (this.model as { generateContent: (prompt: string) => Promise<{ response: Promise<{ text: () => string }> }> }).generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text.trim();
    } catch (error) {
      console.error('Error generating answer with Gemini:', error);
      throw error;
    }
  }

  /**
   * Build prompt for career counseling chatbot
   */
  private buildPrompt(question: string, context: string): string {
    return `Bạn là một chuyên gia tư vấn nghề nghiệp thông minh và nhiệt tình. 
Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa trên thông tin được cung cấp từ tài liệu.

NGUYÊN TẮC QUAN TRỌNG:
1. Chỉ trả lời dựa trên thông tin có trong tài liệu được cung cấp
2. Nếu không có đủ thông tin để trả lời, hãy nói: "Tôi chưa đủ dữ liệu để trả lời câu hỏi này từ tài liệu hiện có."
3. Trả lời bằng tiếng Việt
4. Giữ giọng điệu thân thiện, chuyên nghiệp
5. Cung cấp thông tin cụ thể và hữu ích
6. **ĐỊNH DẠNG**: Sử dụng Markdown để định dạng câu trả lời:
   - Dùng **in đậm** cho các điểm quan trọng
   - Dùng *in nghiêng* cho nhấn mạnh
   - Dùng danh sách có dấu đầu dòng (-) hoặc số (1.) khi liệt kê
   - Dùng > để trích dẫn thông tin từ tài liệu
   - Dùng \`code\` cho thuật ngữ chuyên môn

THÔNG TIN TỪ TÀI LIỆU:
${context}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}

TRẢ LỜI (bằng tiếng Việt, định dạng Markdown):`;
  }

  /**
   * Check if the response indicates insufficient data
   */
  public isInsufficientDataResponse(response: string): boolean {
    const insufficientDataPhrases = [
      'tôi chưa đủ dữ liệu',
      'không có đủ thông tin',
      'thông tin không đầy đủ',
      'không thể trả lời'
    ];
    
    return insufficientDataPhrases.some(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    );
  }

  /**
   * Generate a fallback response when no relevant context is found
   */
  public generateFallbackResponse(): string {
    return "Tôi chưa đủ dữ liệu để trả lời câu hỏi này từ tài liệu hiện có.";
  }

  /**
   * Generate mock embedding for demo mode
   */
  private generateMockEmbedding(text: string): number[] {
    // Generate a deterministic but varied embedding based on text content
    const embedding = new Array(768).fill(0);
    const hash = this.simpleHash(text);
    
    for (let i = 0; i < 768; i++) {
      embedding[i] = Math.sin(hash + i) * 0.1;
    }
    
    return embedding;
  }

  /**
   * Generate mock answer for demo mode
   */
  private generateMockAnswer(question: string, context: string[]): string {
    if (context.length === 0) {
      return this.generateFallbackResponse();
    }
    
    // Simple mock response based on context
    const contextText = context.join(' ');
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('nghề nghiệp') || questionLower.includes('career')) {
      return `## Tư vấn nghề nghiệp

**Dựa trên tài liệu**, tôi có thể giúp bạn về vấn đề nghề nghiệp:

> ${contextText.substring(0, 200)}...

*Thông tin này được trích xuất từ tài liệu hướng dẫn nghề nghiệp.*`;
    }
    
    if (questionLower.includes('kỹ năng') || questionLower.includes('skill')) {
      return `## Về kỹ năng

**Tài liệu đề cập đến:**

> ${contextText.substring(0, 200)}...

- Đây là thông tin được trích từ tài liệu
- Bạn có thể tham khảo để phát triển kỹ năng`;
    }
    
    return `## Câu hỏi: *"${question}"*

**Dựa trên tài liệu có sẵn:**

> ${contextText.substring(0, 300)}...

*Thông tin được trích xuất từ cơ sở dữ liệu tài liệu.*`;
  }

  /**
   * Simple hash function for generating deterministic embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Check if a question is career-related or general conversation
   */
  public isCareerRelatedQuestion(question: string): boolean {
    const careerKeywords = [
      'nghề nghiệp', 'career', 'công việc', 'job', 'work',
      'kỹ năng', 'skill', 'năng lực', 'ability',
      'tuyển dụng', 'recruitment', 'phỏng vấn', 'interview',
      'lương', 'salary', 'thu nhập', 'income',
      'thăng tiến', 'promotion', 'phát triển', 'development',
      'học tập', 'learning', 'đào tạo', 'training',
      'kinh nghiệm', 'experience', 'chuyên môn', 'expertise',
      'ngành', 'industry', 'lĩnh vực', 'field',
      'cv', 'resume', 'hồ sơ', 'profile',
      'tương lai', 'future', 'định hướng', 'direction'
    ];
    
    const questionLower = question.toLowerCase();
    return careerKeywords.some(keyword => questionLower.includes(keyword));
  }

  /**
   * Generate a general conversation response (not career-related)
   */
  public async generateGeneralResponse(question: string): Promise<string> {
    // Demo mode - return mock general response
    if (env.GEMINI_API_KEY === 'demo') {
      return this.generateMockGeneralResponse(question);
    }
    
    try {
      const prompt = this.buildGeneralPrompt(question);
      
      const result = await (this.model as { generateContent: (prompt: string) => Promise<{ response: Promise<{ text: () => string }> }> }).generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text.trim();
    } catch (error) {
      console.error('Error generating general response with Gemini:', error);
      return this.generateMockGeneralResponse(question);
    }
  }

  /**
   * Build prompt for general conversation
   */
  private buildGeneralPrompt(question: string): string {
    return `Bạn là một trợ lý AI thân thiện và hữu ích. Hãy trả lời câu hỏi của người dùng một cách tự nhiên và thân thiện.

NGUYÊN TẮC:
1. Trả lời bằng tiếng Việt
2. Giữ giọng điệu thân thiện, lịch sự
3. Nếu không biết câu trả lời, hãy thành thật nói không biết
4. Có thể hỏi lại để hiểu rõ hơn câu hỏi
5. **ĐỊNH DẠNG**: Sử dụng Markdown để định dạng câu trả lời khi cần thiết:
   - Dùng **in đậm** cho điểm quan trọng
   - Dùng *in nghiêng* cho nhấn mạnh
   - Dùng danh sách (-) khi liệt kê nhiều ý

CÂU HỎI: ${question}

TRẢ LỜI (định dạng Markdown khi cần):`;
  }

  /**
   * Generate mock general response for demo mode
   */
  private generateMockGeneralResponse(question: string): string {
    const questionLower = question.toLowerCase();
    
    // Greetings
    if (questionLower.includes('xin chào') || questionLower.includes('hello') || questionLower.includes('hi')) {
      return '👋 **Xin chào!** Tôi là trợ lý AI của bạn. \n\nTôi có thể giúp bạn:\n- 💼 Trả lời các câu hỏi về **tư vấn nghề nghiệp**\n- 💬 Trò chuyện thông thường\n\n*Bạn cần tôi giúp gì?*';
    }
    
    // How are you
    if (questionLower.includes('khỏe không') || questionLower.includes('how are you') || questionLower.includes('thế nào')) {
      return 'Cảm ơn bạn đã hỏi! Tôi đang hoạt động tốt và sẵn sàng hỗ trợ bạn. Bạn có cần tôi giúp gì không?';
    }
    
    // Thank you
    if (questionLower.includes('cảm ơn') || questionLower.includes('thank you') || questionLower.includes('thanks')) {
      return 'Không có gì! Tôi rất vui được giúp đỡ bạn. Nếu bạn có thêm câu hỏi nào khác, đừng ngần ngại hỏi nhé!';
    }
    
    // Weather
    if (questionLower.includes('thời tiết') || questionLower.includes('weather')) {
      return 'Tôi không thể kiểm tra thời tiết hiện tại, nhưng bạn có thể xem dự báo thời tiết trên các ứng dụng như AccuWeather hoặc Weather.com. Bạn có câu hỏi nào khác tôi có thể giúp không?';
    }
    
    // Time
    if (questionLower.includes('mấy giờ') || questionLower.includes('time') || questionLower.includes('thời gian')) {
      return 'Tôi không thể xem giờ hiện tại, nhưng bạn có thể kiểm tra trên thiết bị của mình. Tôi có thể giúp bạn với những câu hỏi khác không?';
    }
    
    // General fallback
    return `Tôi hiểu bạn đang hỏi về "${question}". Đây có vẻ như không phải là câu hỏi về tư vấn nghề nghiệp. Tôi có thể trả lời tốt nhất các câu hỏi liên quan đến sự nghiệp, kỹ năng, và phát triển nghề nghiệp. Bạn có muốn hỏi gì về những chủ đề này không?`;
  }
}

export { GeminiService }; 

