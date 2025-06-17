import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { RAGService } from '@/lib/services/ragService';

/**
 * POST /api/ask
 * Main endpoint for asking questions to the career counseling chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, conversationId = 'default' } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const ragService = RAGService.getInstance();
    
    // Check if documents are indexed
    const isIndexed = await ragService.isDocumentsIndexed();
    if (!isIndexed) {
      return NextResponse.json(
        {
          error: 'System is not ready. Documents need to be indexed first.',
          success: false,
          message: 'Please contact the administrator to initialize the system.'
        },
        { status: 503 }
      );
    }

    // Process the question with intelligent routing
    const result = await ragService.askQuestion(question, conversationId);

    return NextResponse.json({
      success: true,
      data: {
        answer: result.answer,
        sources: result.sources,
        hasRelevantContent: result.hasRelevantContent,
        isCareerRelated: result.isCareerRelated,
        confidence: result.confidence,
        conversationId: conversationId,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/ask:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false,
        message: 'An error occurred while processing your question. Please try again.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ask
 * Health check endpoint
 */
export async function GET() {
  try {
    const ragService = RAGService.getInstance();
    const stats = await ragService.getIndexStats();
    const isReady = await ragService.isDocumentsIndexed();
    const feedbackStats = ragService.getFeedbackStats();
    
    return NextResponse.json({
      success: true,
      message: 'Ask endpoint is healthy',
      data: {
        isReady: isReady,
        indexStats: stats,
        feedbackStats: feedbackStats,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Error in GET /api/ask:', error);
    
    // Return success with limited info if there are index issues
    return NextResponse.json({
      success: true,
      message: 'Ask endpoint is healthy (index not ready)',
      data: {
        isReady: false,
        indexStats: { totalVectors: 0, indexReady: false },
        feedbackStats: { total: 0, positive: 0, negative: 0, neutral: 0, careerRelated: 0, generalChat: 0 },
        timestamp: new Date().toISOString(),
      }
    });
  }
} 