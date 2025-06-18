# Web Search Feature Documentation

## Overview
The RAG chatbot now includes web search functionality that allows the system to supplement its knowledge base with real-time information from the internet.

## Features Added

### 1. Web Search Toggle Button
- **Location**: Located above the chat input field
- **Functionality**: Toggle web search on/off for queries
- **Visual Indicator**: 
  - 🔍 icon with toggle switch
  - Blue when enabled, gray when disabled
  - Input placeholder changes to indicate web search mode

### 2. Backend Web Search Service
- **File**: `src/lib/services/webSearchService.ts`
- **Purpose**: Handles web search queries and result processing using Firecrawl
- **Features**:
  - Mock search results for development/demo
  - Firecrawl API integration for real-time web search
  - Intelligent query optimization for career-related searches
  - Result filtering and relevance scoring
  - Content extraction and markdown conversion

### 3. Enhanced RAG Service
- **Integration**: Web search results are combined with document-based knowledge
- **Smart Routing**: 
  - Career questions: RAG + web search (when enabled)
  - General questions: Direct web search or conversation-based response
- **Confidence Scoring**: Adjusted based on web search availability

### 4. UI Enhancements
- **Web Search Indicator**: Purple badge shows when web search was used
- **Dual Sources**: Separate display for document sources (📄) and web sources (🔗)
- **Clickable Web Links**: Web sources are clickable and open in new tabs
- **Loading States**: Enhanced loading animation for web search queries

## Usage

### For Users
1. **Enable Web Search**: Click the toggle button above the input field
2. **Ask Questions**: Web search will supplement responses with current information
3. **View Sources**: Check both document and web sources for comprehensive information
4. **Disable When Not Needed**: Turn off for faster responses when web data isn't required

### For Developers

#### Configuration
Add to `.env.local` (optional):
```bash
# Firecrawl API (optional - uses mock data if not provided)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

#### API Changes
The `/api/ask` endpoint now accepts an additional parameter:
```typescript
{
  question: string;
  conversationId: string;
  webSearchEnabled: boolean; // New parameter
}
```

Response format includes new fields:
```typescript
{
  answer: string;
  sources: string[];
  webSources?: string[];     // New: Web search URLs
  usedWebSearch?: boolean;   // New: Indicates if web search was used
  // ... other existing fields
}
```

## Technical Implementation

### Web Search Flow
1. **Query Processing**: Optimizes search terms for better results
2. **Search Execution**: Performs web search (mock or real API)
3. **Content Extraction**: Extracts key information from search results
4. **Context Integration**: Combines web content with document knowledge
5. **Response Generation**: AI generates response using combined context

### Error Handling
- **Graceful Fallback**: If web search fails, system continues with document-only knowledge
- **Timeout Protection**: Web search has timeout limits to prevent hanging
- **Error Logging**: Comprehensive error logging for debugging

### Performance Considerations
- **Async Processing**: Web search runs in parallel with document search
- **Result Limiting**: Limited to 3-5 web results to control response time
- **Caching Ready**: Architecture supports result caching (not implemented yet)

## Benefits

### Enhanced Information Quality
- **Current Data**: Access to up-to-date information beyond training data
- **Comprehensive Coverage**: Combines curated documents with broader web knowledge
- **Verification**: Multiple sources increase answer reliability

### User Experience
- **Transparency**: Clear indication of information sources
- **Control**: Users can enable/disable based on their needs
- **Speed Options**: Quick responses without web search when desired

### Flexibility
- **Mode Switching**: Easy toggle between document-only and web-enhanced modes
- **Career Focus**: Optimized search queries for career counseling domain
- **Scalability**: Ready for integration with production search APIs

## Future Enhancements

### Planned Features
- **Real-time Web Scraping**: Integration with services like Firecrawl
- **Result Caching**: Cache web search results to improve performance
- **Advanced Filtering**: Better relevance filtering for search results
- **Source Quality Rating**: Scoring web sources for reliability

### API Integration Options
- **Firecrawl**: Primary web search and scraping service (integrated)
- **Enhanced Content**: Markdown-formatted content extraction
- **Real-time Scraping**: Live website content access
- **Multi-language Support**: Vietnamese and English search optimization

## Troubleshooting

### Common Issues
1. **Slow Responses**: Web search adds latency - consider disabling for speed
2. **No Web Results**: Check internet connection and API configuration
3. **Irrelevant Results**: Mock data may not be perfectly relevant - real API will improve this

### Debug Mode
Enable detailed logging by checking browser console for:
- `🔍 Performing web search for: [query]`
- `🔍 Web search completed: [X] results`
- `⚠️ Web search failed: [error]`

## Configuration

### Environment Variables
```bash
# Required for basic functionality (already configured)
GEMINI_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key

# Optional for production web search
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### Default Behavior
- **Development**: Uses mock search results
- **Production**: Falls back to mock if no API keys provided
- **Error Handling**: Continues without web search if service fails

This feature significantly enhances the chatbot's capabilities while maintaining the reliability and performance of the existing RAG system. 