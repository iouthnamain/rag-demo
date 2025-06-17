import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '~/env';
import MockStorage from './mockStorage';

/**
 * Pinecone Vector Database Service
 * Handles vector storage and retrieval operations for RAG system
 */
class PineconeService {
  private static instance: PineconeService;
  private pinecone: Pinecone;
  private indexName: string;
  private dimension: number;
  private mockStorage: MockStorage;
  private isDemoMode: boolean;

  private constructor() {
    this.isDemoMode = env.PINECONE_API_KEY === 'demo';
    this.indexName = env.PINECONE_INDEX_NAME;
    this.dimension = 768;
    
    if (this.isDemoMode) {
      console.log('🔧 Running in demo mode - Pinecone disabled, using mock storage');
      this.pinecone = {} as Pinecone;
      this.mockStorage = MockStorage.getInstance();
    } else {
      // Initialize Pinecone client with API key
      this.pinecone = new Pinecone({
        apiKey: env.PINECONE_API_KEY,
      });
    }
  }

  /**
   * Get singleton instance of PineconeService
   */
  public static getInstance(): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService();
    }
    return PineconeService.instance;
  }

  /**
   * Get Pinecone index for operations
   */
  public async getIndex() {
    return this.pinecone.index(this.indexName);
  }

  /**
   * Check if index exists
   */
  public async checkIndexExists(): Promise<boolean> {
    if (this.isDemoMode) {
      return true; // Always exists in demo mode
    }
    
    try {
      const indexList = await this.pinecone.listIndexes();
      return indexList.indexes?.some(
        (index) => index.name === this.indexName
      ) ?? false;
    } catch (error) {
      console.error('Error checking if index exists:', error);
      return false;
    }
  }

  /**
   * Ensure index exists, create if it doesn't
   */
  public async ensureIndexExists(embeddingDimension?: number): Promise<void> {
    if (this.isDemoMode) {
      console.log('Demo mode: Index always exists');
      return;
    }
    
    try {
      const exists = await this.checkIndexExists();
      if (!exists) {
        const dimension = embeddingDimension ?? this.dimension ?? 768;
        console.log(`Creating index: ${this.indexName} with dimension: ${dimension}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        // Wait for index to be ready
        console.log('Waiting for index to be ready...');
        let ready = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max wait
        
        while (!ready && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          try {
            const indexDescription = await this.pinecone.describeIndex(this.indexName);
            ready = indexDescription.status?.ready ?? false;
            attempts++;
            if (!ready) {
              console.log(`Index not ready yet, attempt ${attempts}/${maxAttempts}`);
            }
          } catch {
            attempts++;
          }
        }
        
        if (ready) {
          console.log(`Index ${this.indexName} is ready!`);
        } else {
          throw new Error(`Index ${this.indexName} did not become ready within timeout`);
        }
      }
    } catch (error) {
      console.error('Error ensuring index exists:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready for operations
   */
  private async waitForIndexReady(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait
    
    while (attempts < maxAttempts) {
      try {
        const indexDescription = await this.pinecone.describeIndex(this.indexName);
        if (indexDescription.status?.ready) {
          console.log(`Index ${this.indexName} is ready!`);
          return;
        }
      } catch {
        console.log(`Waiting for index to be ready... (${attempts + 1}/${maxAttempts})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
    }
    
    throw new Error(`Index ${this.indexName} did not become ready within expected time`);
  }

  /**
   * Upsert vectors to Pinecone index
   */
  public async upsertVectors(vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, string | number | boolean>;
  }>): Promise<void> {
    if (this.isDemoMode) {
      await this.mockStorage.upsert(vectors);
      return;
    }
    
    try {
      const index = await this.getIndex();
      const batchSize = 100; // Pinecone batch limit
      
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
      }
    } catch (error) {
      console.error('Error upserting vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors in Pinecone
   */
  public async similaritySearch(
    queryVector: number[],
    topK = 3,
    filter?: Record<string, string | number | boolean>
  ): Promise<Array<{
    id: string;
    score: number;
    metadata?: Record<string, string | number | boolean>;
  }>> {
    if (this.isDemoMode) {
      return await this.mockStorage.query(queryVector, topK);
    }
    
    try {
      const index = await this.getIndex();
      const queryResponse = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter
      });

      return queryResponse.matches?.map(match => ({
        id: match.id,
        score: match.score ?? 0,
        metadata: match.metadata as Record<string, string | number | boolean> | undefined
      })) ?? [];
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw error;
    }
  }

  /**
   * Delete all vectors from index
   */
  public async clearIndex(): Promise<void> {
    if (this.isDemoMode) {
      await this.mockStorage.clear();
      return;
    }
    
    try {
      // Check if index exists before trying to clear
      const exists = await this.checkIndexExists();
      if (!exists) {
        console.log(`Index ${this.indexName} does not exist, skipping clear operation`);
        return;
      }
      
      const index = await this.getIndex();
      await index.deleteAll();
      console.log(`Cleared all vectors from index: ${this.indexName}`);
    } catch (error) {
      console.error('Error clearing index:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  public async getIndexStats(): Promise<{ totalVectors: number; indexReady: boolean }> {
    if (this.isDemoMode) {
      const stats = this.mockStorage.getStats();
      return {
        totalVectors: stats.totalVectors,
        indexReady: true
      };
    }
    
    try {
      const index = await this.getIndex();
      const stats = await index.describeIndexStats();
      return {
        totalVectors: stats.totalRecordCount ?? 0,
        indexReady: true
      };
    } catch (error) {
      console.error('Error getting index stats:', error);
      return {
        totalVectors: 0,
        indexReady: false
      };
    }
  }
}

export { PineconeService }; 