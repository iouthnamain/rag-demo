# Firecrawl Integration Guide

## Overview
The RAG chatbot now uses Firecrawl as its primary web search and content extraction service, replacing Google Search APIs. Firecrawl provides superior content extraction, real-time web scraping, and enhanced search capabilities.

## Integration Architecture

### 1. Firecrawl SDK Integration
- **Package**: `@mendable/firecrawl-js`
- **Service**: `WebSearchService` (primary implementation)
- **Features**:
  - Real-time web search
  - Content extraction with markdown formatting
  - Multi-language support (Vietnamese/English)
  - Intelligent result filtering

### 2. Alternative MCP Server Integration
- **Service**: `FirecrawlMCPService` (advanced features)
- **Capabilities**:
  - Deep research analysis
  - Structured data extraction
  - Enhanced content processing
  - Multiple search strategies

## Setup Instructions

### 1. Get Firecrawl API Key
1. Visit [Firecrawl.dev](https://firecrawl.dev)
2. Sign up for an account
3. Generate an API key from your dashboard

### 2. Configure Environment
Add to your `.env.local`:
```bash
FIRECRAWL_API_KEY=fc-your_api_key_here
```

### 3. Verify Integration
The system will automatically:
- Use Firecrawl search when API key is provided
- Fall back to mock results when key is missing/demo
- Continue functioning even if Firecrawl fails

## Features Comparison

| Feature | Mock Results | Firecrawl SDK | Firecrawl MCP |
|---------|-------------|---------------|---------------|
| Web Search | ✅ Static | ✅ Real-time | ✅ Enhanced |
| Content Extraction | ❌ Limited | ✅ Markdown | ✅ Structured |
| Vietnamese Support | ✅ Basic | ✅ Optimized | ✅ Advanced |
| Deep Research | ❌ No | ❌ No | ✅ Yes |
| Data Extraction | ❌ No | ❌ Limited | ✅ Advanced |

## Usage Examples

### Basic Web Search
```typescript
const webSearchService = WebSearchService.getInstance();
const results = await webSearchService.searchWeb("career advice Vietnam", 5);
```

### Advanced Deep Research (MCP)
```typescript
const mcpService = FirecrawlMCPService.getInstance();
const research = await mcpService.performDeepResearch("AI career trends 2024");
```

## Benefits of Firecrawl

### 1. Superior Content Quality
- **Clean Extraction**: Removes ads, navigation, and irrelevant content
- **Markdown Format**: Structured content for better AI processing
- **Real-time Data**: Access to current information beyond training cutoffs

### 2. Vietnamese Language Optimization
- **Localized Search**: Country-specific results (Vietnam)
- **Language Support**: Native Vietnamese content processing
- **Cultural Context**: Better understanding of local career markets

### 3. Enhanced Performance
- **Faster Processing**: Optimized content extraction
- **Better Relevance**: Improved search result quality
- **Reliable Service**: Professional-grade infrastructure

### 4. Advanced Features
- **Website Mapping**: Discover site structure
- **Batch Processing**: Multiple URL processing
- **Custom Scraping**: Tailored content extraction

## Error Handling

### Graceful Degradation
1. **Primary**: Firecrawl API search
2. **Fallback**: Mock search results
3. **Continuation**: System remains functional

### Common Issues
- **API Limits**: Firecrawl has usage limits per plan
- **Network Issues**: Automatic fallback to mock data
- **Invalid Keys**: Clear error messages and fallback

## Configuration Options

### Search Parameters
```typescript
{
  query: string,
  limit: number,        // Max results (default: 5)
  lang: 'vi',          // Language preference
  country: 'vn',       // Country targeting
  scrapeOptions: {
    formats: ['markdown'],
    onlyMainContent: true
  }
}
```

### Environment Variables
```bash
# Required for basic RAG functionality
GEMINI_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key

# Optional for web search enhancement
FIRECRAWL_API_KEY=your_firecrawl_key
```

## Development vs Production

### Development Mode
- Uses mock search results by default
- No API costs during development
- Consistent test data for debugging

### Production Mode
- Requires valid Firecrawl API key
- Real-time web search and content extraction
- Enhanced answer quality with current information

## Future Enhancements

### Planned Features
1. **Caching Layer**: Store search results to reduce API calls
2. **Result Ranking**: Custom relevance scoring for career topics
3. **Content Summarization**: AI-powered content condensation
4. **Multi-source Verification**: Cross-reference information accuracy

### Advanced Integrations
1. **Website Monitoring**: Track changes in career resources
2. **Content Alerts**: Notify of new relevant information
3. **Custom Extractors**: Specialized data extraction for job sites
4. **Analytics Dashboard**: Track search patterns and effectiveness

## Cost Considerations

### Firecrawl Pricing
- **Free Tier**: Limited searches per month
- **Paid Plans**: Higher limits and advanced features
- **Enterprise**: Custom solutions for high-volume usage

### Optimization Tips
1. **Smart Caching**: Avoid duplicate searches
2. **Result Limits**: Use appropriate number of results
3. **Targeted Queries**: More specific searches = better relevance
4. **Fallback Strategy**: Graceful degradation reduces unnecessary calls

## Monitoring and Analytics

### Available Metrics
- Search success/failure rates
- Content extraction quality
- Response times
- API usage patterns

### Logging
The system provides detailed logs:
- `🔍 Performing web search for: [query]`
- `🔍 Firecrawl search completed: [X] results`
- `❌ Firecrawl search failed: [error]`

This integration significantly enhances the chatbot's ability to provide current, relevant information while maintaining reliability and performance. 