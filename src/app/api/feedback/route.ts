import { NextRequest, NextResponse } from 'next/server';
import { RAGService } from '@/lib/services/ragService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      question, 
      answer, 
      rating, 
      isCareerRelated, 
      userComment,
      sources,
      hasRelevantContent 
    } = body;

    // Validate required fields
    if (!question || !answer || !rating) {
      return NextResponse.json(
        { error: 'Question, answer, and rating are required' },
        { status: 400 }
      );
    }

    if (!['positive', 'negative', 'neutral'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating must be positive, negative, or neutral' },
        { status: 400 }
      );
    }

    const ragService = RAGService.getInstance();
    
    // Store the feedback
    await ragService.storeFeedback(
      question,
      answer,
      rating,
      Boolean(isCareerRelated),
      userComment,
      sources,
      hasRelevantContent
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback stored successfully',
      data: {
        rating,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/feedback:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false,
        message: 'An error occurred while storing feedback. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ragService = RAGService.getInstance();
    const stats = ragService.getFeedbackStats();
    
    return NextResponse.json({
      success: true,
      message: 'Feedback statistics retrieved successfully',
      data: {
        stats,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/feedback:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false,
        message: 'An error occurred while retrieving feedback statistics.'
      },
      { status: 500 }
    );
  }
} 