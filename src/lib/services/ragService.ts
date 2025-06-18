import { PineconeService } from './pinecone';
import { GeminiService } from './gemini';
import { FeedbackService } from './feedbackService';
import { WebSearchService } from './webSearchService';
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
      
      // Check if question is career-related
      const isCareerRelated = geminiService.isCareerRelatedQuestion(question);
      console.log(`🎯 Question type: ${isCareerRelated ? 'Career-related' : 'General conversation'}`);

      let answer: string;
      let sources: string[] = [];
      let webSources: string[] = [];
      let hasRelevantContent = false;
      let confidence = 0.5;
      let usedWebSearch = false;

      if (isCareerRelated) {
        // Career-related question - use RAG with documents
        const ragResult = await this.processCareerQuestion(question, conversationId, webSearchEnabled);
        answer = ragResult.answer;
        sources = ragResult.sources;
        webSources = ragResult.webSources || [];
        hasRelevantContent = ragResult.hasRelevantContent;
        confidence = ragResult.confidence;
        usedWebSearch = ragResult.usedWebSearch || false;
      } else {
        // General conversation - use general AI response
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
    
    // Search for relevant documents
    const searchResults = await this.pineconeService.similaritySearch(
      questionEmbedding,
      5 // top 5 results
    );
    
    console.log(`🔍 Found ${searchResults.length} search results`);
    
    // Check if we have relevant results (score threshold)
    const relevantResults = searchResults.filter(result => result.score > 0.3);
    
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
      console.log('ℹ️ No relevant documents found, using general career knowledge');
      
      // Combine document knowledge with web search if available
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
    
    // Get conversation context
    const conversationContext = feedbackService.getConversationContext(conversationId, 3);
    
    // Check for learned responses
    const learnedResponses = feedbackService.getLearnedResponses(question);
    if (learnedResponses.length > 0) {
      console.log('🧠 Using learned general response');
      return learnedResponses[Math.floor(Math.random() * learnedResponses.length)];
    }
    
    // Generate contextual general response
    let contextualQuestion = question;
    if (conversationContext.length > 0) {
      const recentContext = conversationContext
        .slice(-2)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      
      contextualQuestion = `Ngữ cảnh cuộc trò chuyện:\n${recentContext}\n\nCâu hỏi hiện tại: ${question}`;
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
    
    // Get conversation context
    const conversationContext = feedbackService.getConversationContext(conversationId, 3);
    
    try {
      // Perform web search
      const webResults = await webSearchService.searchWeb(question, 3);
      const webInfo = webSearchService.extractKeyInformation(webResults.results);
      
      console.log(`🔍 Web search for general question completed: ${webResults.results.length} results`);
      
      // Build prompt with web context
      let contextualQuestion = question;
      if (conversationContext.length > 0) {
        const recentContext = conversationContext
          .slice(-2)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        contextualQuestion = `Ngữ cảnh cuộc trò chuyện:\n${recentContext}\n\nThông tin từ web:\n${webInfo.combinedContent}\n\nCâu hỏi hiện tại: ${question}`;
      } else {
        contextualQuestion = `Thông tin từ web:\n${webInfo.combinedContent}\n\nCâu hỏi: ${question}`;
      }
      
      const answer = await geminiService.generateGeneralResponse(contextualQuestion);
      
      return {
        answer,
        webSources: webInfo.sources,
      };
    } catch (error) {
      console.error('⚠️ Web search failed for general question:', error);
      
      // Fallback to regular general response
      let contextualQuestion = question;
      if (conversationContext.length > 0) {
        const recentContext = conversationContext
          .slice(-2)
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        contextualQuestion = `Ngữ cảnh cuộc trò chuyện:\n${recentContext}\n\nCâu hỏi hiện tại: ${question}`;
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
    let prompt = `Bạn là một chuyên gia tư vấn nghề nghiệp với kinh nghiệm sâu rộng. Hãy trả lời câu hỏi một cách chuyên nghiệp và hữu ích.

NGUYÊN TẮC:
1. Trả lời bằng tiếng Việt
2. Đưa ra lời khuyên cụ thể và thực tế
3. Sử dụng thông tin từ tài liệu được cung cấp nếu có
4. Tham khảo ngữ cảnh cuộc trò chuyện trước đó
5. **ĐỊNH DẠNG**: Sử dụng Markdown để định dạng câu trả lời:
   - Dùng **in đậm** cho các điểm quan trọng
   - Dùng *in nghiêng* cho nhấn mạnh
   - Dùng danh sách có dấu đầu dòng (-) hoặc số (1.) khi liệt kê
   - Dùng > để trích dẫn thông tin từ tài liệu
   - Dùng \`code\` cho thuật ngữ chuyên môn`;

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


