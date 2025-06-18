import { PineconeService } from './pinecone';
import { GeminiService } from './gemini';
import { FeedbackService } from './feedbackService';
import { WebSearchService } from './webSearchService';
import { UserPreferencesService } from './userPreferencesService';
import DocumentProcessorService from './documentProcessor';
import path from 'path';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Orchestrates document processing, vector storage, and question answering
 */
export class RAGService {
  private static instance: RAGService;
  private pineconeService: PineconeService;
  private geminiService: GeminiService;
  private documentProcessor: DocumentProcessorService;
  private isIndexed = false;

  private constructor() {
    this.pineconeService = PineconeService.getInstance();
    this.geminiService = GeminiService.getInstance();
    this.documentProcessor = new DocumentProcessorService();
  }

  /**
   * Get singleton instance of RAGService
   */
  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Initialize and ingest documents into vector database
   */
  public async ingestDocuments(documentsPath?: string): Promise<{
    totalChunks: number;
    processedFiles: string[];
    statistics: unknown;
  }> {
    try {
      console.log('🚀 Starting document ingestion process...');
      
      // Use default documents path if not provided
      const docsPath = documentsPath ?? path.join(process.cwd(), 'documents');
      
      // Process documents and create chunks
      console.log('📄 Processing documents...');
      const chunks = await this.documentProcessor.processDocumentsDirectory(docsPath);
      
      if (chunks.length === 0) {
        throw new Error('No document chunks were created');
      }
      
      // Get statistics
      const statistics = this.documentProcessor.getChunkStatistics(chunks);
      console.log('📊 Document Statistics:', statistics);
      
      // Generate embeddings for all chunks
      console.log('🔄 Generating embeddings...');
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.geminiService.generateEmbeddings(texts);
      
      // Ensure Pinecone index exists with correct dimension
      const embeddingDimension = embeddings[0]?.length ?? 768;
      await this.pineconeService.ensureIndexExists(embeddingDimension);
      
      // Prepare vectors for Pinecone
      const vectors = chunks.map((chunk, index) => ({
        id: chunk.id,
        values: embeddings[index]!,
        metadata: {
          content: chunk.content,
          source: chunk.metadata.source,
          chunkIndex: chunk.metadata.chunkIndex,
          contentLength: chunk.metadata.contentLength,
        },
      }));
      
      // Upload vectors to Pinecone
      console.log('🗄️ Uploading vectors to Pinecone...');
      await this.pineconeService.upsertVectors(vectors);
      
      this.isIndexed = true;
      console.log('✅ Document ingestion completed successfully!');
      
      return {
        totalChunks: chunks.length,
        processedFiles: statistics.sources,
        statistics,
      };
      
    } catch (error) {
      console.error('❌ Error during document ingestion:', error);
      throw error;
    }
  }

  /**
   * Ask a question with intelligent routing between career advice and general chat
   */
  public async askQuestion(
    question: string,
    conversationId: string = 'default',
    webSearchEnabled: boolean = false
  ): Promise<{
    answer: string;
    sources: string[];
    webSources?: string[];
    hasRelevantContent: boolean;
    isCareerRelated: boolean;
    confidence: number;
    usedWebSearch?: boolean;
  }> {
    try {
      console.log(`📝 Processing question: ${question.substring(0, 50)}...`);
      console.log(`🔍 Processing question: ${question}`);

      const geminiService = GeminiService.getInstance();
      const feedbackService = FeedbackService.getInstance();
      
      // Add user message to conversation history
      feedbackService.addMessage(conversationId, 'user', question);
      
      // Check if question is career-related (very aggressive classification now)
      const isCareerRelated = geminiService.isCareerRelatedQuestion(question);
      console.log(`🎯 Question type: ${isCareerRelated ? 'Career-related (using FPT documents)' : 'General conversation'}`);

      let answer: string;
      let sources: string[] = [];
      let webSources: string[] = [];
      let hasRelevantContent = false;
      let confidence = 0.5;
      let usedWebSearch = false;

      if (isCareerRelated) {
        // Career-related question - ALWAYS use RAG with FPT documents first
        console.log('📚 Prioritizing FPT School document content...');
        const ragResult = await this.processCareerQuestion(question, conversationId, webSearchEnabled);
        answer = ragResult.answer;
        sources = ragResult.sources;
        webSources = ragResult.webSources || [];
        hasRelevantContent = ragResult.hasRelevantContent;
        confidence = ragResult.confidence;
        usedWebSearch = ragResult.usedWebSearch || false;
      } else {
        // Only truly general conversation (very rare now) - use general AI response
        console.log('💬 Processing as general conversation...');
        if (webSearchEnabled) {
          const webResult = await this.processGeneralQuestionWithWebSearch(question, conversationId);
          answer = webResult.answer;
          webSources = webResult.webSources || [];
          usedWebSearch = true;
          confidence = 0.8;
        } else {
          answer = await this.processGeneralQuestion(question, conversationId);
          confidence = 0.8; // High confidence for general chat
        }
      }

      // Add assistant response to conversation history
      feedbackService.addMessage(conversationId, 'assistant', answer, {
        isCareerRelated,
        sources: sources.length > 0 ? sources : undefined,
      });

      console.log('✅ Question answered successfully');

      return {
        answer,
        sources,
        webSources: webSources.length > 0 ? webSources : undefined,
        hasRelevantContent,
        isCareerRelated,
        confidence,
        usedWebSearch,
      };
    } catch (error) {
      console.error('❌ Error answering question:', error);
      
      // Fallback response
      const fallbackAnswer = 'Xin lỗi, tôi đang gặp một chút vấn đề kỹ thuật. Bạn có thể thử hỏi lại câu hỏi không?';
      
      return {
        answer: fallbackAnswer,
        sources: [],
        hasRelevantContent: false,
        isCareerRelated: false,
        confidence: 0.1,
      };
    }
  }

  /**
   * Process career-related questions using RAG
   */
  private async processCareerQuestion(
    question: string,
    conversationId: string,
    webSearchEnabled: boolean = false
  ): Promise<{
    answer: string;
    sources: string[];
    webSources?: string[];
    hasRelevantContent: boolean;
    confidence: number;
    usedWebSearch?: boolean;
  }> {
    const geminiService = GeminiService.getInstance();
    const feedbackService = FeedbackService.getInstance();
    
    // Check for learned responses first
    const learnedResponses = feedbackService.getLearnedResponses(question);
    if (learnedResponses.length > 0) {
      console.log('🧠 Using learned response from previous positive feedback');
      return {
        answer: learnedResponses[Math.floor(Math.random() * learnedResponses.length)],
        sources: ['learned_response'],
        hasRelevantContent: true,
        confidence: 0.9,
        usedWebSearch: false,
      };
    }

    // Get conversation context
    const conversationContext = feedbackService.getConversationContext(conversationId, 5);
    
    // Generate embedding for the question
    const questionEmbedding = await geminiService.generateEmbedding(question);
    
    // Search for relevant documents - get more results to ensure coverage
    const searchResults = await this.pineconeService.similaritySearch(
      questionEmbedding,
      8 // top 8 results for better coverage
    );
    
    console.log(`🔍 Found ${searchResults.length} search results`);
    
    // Use MUCH lower threshold to prioritize document content over general knowledge
    // For FPT School counseling, even loosely related content is better than generic responses
    const relevantResults = searchResults.filter(result => result.score > 0.15);
    
    let webSources: string[] = [];
    let webContext = '';
    let usedWebSearch = false;

    // If web search is enabled, search for additional information
    if (webSearchEnabled) {
      try {
        const webSearchService = WebSearchService.getInstance();
        const webResults = await webSearchService.searchWeb(question, 3);
        const webInfo = webSearchService.extractKeyInformation(webResults.results);
        webContext = webInfo.combinedContent;
        webSources = webInfo.sources;
        usedWebSearch = true;
        console.log(`🔍 Web search completed: ${webResults.results.length} results`);
      } catch (error) {
        console.error('⚠️ Web search failed:', error);
        // Continue without web search if it fails
      }
    }

    if (relevantResults.length === 0) {
      console.log('ℹ️ No high-score documents found, trying with ANY available document content...');
      
      // Try again with even lower threshold to get SOME document content
      const anyResults = searchResults.filter(result => result.score > 0.05);
      
      if (anyResults.length > 0) {
        console.log(`📄 Using ${anyResults.length} low-score documents as better than no documents`);
        // Use the low-score documents anyway - FPT documents are better than no documents
        const contextText = anyResults
          .map(result => result.metadata?.text || '')
          .join('\n\n');
        
        const sources = [...new Set(anyResults
          .map(result => result.metadata?.source || 'unknown')
          .filter(source => source !== 'unknown'))];
        
        // Combine with web search if available
        let combinedContext = contextText;
        if (webContext) {
          combinedContext = `${contextText}\n\nTHÔNG TIN BỔ SUNG TỪ WEB:\n${webContext}`;
        }
        
        const contextualPrompt = this.buildContextualCareerPrompt(question, conversationContext, combinedContext);
        const answer = await geminiService.generateAnswer(question, combinedContext, contextualPrompt);
        
        return {
          answer,
          sources,
          webSources: webSources.length > 0 ? webSources : undefined,
          hasRelevantContent: true, // Still mark as relevant since we used FPT documents
          confidence: webSources.length > 0 ? 0.65 : 0.55, // Lower confidence but still document-based
          usedWebSearch,
        };
      }
      
      console.log('⚠️ Absolutely no document content found, using general career knowledge');
      
      // Only fall back to general knowledge if NO documents found at all
      let combinedContext = '';
      if (webContext) {
        combinedContext = `THÔNG TIN TỪ WEB:\n${webContext}\n\n`;
      }
      
      // Use general career knowledge with conversation context
      const contextualPrompt = this.buildContextualCareerPrompt(question, conversationContext, combinedContext);
      const answer = await geminiService.generateAnswer(question, '', contextualPrompt);
      
      return {
        answer,
        sources: ['general_knowledge'],
        webSources: webSources.length > 0 ? webSources : undefined,
        hasRelevantContent: false,
        confidence: webSources.length > 0 ? 0.75 : 0.6,
        usedWebSearch,
      };
    }
    
    // Extract context from relevant results
    const contextText = relevantResults
      .map(result => result.metadata?.text || '')
      .join('\n\n');
    
    const sources = [...new Set(relevantResults
      .map(result => result.metadata?.source || 'unknown')
      .filter(source => source !== 'unknown'))];
    
    console.log(`📚 Using context from sources: ${sources.join(', ')}`);
    
    // Combine document context with web search context if available
    let combinedContext = contextText;
    if (webContext) {
      combinedContext = `${contextText}\n\nTHÔNG TIN BỔ SUNG TỪ WEB:\n${webContext}`;
    }
    
    // Build contextual prompt with conversation history
    const contextualPrompt = this.buildContextualCareerPrompt(question, conversationContext, combinedContext);
    
    // Generate answer using the context
    const answer = await geminiService.generateAnswer(question, combinedContext, contextualPrompt);
    
    // Calculate confidence based on search scores
    const avgScore = relevantResults.reduce((sum, result) => sum + result.score, 0) / relevantResults.length;
    let confidence = Math.min(0.95, avgScore + 0.2);
    
    // Boost confidence if web search provided additional context
    if (webSources.length > 0) {
      confidence = Math.min(0.98, confidence + 0.1);
    }
    
    return {
      answer,
      sources,
      webSources: webSources.length > 0 ? webSources : undefined,
      hasRelevantContent: true,
      confidence,
      usedWebSearch,
    };
  }

  /**
   * Process general conversation questions
   */
  private async processGeneralQuestion(
    question: string,
    conversationId: string
  ): Promise<string> {
    const geminiService = GeminiService.getInstance();
    const feedbackService = FeedbackService.getInstance();
    const preferencesService = UserPreferencesService.getInstance();
    
    // Get conversation context
    const conversationContext = feedbackService.getConversationContext(conversationId, 3);
    
    // Check for learned responses
    const learnedResponses = feedbackService.getLearnedResponses(question);
    if (learnedResponses.length > 0) {
      console.log('🧠 Using learned general response');
      return learnedResponses[Math.floor(Math.random() * learnedResponses.length)];
    }
    
    // Get user preferences for personalization
    const userContext = preferencesService.getUserContext();
    const personalityInstruction = preferencesService.getPersonalityInstruction();
    
    // Generate contextual general response
    let contextualQuestion = question;
    
    // Add user preferences to context
    let fullContext = personalityInstruction;
    if (userContext) {
      fullContext += userContext;
    }
    
    if (conversationContext.length > 0) {
      const recentContext = conversationContext
        .slice(-2)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      contextualQuestion = `${fullContext}\n\nNgữ cảnh cuộc trò chuyện:\n${recentContext}\n\nCâu hỏi hiện tại: ${question}`;
    } else {
      contextualQuestion = `${fullContext}\n\nCâu hỏi: ${question}`;
    }
    
    return await geminiService.generateGeneralResponse(contextualQuestion);
  }

  /**
   * Process general questions with web search
   */
  private async processGeneralQuestionWithWebSearch(
    question: string,
    conversationId: string
  ): Promise<{
    answer: string;
    webSources?: string[];
  }> {
    const geminiService = GeminiService.getInstance();
    const feedbackService = FeedbackService.getInstance();
    const webSearchService = WebSearchService.getInstance();
    const preferencesService = UserPreferencesService.getInstance();
    
    // Get conversation context and user preferences
    const conversationContext = feedbackService.getConversationContext(conversationId, 3);
    const userContext = preferencesService.getUserContext();
    const personalityInstruction = preferencesService.getPersonalityInstruction();
    
    try {
      // Perform web search
      const webResults = await webSearchService.searchWeb(question, 3);
      const webInfo = webSearchService.extractKeyInformation(webResults.results);
      
      console.log(`🔍 Web search for general question completed: ${webResults.results.length} results`);
      
      // Build prompt with web context and user preferences
      let contextualQuestion = question;
      let fullContext = personalityInstruction;
      if (userContext) {
        fullContext += userContext;
      }
      
      if (conversationContext.length > 0) {
        const recentContext = conversationContext
          .slice(-2)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        contextualQuestion = `${fullContext}\n\nNgữ cảnh cuộc trò chuyện:\n${recentContext}\n\nThông tin từ web:\n${webInfo.combinedContent}\n\nCâu hỏi hiện tại: ${question}`;
      } else {
        contextualQuestion = `${fullContext}\n\nThông tin từ web:\n${webInfo.combinedContent}\n\nCâu hỏi: ${question}`;
      }
      
      const answer = await geminiService.generateGeneralResponse(contextualQuestion);
      
      return {
        answer,
        webSources: webInfo.sources,
      };
    } catch (error) {
      console.error('⚠️ Web search failed for general question:', error);
      
      // Fallback to regular general response with user preferences
      let contextualQuestion = question;
      let fullContext = personalityInstruction;
      if (userContext) {
        fullContext += userContext;
      }
      
      if (conversationContext.length > 0) {
        const recentContext = conversationContext
          .slice(-2)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        contextualQuestion = `${fullContext}\n\nNgữ cảnh cuộc trò chuyện:\n${recentContext}\n\nCâu hỏi hiện tại: ${question}`;
      } else {
        contextualQuestion = `${fullContext}\n\nCâu hỏi: ${question}`;
      }
      
      const answer = await geminiService.generateGeneralResponse(contextualQuestion);
      
      return {
        answer,
      };
    }
  }

  /**
   * Build contextual career prompt with conversation history
   */
  private buildContextualCareerPrompt(
    question: string,
    conversationContext: Array<{ role: 'user' | 'assistant'; content: string; isCareerRelated?: boolean }>,
    documentContext?: string
  ): string {
    // Get user preferences for personalization
    const preferencesService = UserPreferencesService.getInstance();
    const userContext = preferencesService.getUserContext();
    const personalityInstruction = preferencesService.getPersonalityInstruction();

    let prompt = `Bạn là chuyên gia tư vấn tuyển sinh của FPT School - trường đào tạo công nghệ hàng đầu Việt Nam. Bạn có kinh nghiệm sâu rộng về các ngành học công nghệ, xu hướng thị trường lao động và định hướng nghề nghiệp cho sinh viên.

${userContext}

BỐI CẢNH FPT SCHOOL:
- Chuyên đào tạo các ngành công nghệ: Công nghệ thông tin, An ninh mạng, Thiết kế đồ họa, Marketing số, Kinh doanh quốc tế
- Phương pháp học tập thực hành, dự án thực tế từ doanh nghiệp
- Cơ hội thực tập và làm việc tại hệ sinh thái FPT Corporation
- Môi trường học tập quốc tế với nhiều chương trình trao đổi

NGUYÊN TẮC TƯ VẤN (QUAN TRỌNG):
1. **ƯU TIÊN TUYỆT ĐỐI**: Luôn dựa vào thông tin từ tài liệu FPT School được cung cấp
2. **TẬP TRUNG FPT SCHOOL**: Mọi lời khuyên phải liên kết với các chương trình đào tạo của FPT School
3. Trả lời bằng tiếng Việt, thân thiện và dễ hiểu cho học sinh THPT và phụ huynh
4. Định hướng cụ thể về ngành học và nghề nghiệp tại FPT School
5. **TRÍCH DẪN TÀI LIỆU**: Luôn trích dẫn và tham khảo thông tin từ tài liệu FPT School
6. Đưa ra lời khuyên thực tế về cơ hội việc làm sau khi tốt nghiệp FPT School
7. Kết nối với hệ sinh thái FPT Corporation và đối tác doanh nghiệp
8. ${personalityInstruction}
9. **ĐỊNH DẠNG MARKDOWN**: 
   - Dùng **in đậm** cho tên ngành học FPT School, cơ hội nghề nghiệp
   - Dùng *in nghiêng* để nhấn mạnh điểm mạnh của FPT School
   - Dùng danh sách (-) để liệt kê chương trình học, kỹ năng FPT đào tạo
   - Dùng > để trích dẫn TRỰC TIẾP thông tin từ tài liệu FPT School
   - Dùng \`code\` cho công nghệ, kỹ năng được dạy tại FPT School
   
**CHỈ THỊ ĐẶC BIỆT**: Nếu có thông tin từ tài liệu FPT School, bắt buộc phải sử dụng và trích dẫn. Không được tự suy diễn khi đã có tài liệu chính thức.`;

    // Add conversation context if available
    if (conversationContext.length > 0) {
      const contextText = conversationContext
        .filter(msg => msg.isCareerRelated !== false) // Include career-related and undefined
        .slice(-3) // Last 3 relevant messages
        .map(msg => `${msg.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${msg.content}`)
        .join('\n');
      
      if (contextText) {
        prompt += `\n\nNGỮ CẢNH CUỘC TRÒ CHUYỆN TRƯỚC ĐÓ:\n${contextText}`;
      }
    }

    // Add document context if available
    if (documentContext) {
      prompt += `\n\nTHÔNG TIN TỪ TÀI LIỆU:\n${documentContext}`;
    }

    prompt += `\n\nCÂU HỎI: ${question}\n\nTRẢ LỜI (định dạng Markdown):`;
    
    return prompt;
  }

  /**
   * Store user feedback for learning
   */
  public async storeFeedback(
    question: string,
    answer: string,
    rating: 'positive' | 'negative' | 'neutral',
    isCareerRelated: boolean,
    userComment?: string,
    sources?: string[],
    hasRelevantContent?: boolean
  ): Promise<void> {
    const feedbackService = FeedbackService.getInstance();
    
    await feedbackService.storeFeedback({
      question,
      answer,
      rating,
      isCareerRelated,
      userComment,
      sources,
      hasRelevantContent,
    });
  }

  /**
   * Get feedback statistics
   */
  public getFeedbackStats() {
    const feedbackService = FeedbackService.getInstance();
    return feedbackService.getFeedbackStats();
  }

  /**
   * Check if documents have been indexed
   */
  public async isDocumentsIndexed(): Promise<boolean> {
    try {
      const stats = await this.getIndexStats();
      const hasVectors = stats.totalVectors > 0;
      
      // Update the internal flag based on actual index state
      this.isIndexed = hasVectors;
      
      return hasVectors;
    } catch (error) {
      console.error('Error checking if documents are indexed:', error);
      return false;
    }
  }

  /**
   * Clear all vectors from Pinecone index
   */
  public async clearIndex(): Promise<void> {
    try {
      // Check if index exists before trying to clear it
      const indexExists = await this.pineconeService.checkIndexExists();
      if (indexExists) {
        await this.pineconeService.clearIndex();
        console.log('🗑️ Index cleared successfully');
      } else {
        console.log('🗑️ Index does not exist, skipping clear operation');
      }
      this.isIndexed = false;
    } catch (error) {
      console.error('❌ Error clearing index:', error);
      // Don't throw error if index doesn't exist
      if (!error.message?.includes('404') && !error.message?.includes('NotFound')) {
        throw error;
      }
    }
  }

  /**
   * Get index statistics
   */
  public async getIndexStats(): Promise<{
    totalVectors: number;
    indexReady: boolean;
  }> {
    try {
      // First ensure index exists
      await this.pineconeService.ensureIndexExists();
      
      // Use the new getIndexStats method from PineconeService
      return await this.pineconeService.getIndexStats();
    } catch (error) {
      console.error('Error getting index stats:', error);
      return {
        totalVectors: 0,
        indexReady: false,
      };
    }
  }

  /**
   * Test the RAG system with a sample question
   */
  public async testSystem(): Promise<{
    success: boolean;
    message: string;
    details?: unknown;
  }> {
    try {
      // Check if documents are indexed
      const isIndexed = await this.isDocumentsIndexed();
      if (!isIndexed) {
        return {
          success: false,
          message: 'Documents not indexed. Please run ingestion first.',
        };
      }
      
      // Test with a simple question
      const testQuestion = 'Xin chào, bạn có thể giúp tôi gì?';
      const result = await this.askQuestion(testQuestion);
      
      return {
        success: true,
        message: 'RAG system test completed successfully',
        details: {
          question: testQuestion,
          hasAnswer: result.answer.length > 0,
          hasRelevantContent: result.hasRelevantContent,
          sourcesCount: result.sources.length,
        },
      };
      
    } catch (error) {
      return {
        success: false,
        message: `RAG system test failed: ${String(error)}`,
      };
    }
  }
} 


