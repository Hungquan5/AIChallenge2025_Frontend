// src/components/SearchRequest/similaritySearchApi.ts
import type { ResultItem, SearchMode, ApiQuery } from '../../types';

const API_BASE_URL = 'http://localhost:5731';
const LOCAL_DATASET_URL = 'http://localhost:1406';

const adjustThumbnail = (thumbnail: string): string => {
  const datasetIndex = thumbnail.indexOf('/dataset/');
  return datasetIndex !== -1
    ? `${LOCAL_DATASET_URL}${thumbnail.slice(datasetIndex)}`
    : thumbnail;
};

/**
 * Convert an image URL to base64 string
 */
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
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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
 * @returns Promise<ResultItem[]> - Array of similar images
 */
export const searchBySimilarImage = async (
  imageSrc: string,
  searchMode: SearchMode = 'normal'
): Promise<ResultItem[]> => {
  try {
    console.log(`Starting similarity search for image: ${imageSrc}`);
    
    // Convert image URL to base64
    const imageBase64 = await imageUrlToBase64(imageSrc);
    
    // Create API query for image similarity search
    const apiQuery: ApiQuery = {
      text: '', // Empty text for image-only search
      image: imageBase64,
      asr: '',
      ocr: '',
      origin: '',
      obj: [],
      lang: 'ori'
    };

    // Determine endpoint based on search mode
    const endpoint = searchMode === 'chain' 
      ? '/embeddings/chain_search' 
      : '/embeddings/search';

    console.log('Sending similarity search request...');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([apiQuery]), // Send as array like in handleSearch
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Similarity search failed: ${
          errorData ? JSON.stringify(errorData) : response.statusText
        }`
      );
    }

    const data: ResultItem[] = await response.json();
    console.log('Similarity search results:', { searchMode, resultCount: data.length });
    
    // Process results similar to searchByText function
    return data.map((item, index) => ({
      ...item,
      id: String(index),
      thumbnail: adjustThumbnail(item.thumbnail),
    }));

  } catch (error) {
    console.error('Similarity search error:', error);
    throw error;
  }
};

/**
 * Perform similarity search and handle UI feedback
 * @param imageSrc - The image URL to search for similar images
 * @param cardId - The ID of the card that triggered the search (for logging)
 * @param onResults - Callback to handle the search results
 * @param onError - Optional callback to handle errors
 * @param onLoading - Optional callback to handle loading state
 * @param searchMode - The search mode ('normal' or 'chain')
 */
export const performSimilaritySearch = async (
  imageSrc: string,
  cardId: string,
  onResults: (results: ResultItem[]) => void,
  onError?: (error: Error) => void,
  onLoading?: (loading: boolean) => void,
  searchMode: SearchMode = 'normal'
): Promise<void> => {
  try {
    console.log(`Performing similarity search for card ${cardId} with image: ${imageSrc}`);
    
    // Set loading state
    onLoading?.(true);
    
    // Perform the similarity search
    const results = await searchBySimilarImage(imageSrc, searchMode);
    
    // Handle results
    onResults(results);
    
    console.log(`Similarity search completed for card ${cardId}. Found ${results.length} similar images.`);
  } catch (error) {
    const searchError = error instanceof Error ? error : new Error('Unknown similarity search error');
    console.error(`Similarity search failed for card ${cardId}:`, searchError);
    
    if (onError) {
      onError(searchError);
    } else {
      // Default error handling
      alert(`Similarity search failed: ${searchError.message}`);
    }
  } finally {
    // Clear loading state
    onLoading?.(false);
  }
};

/**
 * Hook for handling similarity search in React components
 * Usage example:
 * 
 * const handleSimilaritySearch = useSimilaritySearch(
 *   (results) => setSearchResults(results),
 *   (error) => console.error(error),
 *   (loading) => setIsLoading(loading)
 * );
 * 
 * // In your ResultCard:
 * <ResultCard onSimilaritySearch={handleSimilaritySearch} ... />
 */
export const useSimilaritySearch = (
  onResults: (results: ResultItem[]) => void,
  onError?: (error: Error) => void,
  onLoading?: (loading: boolean) => void,
  searchMode: SearchMode = 'normal'
) => {
  return (imageSrc: string, cardId: string) => {
    performSimilaritySearch(
      imageSrc,
      cardId,
      onResults,
      onError,
      onLoading,
      searchMode
    );
  };
};