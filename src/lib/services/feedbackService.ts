interface UserFeedback {
  id: string;
  question: string;
  answer: string;
  isCareerRelated: boolean;
  rating: 'positive' | 'negative' | 'neutral';
  userComment?: string;
  timestamp: Date;
  sources?: string[];
  hasRelevantContent?: boolean;
}

interface ConversationHistory {
  id: string;
  userId?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isCareerRelated?: boolean;
    sources?: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for managing user feedback and conversation history
 */
export class FeedbackService {
  private static instance: FeedbackService;
  private feedbacks: UserFeedback[] = [];
  private conversations: Map<string, ConversationHistory> = new Map();
  private learningData: Map<string, string[]> = new Map(); // question patterns -> good answers

  private constructor() {
    this.loadStoredData();
  }

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  /**
   * Store user feedback
   */
  public async storeFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<void> {
    const newFeedback: UserFeedback = {
      ...feedback,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.feedbacks.push(newFeedback);
    
    // Learn from positive feedback
    if (feedback.rating === 'positive') {
      this.learnFromPositiveFeedback(newFeedback);
    }

    // Store in memory (in real app, this would be saved to database)
    this.saveStoredData();
    
    console.log('📝 Feedback stored:', {
      question: feedback.question.substring(0, 50) + '...',
      rating: feedback.rating,
      isCareerRelated: feedback.isCareerRelated
    });
  }

  /**
   * Get or create conversation history
   */
  public getConversation(conversationId: string): ConversationHistory {
    if (!this.conversations.has(conversationId)) {
      const newConversation: ConversationHistory = {
        id: conversationId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.conversations.set(conversationId, newConversation);
    }
    return this.conversations.get(conversationId)!;
  }

  /**
   * Add message to conversation
   */
  public addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      isCareerRelated?: boolean;
      sources?: string[];
    }
  ): void {
    const conversation = this.getConversation(conversationId);
    
    conversation.messages.push({
      role,
      content,
      timestamp: new Date(),
      isCareerRelated: metadata?.isCareerRelated,
      sources: metadata?.sources,
    });
    
    conversation.updatedAt = new Date();
    this.saveStoredData();
  }

  /**
   * Get conversation context (last N messages)
   */
  public getConversationContext(conversationId: string, maxMessages: number = 10): Array<{
    role: 'user' | 'assistant';
    content: string;
    isCareerRelated?: boolean;
  }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    return conversation.messages
      .slice(-maxMessages)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        isCareerRelated: msg.isCareerRelated,
      }));
  }

  /**
   * Learn from positive feedback
   */
  private learnFromPositiveFeedback(feedback: UserFeedback): void {
    const questionPattern = this.extractQuestionPattern(feedback.question);
    
    if (!this.learningData.has(questionPattern)) {
      this.learningData.set(questionPattern, []);
    }
    
    this.learningData.get(questionPattern)!.push(feedback.answer);
  }

  /**
   * Extract question pattern for learning
   */
  private extractQuestionPattern(question: string): string {
    // Simple pattern extraction - remove specific details, keep general structure
    return question
      .toLowerCase()
      .replace(/[0-9]+/g, 'NUMBER')
      .replace(/\b(tôi|mình|em|anh|chị)\b/g, 'USER')
      .replace(/\b(công ty|doanh nghiệp|tổ chức)\s+\w+/g, 'COMPANY')
      .trim();
  }

  /**
   * Get learned responses for similar questions
   */
  public getLearnedResponses(question: string): string[] {
    const pattern = this.extractQuestionPattern(question);
    return this.learningData.get(pattern) || [];
  }

  /**
   * Get feedback statistics
   */
  public getFeedbackStats(): {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    careerRelated: number;
    generalChat: number;
  } {
    const stats = {
      total: this.feedbacks.length,
      positive: 0,
      negative: 0,
      neutral: 0,
      careerRelated: 0,
      generalChat: 0,
    };

    this.feedbacks.forEach(feedback => {
      stats[feedback.rating]++;
      if (feedback.isCareerRelated) {
        stats.careerRelated++;
      } else {
        stats.generalChat++;
      }
    });

    return stats;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Load stored data from memory (in real app, this would be from database)
   */
  private loadStoredData(): void {
    // In demo mode, start with empty data
    // In real app, load from database
  }

  /**
   * Save stored data to memory (in real app, this would be to database)
   */
  private saveStoredData(): void {
    // In demo mode, just keep in memory
    // In real app, save to database
    console.log('💾 Data saved - Feedbacks:', this.feedbacks.length, 'Conversations:', this.conversations.size);
  }

  /**
   * Clear all data (for testing)
   */
  public clearAllData(): void {
    this.feedbacks = [];
    this.conversations.clear();
    this.learningData.clear();
    console.log('🗑️ All feedback data cleared');
  }
} 
