import type { ResultItem, SearchMode, ApiQuery } from '../../types';

const API_BASE_URL = 'http://localhost:5731';
const LOCAL_DATASET_URL = 'http://localhost:1406';

const adjustThumbnail = (thumbnail: string): string => {
  const datasetIndex = thumbnail.indexOf('/dataset/');
  return datasetIndex !== -1
    ? `${LOCAL_DATASET_URL}${thumbnail.slice(datasetIndex)}`
    : thumbnail;
};

const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image URL to base64:', error);
    throw error;
  }
};

/**
 * Perform similarity search using an image URL
 * @param imageSrc - The image URL to search for similar images
 * @param searchMode - The search mode ('normal' or 'chain')
 * @param page - The page number to retrieve
 * @param pageSize - The number of results per page
 * @returns Promise<ResultItem[]> - Array of similar images
 */
export const searchBySimilarImage = async (
  imageSrc: string,
  searchMode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100
): Promise<ResultItem[]> => {
  try {
    console.log(`Starting similarity search for image: ${imageSrc}, page: ${page}`);
    
    const imageBase64 = await imageUrlToBase64(imageSrc);
    
    const apiQuery: ApiQuery = {
      text: '',
      image: imageBase64,
      asr: '',
      ocr: '',
      origin: '',
      obj: [],
      lang: 'ori'
    };

    const endpoint = searchMode === 'chain' 
      ? '/embeddings/chain_search' 
      : '/embeddings/search';

    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('page_size', pageSize.toString());

    console.log('Sending similarity search request...');
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([apiQuery]),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Similarity search failed: ${
          errorData ? JSON.stringify(errorData) : response.statusText
        }`
      );
    }

    const partialData = await response.json();
    
    return partialData.map((item: { videoId: string, timestamp: string, confidence: number }, index: number) => {
      const thumbnailPath = `/dataset/full/merge/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
      
      return {
        videoId: item.videoId,
        timestamp: item.timestamp,
        confidence: item.confidence,
        id: `${page}-${index}`, // ✅ Use page number for unique ID
        title: `${item.videoId} - ${item.timestamp}`,
        thumbnail: adjustThumbnail(thumbnailPath),
      };
    });

  } catch (error) {
    console.error('Similarity search error:', error);
    throw error;
  }
};

/**
 * Perform similarity search and handle UI feedback
 * ✅ ADDED: page and pageSize parameters to support pagination
 */
export const performSimilaritySearch = async (
  imageSrc: string,
  cardId: string,
  onResults: (results: ResultItem[]) => void,
  onError?: (error: Error) => void,
  onLoading?: (loading: boolean) => void,
  searchMode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100
): Promise<void> => {
  try {
    console.log(`Performing similarity search for card ${cardId} with image: ${imageSrc}`);
    
    onLoading?.(true);
    
    const results = await searchBySimilarImage(imageSrc, searchMode, page, pageSize);
    
    onResults(results);
    
    console.log(`Similarity search completed for card ${cardId}. Found ${results.length} similar images.`);
  } catch (error) {
    const searchError = error instanceof Error ? error : new Error('Unknown similarity search error');
    console.error(`Similarity search failed for card ${cardId}:`, searchError);
    
    if (onError) {
      onError(searchError);
    } else {
      alert(`Similarity search failed: ${searchError.message}`);
    }
  } finally {
    onLoading?.(false);
  }
};

/**
 * Hook for handling similarity search in React components.
 * Note: This hook is intended to INITIATE a search (i.e., for page 1).
 * Subsequent page requests should be handled by a dedicated pagination handler.
 */
export const useSimilaritySearch = (
  onResults: (results: ResultItem[]) => void,
  onError?: (error: Error) => void,
  onLoading?: (loading: boolean) => void,
  searchMode: SearchMode = 'normal'
) => {
  return (imageSrc: string, cardId: string) => {
    // This hook always triggers a search for the first page.
    performSimilaritySearch(
      imageSrc,
      cardId,
      onResults,
      onError,
      onLoading,
      searchMode,
      1 // Page 1
    );
  };
};