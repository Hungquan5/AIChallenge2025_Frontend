// src/components/InputPanel/api.ts

import type { ResultItem, SearchMode } from '../../types/result';
const LOCAL_DATASET_URL = 'http://localhost:1406';

export const searchByText = async (queries: string[], mode: SearchMode = 'normal'): Promise<ResultItem[]> => {
  // Validate queries
  if (!queries.length || queries.every(q => !q.trim())) {
    throw new Error('Search queries cannot be empty');
  }

  // Remove any empty queries and trim whitespace
  const validQueries = queries.map(q => q.trim()).filter(q => q);

  const endpoint = mode === 'chain' ? '/embeddings/chain_search' : '/embeddings/search';
  
  const res = await fetch(`http://localhost:5731${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Queries: validQueries }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(`Failed to search: ${errorData ? JSON.stringify(errorData) : res.statusText}`);
  }

  const data: ResultItem[] = await res.json();
  console.log('Search results:', { mode, data });

  return data.map((item, index) => {
    const datasetIndex = item.thumbnail.indexOf('/dataset/');
    const adjustedThumbnail =
      datasetIndex !== -1
        ? `${LOCAL_DATASET_URL}${item.thumbnail.slice(datasetIndex)}`
        : item.thumbnail;

    return {
      ...item,
      id: String(index),
      thumbnail: adjustedThumbnail,
    };
  });
};

export const searchByOcr = async (query: string): Promise<ResultItem[]> => {
  if (!query || !query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  const res = await fetch('http://localhost:5731/embeddings/ocr_search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: query.trim(), size: 10 }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(`Failed to search: ${errorData ? JSON.stringify(errorData) : res.statusText}`);
  }

  const data: ResultItem[] = await res.json();
  console.log('OCR search results:', data);

  return data.map((item, index) => {
    const datasetIndex = item.thumbnail.indexOf('/dataset/');
    const adjustedThumbnail =
      datasetIndex !== -1
        ? `${LOCAL_DATASET_URL}${item.thumbnail.slice(datasetIndex)}`
        : item.thumbnail;

    return {
      ...item,
      id: String(index),
      thumbnail: adjustedThumbnail,
    };
  });
};
