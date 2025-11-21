// src/features/search/components/SimilaritySearch/SimilaritySearch.ts

import type { ResultItem, SearchMode, ApiQuery } from '../../types';
import type { ModelSelection } from '../../types';
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

export const searchBySimilarImage = async (
  imageSrc: string,
  searchMode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100,
  modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
): Promise<ResultItem[]> => {
  try {
    
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
      ? '/embeddings/stage' 
      : '/embeddings/stage';

    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('page_size', pageSize.toString());

    url.searchParams.append('use_clip', modelSelection.use_clip.toString());
    url.searchParams.append('use_siglip2', modelSelection.use_siglip2.toString());
    url.searchParams.append('use_beit3', modelSelection.use_beit3.toString());

    
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
      const thumbnailPath = `/dataset/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
      
      return {
        videoId: item.videoId,
        timestamp: item.timestamp,
        confidence: item.confidence,
        id: `${page}-${index}`,
        title: `${item.videoId} - ${item.timestamp}`,
        thumbnail: adjustThumbnail(thumbnailPath),
      };
    });

  } catch (error) {
    console.error('Similarity search error:', error);
    throw error;
  }
};

export const performSimilaritySearch = async (
  imageSrc: string,
  cardId: string,
  onResults: (results: ResultItem[]) => void,
  onError?: (error: Error) => void,
  onLoading?: (loading: boolean) => void,
  searchMode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100,
  modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
): Promise<void> => {
  try {
    
    onLoading?.(true);
    
    const results = await searchBySimilarImage(imageSrc, searchMode, page, pageSize, modelSelection);
    
    onResults(results);
    
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