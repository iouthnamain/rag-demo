import FirecrawlApp from '@mendable/firecrawl-js';
import { env } from '~/env';

/**
 * Web Search Service
 * Handles web search functionality using Firecrawl API
 */
export class WebSearchService {
  private static instance: WebSearchService;
  private firecrawlApp: FirecrawlApp | null = null;

  private constructor() {
    // Initialize Firecrawl if API key is available
    if (env.FIRECRAWL_API_KEY && env.FIRECRAWL_API_KEY !== 'demo') {
      this.firecrawlApp = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
    }
  }

  /**
   * Get singleton instance of WebSearchService
   */
  public static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService();
    }
    return WebSearchService.instance;
  }

  /**
   * Search the web for information related to the query using Firecrawl
   */
  public async searchWeb(query: string, numResults: number = 5): Promise<{
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      content?: string;
    }>;
    searchQuery: string;
  }> {
    try {
      console.log(`🔍 Performing web search for: ${query}`);

      const searchQuery = this.buildSearchQuery(query);
      
      // Use Firecrawl search if available
      if (this.firecrawlApp) {
        return await this.performFirecrawlSearch(searchQuery, numResults);
      }

      // Fallback to mock results for demo/development
      return this.getMockSearchResults(searchQuery);
    } catch (error) {
      console.error('❌ Error performing web search:', error);
      // Fallback to mock results on error
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Perform actual web search using Firecrawl SDK
   */
  private async performFirecrawlSearch(query: string, numResults: number): Promise<{
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      content?: string;
    }>;
    searchQuery: string;
  }> {
    try {
      if (!this.firecrawlApp) {
        throw new Error('Firecrawl not initialized');
      }

      // Use Firecrawl search
      const searchResult = await this.firecrawlApp.search(query, {
        limit: numResults,
        lang: 'vi',
        country: 'vn',
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      });

      const results = (searchResult.data || []).map((item: {
        title?: string;
        url?: string;
        description?: string;
        markdown?: string;
      }) => ({
        title: item.title || 'No title',
        url: item.url || '',
        snippet: item.description || 'No description available',
        content: item.markdown || item.description || ''
      }));

      console.log(`🔍 Firecrawl search completed: ${results.length} results`);

      return {
        results,
        searchQuery: query
      };
    } catch (error) {
      console.error('❌ Firecrawl search failed:', error);
      throw error;
    }
  }

  /**
   * Extract key information from web search results
   */
  public extractKeyInformation(results: Array<{
    title: string;
    url: string;
    snippet: string;
    content?: string;
  }>): {
    combinedContent: string;
    sources: string[];
  } {
    const combinedContent = results
      .map(result => `**${result.title}**\n${result.snippet}`)
      .join('\n\n');

    const sources = results.map(result => result.url);

    return {
      combinedContent,
      sources,
    };
  }

  /**
   * Build optimized search query
   */
  private buildSearchQuery(query: string): string {
    // Add relevant keywords for career counseling if applicable
    const careerKeywords = [
      'nghề nghiệp', 'tư vấn', 'việc làm', 'career', 'job',
      'công việc', 'chuyên môn', 'kỹ năng', 'skill'
    ];

    const isCareerRelated = careerKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isCareerRelated) {
      return `${query} tư vấn nghề nghiệp 2024`;
    }

    return query;
  }

  /**
   * Get mock search results for demo/development
   */
  private getMockSearchResults(query: string): {
    results: Array<{
      title: string;
      url: string;
      snippet: string;
      content?: string;
    }>;
    searchQuery: string;
  } {
    const mockResults = [
      {
        title: "Tư vấn nghề nghiệp - Hướng dẫn chọn ngành phù hợp",
        url: "https://example.com/career-guide-1",
        snippet: "Hướng dẫn chi tiết về cách chọn nghề nghiệp phù hợp với năng lực và sở thích cá nhân. Các bước quan trọng trong việc định hướng nghề nghiệp.",
        content: "Việc chọn nghề nghiệp là một quyết định quan trọng trong cuộc đời mỗi người..."
      },
      {
        title: "Kỹ năng cần thiết cho thị trường lao động hiện đại",
        url: "https://example.com/skills-2024",
        snippet: "Phân tích các kỹ năng quan trọng nhất mà người lao động cần có trong thời đại số. Cập nhật xu hướng tuyển dụng 2024.",
        content: "Thị trường lao động đang thay đổi nhanh chóng với sự phát triển của công nghệ..."
      },
      {
        title: "Cơ hội việc làm trong lĩnh vực công nghệ thông tin",
        url: "https://example.com/it-jobs",
        snippet: "Tổng quan về các vị trí việc làm hot trong ngành IT, mức lương và yêu cầu kỹ năng. Dự báo xu hướng phát triển.",
        content: "Ngành công nghệ thông tin đang có nhiều cơ hội phát triển với các vị trí như..."
      },
      {
        title: "Cách viết CV ấn tượng để thu hút nhà tuyển dụng",
        url: "https://example.com/cv-tips",
        snippet: "Bí quyết tạo CV chuyên nghiệp, cách trình bày kinh nghiệm và kỹ năng hiệu quả. Mẫu CV đạt chuẩn 2024.",
        content: "CV là ấn tượng đầu tiên mà nhà tuyển dụng có về bạn..."
      },
      {
        title: "Xu hướng tuyển dụng và phát triển nghề nghiệp 2024",
        url: "https://example.com/trends-2024",
        snippet: "Báo cáo về xu hướng thị trường lao động, các ngành nghề có triển vọng và cách thích ứng với thay đổi.",
        content: "Năm 2024 đánh dấu nhiều thay đổi trong thị trường lao động..."
      }
    ];

    // Filter results based on query relevance
    const relevantResults = mockResults.filter(result => 
      this.isRelevantToQuery(result, query)
    ).slice(0, 3);

    return {
      results: relevantResults,
      searchQuery: query
    };
  }

  /**
   * Check if a search result is relevant to the query
   */
  private isRelevantToQuery(result: { title: string; snippet: string }, query: string): boolean {
    const queryLower = query.toLowerCase();
    const titleLower = result.title.toLowerCase();
    const snippetLower = result.snippet.toLowerCase();

    // Simple relevance check
    return titleLower.includes(queryLower) || 
           snippetLower.includes(queryLower) ||
           this.hasCommonKeywords(queryLower, titleLower + ' ' + snippetLower);
  }

  /**
   * Check for common keywords between query and content
   */
  private hasCommonKeywords(query: string, content: string): boolean {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const contentWords = content.split(' ');

    return queryWords.some(queryWord => 
      contentWords.some(contentWord => 
        contentWord.includes(queryWord) || queryWord.includes(contentWord)
      )
    );
  }
} 