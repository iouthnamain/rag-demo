import mammoth from 'mammoth';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * Document chunk interface
 */
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
    contentLength: number;
  };
}

/**
 * Document Processor Service
 * Handles DOCX file processing and text chunking for RAG system
 */
class DocumentProcessorService {
  private static instance: DocumentProcessorService;
  private textSplitter: RecursiveCharacterTextSplitter;

  private constructor() {
    // Initialize text splitter with specified chunk size and overlap
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 350,
      chunkOverlap: 20,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }

  /**
   * Get singleton instance of DocumentProcessorService
   */
  public static getInstance(): DocumentProcessorService {
    if (!DocumentProcessorService.instance) {
      DocumentProcessorService.instance = new DocumentProcessorService();
    }
    return DocumentProcessorService.instance;
  }

  /**
   * Process DOCX file and return text chunks
   */
  public async processDocxFile(filePath: string): Promise<DocumentChunk[]> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Extract text from DOCX file
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      
      // Clean and normalize text
      const cleanedText = this.cleanText(text);
      
      if (!cleanedText.trim()) {
        throw new Error('No text content found in the document');
      }
      
      // Split text into chunks
      const chunks = await this.textSplitter.splitText(cleanedText);
      
      // Create document chunks with metadata
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: `${path.basename(filePath, '.docx')}_chunk_${index}_${uuidv4()}`,
        content: chunk.trim(),
        metadata: {
          source: path.basename(filePath),
          chunkIndex: index,
          totalChunks: chunks.length,
          contentLength: chunk.length,
        },
      }));
      
      console.log(`Processed ${filePath}: ${documentChunks.length} chunks created`);
      return documentChunks;
      
    } catch (error) {
      console.error(`Error processing DOCX file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Process TXT file and return text chunks
   */
  public async processTxtFile(filePath: string): Promise<DocumentChunk[]> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read text from TXT file
      const text = await fs.readFile(filePath, 'utf-8');
      
      // Clean and normalize text
      const cleanedText = this.cleanText(text);
      
      if (!cleanedText.trim()) {
        throw new Error('No text content found in the document');
      }
      
      // Split text into chunks
      const chunks = await this.textSplitter.splitText(cleanedText);
      
      // Create document chunks with metadata
      const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
        id: `${path.basename(filePath, '.txt')}_chunk_${index}_${uuidv4()}`,
        content: chunk.trim(),
        metadata: {
          source: path.basename(filePath),
          chunkIndex: index,
          totalChunks: chunks.length,
          contentLength: chunk.length,
        },
      }));
      
      console.log(`Processed ${filePath}: ${documentChunks.length} chunks created`);
      return documentChunks;
      
    } catch (error) {
      console.error(`Error processing TXT file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Process multiple DOCX and TXT files from documents directory
   */
  public async processDocumentsDirectory(documentsPath: string): Promise<DocumentChunk[]> {
    try {
      // Check if documents directory exists
      await fs.access(documentsPath);
      
      // Get all supported files
      const files = await fs.readdir(documentsPath);
      const docxFiles = files.filter(file => 
        file.toLowerCase().endsWith('.docx') && !file.startsWith('~$')
      );
      const txtFiles = files.filter(file => 
        file.toLowerCase().endsWith('.txt')
      );
      
      const totalFiles = docxFiles.length + txtFiles.length;
      
      if (totalFiles === 0) {
        throw new Error('No DOCX or TXT files found in documents directory');
      }
      
      console.log(`Found ${docxFiles.length} DOCX files and ${txtFiles.length} TXT files to process`);
      
      // Process all files
      const allChunks: DocumentChunk[] = [];
      
      // Process DOCX files
      for (const file of docxFiles) {
        const filePath = path.join(documentsPath, file);
        try {
          const chunks = await this.processDocxFile(filePath);
          allChunks.push(...chunks);
        } catch (error) {
          console.error(`Failed to process DOCX ${file}:`, error);
          // Continue processing other files
        }
      }
      
      // Process TXT files
      for (const file of txtFiles) {
        const filePath = path.join(documentsPath, file);
        try {
          const chunks = await this.processTxtFile(filePath);
          allChunks.push(...chunks);
        } catch (error) {
          console.error(`Failed to process TXT ${file}:`, error);
          // Continue processing other files
        }
      }
      
      console.log(`Total chunks created: ${allChunks.length}`);
      return allChunks;
      
    } catch (error) {
      console.error('Error processing documents directory:', error);
      throw error;
    }
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF\.,!?;:()\-"']/g, '')
      // Normalize Vietnamese characters
      .normalize('NFC')
      // Trim whitespace
      .trim();
  }

  /**
   * Merge small chunks that are below minimum threshold
   */
  public mergeSmallChunks(chunks: DocumentChunk[], minSize = 100): DocumentChunk[] {
    const mergedChunks: DocumentChunk[] = [];
    let currentChunk: DocumentChunk | null = null;
    
    for (const chunk of chunks) {
      if (chunk.content.length < minSize && currentChunk) {
        // Merge with previous chunk
        currentChunk.content += ' ' + chunk.content;
        currentChunk.metadata.contentLength += chunk.content.length;
      } else {
        if (currentChunk) {
          mergedChunks.push(currentChunk);
        }
        currentChunk = { ...chunk };
      }
    }
    
    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }
    
    // Update chunk indices
    mergedChunks.forEach((chunk, index) => {
      chunk.metadata.chunkIndex = index;
      chunk.metadata.totalChunks = mergedChunks.length;
    });
    
    return mergedChunks;
  }

  /**
   * Validate document chunk
   */
  public validateChunk(chunk: DocumentChunk): boolean {
    return (
      chunk.content.trim().length > 0 &&
      chunk.id.length > 0 &&
      chunk.metadata.source.length > 0
    );
  }

  /**
   * Get chunk statistics
   */
  public getChunkStatistics(chunks: DocumentChunk[]): {
    totalChunks: number;
    averageLength: number;
    minLength: number;
    maxLength: number;
    sources: string[];
  } {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        averageLength: 0,
        minLength: 0,
        maxLength: 0,
        sources: [],
      };
    }
    
    const lengths = chunks.map(chunk => chunk.content.length);
    const sources = [...new Set(chunks.map(chunk => chunk.metadata.source))];
    
    return {
      totalChunks: chunks.length,
      averageLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      sources,
    };
  }
}

export default DocumentProcessorService; 