import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { RAGService } from '@/lib/services/ragService';

/**
 * POST /api/ingest
 * Endpoint to ingest documents from the documents directory
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({})) as { documentsPath?: string; clearIndex?: boolean };
    const { documentsPath, clearIndex = false } = body;

    console.log('🚀 Starting document ingestion...');

    // Get RAG service instance
    const ragService = RAGService.getInstance();

    // Clear index if requested (skip if index doesn't exist)
    if (clearIndex) {
      console.log('🗑️ Clearing existing index...');
      try {
        await ragService.clearIndex();
      } catch (error) {
        console.log('Index does not exist or cannot be cleared, continuing with ingestion...');
      }
    }

    // Start ingestion process
    const startTime = Date.now();
    const result = await ragService.ingestDocuments(documentsPath);
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);

    console.log(`✅ Ingestion completed in ${processingTime} seconds`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Documents ingested successfully',
      data: {
        totalChunks: result.totalChunks,
        processedFiles: result.processedFiles,
        statistics: result.statistics,
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/ingest:', error);
    
    // Return specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No DOCX files found')) {
        return NextResponse.json(
          {
            error: 'No DOCX files found in the documents directory',
            success: false,
            message: 'Please add DOCX files to the documents folder and try again.'
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'Service configuration error',
            success: false,
            message: 'Please check API key configuration.'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Pinecone')) {
        return NextResponse.json(
          {
            error: 'Vector database error',
            success: false,
            message: 'Failed to connect to Pinecone vector database.'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Document ingestion failed',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingest
 * Get ingestion status and statistics
 */
export async function GET() {
  try {
    const ragService = RAGService.getInstance();
    const isIndexed = await ragService.isDocumentsIndexed();
    const stats = await ragService.getIndexStats();

    return NextResponse.json({
      success: true,
      data: {
        isIndexed,
        indexStats: stats,
        message: isIndexed 
          ? 'Documents are indexed and ready for queries' 
          : 'Documents need to be ingested',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/ingest:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get ingestion status',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ingest
 * Clear all vectors from the index
 */
export async function DELETE() {
  try {
    const ragService = RAGService.getInstance();
    await ragService.clearIndex();

    return NextResponse.json({
      success: true,
      message: 'Index cleared successfully',
      data: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/ingest:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to clear index',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 