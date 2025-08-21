import type { ResultItem, SearchMode, ApiQuery } from '../../types';

const API_BASE_URL = 'http://localhost:5731';
const LOCAL_DATASET_URL = 'http://localhost:1406';

// Helper function to create the full thumbnail URL from a constructed path
const adjustThumbnail = (thumbnail: string): string => {
  const datasetIndex = thumbnail.indexOf('/dataset/');
  return datasetIndex !== -1
    ? `${LOCAL_DATASET_URL}${thumbnail.slice(datasetIndex)}`
    : thumbnail;
};
export const translateText = async (text: string): Promise<string> => {
    const url = "https://translate.googleapis.com/translate_a/single";
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'vi',
      tl: 'en',
      dt: 't',
      q: text
    });
  
    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Translation failed with status ${response.status}`);
    }
  
    const result = await response.json();
    return result[0].map((item: [string]) => item[0]).join('');
  };
// ✅ MODIFIED: This function now constructs `title` and `thumbnail`
export const searchByText = async (
  queries: ApiQuery[],
  mode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100
): Promise<ResultItem[]> => {
  const endpoint = mode === 'chain' ? '/embeddings/chain_search' : '/embeddings/search';
  
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('page_size', pageSize.toString());

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queries),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(`Failed to search: ${errorData ? JSON.stringify(errorData) : res.statusText}`);
  }

  // The backend now returns a partial result, we need to shape it
  const partialData = await res.json();

  // Map over the partial data to create full ResultItem objects
  return partialData.map((item: { videoId: string, timestamp: string, confidence: number }, index: number) => {
    // Construct the thumbnail path based on the provided logic
    const thumbnailPath = `/dataset/full/batch1/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
    
    return {
      videoId: item.videoId,
      timestamp: item.timestamp,
      confidence: item.confidence,
      // Create the missing properties
      id: `${page}-${index}`, // The 'id' should be unique across all pages for a given search
      title: `${item.videoId} - ${item.timestamp}`, // Create title from videoId and timestamp
      thumbnail: adjustThumbnail(thumbnailPath), // Create and adjust the thumbnail URL
    };
  });
};
// ✅ MODIFIED: This function also constructs `title` and `thumbnail`
export const searchBySingleQuery = async (
    query: ApiQuery
  ): Promise<ResultItem[]> => {
    const endpoint = '/embeddings/stage';
  
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([query]), // The endpoint expects an array of queries
    });
  
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        `Failed to search: ${
          errorData ? JSON.stringify(errorData) : res.statusText
        }`
      );
    }
  
    const partialData = await res.json();
  
    // Map over the partial data to create full ResultItem objects
    return partialData.map((item: { videoId: string, timestamp: string, confidence: number }, index: number) => {
        // Construct the thumbnail path based on the provided logic
        const thumbnailPath = `/dataset/full/batch1/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
        
        return {
            videoId: item.videoId,
            timestamp: item.timestamp,
            confidence: item.confidence,
            // Create the missing properties
            id: String(index),
            title: `${item.videoId} - ${item.timestamp}`, // Create title from videoId and timestamp
            thumbnail: adjustThumbnail(thumbnailPath), // Create and adjust the thumbnail URL
        };
    });
  };