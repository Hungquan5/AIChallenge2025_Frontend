// src/features/SearchRequest/searchApi.ts

import type { ResultItem, SearchMode, ApiQuery } from '../../types';

const API_BASE_URL = 'http://localhost:5731';
const LOCAL_DATASET_URL = 'http://localhost:1406';

// Helper function to adjust thumbnail URLs
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
// ✅ MODIFIED: Added page and pageSize parameters
export const searchByText = async (
  queries: ApiQuery[],
  mode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100
): Promise<ResultItem[]> => {
  const endpoint = mode === 'chain' ? '/embeddings/chain_search' : '/embeddings/search';
  
  // ✅ Construct URL with pagination query parameters
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

  const data: ResultItem[] = await res.json();

  return data.map((item, index) => ({
    ...item,
    // The 'id' should be unique across all pages for a given search
    id: `${page}-${index}`, 
    thumbnail: adjustThumbnail(item.thumbnail),
  }));
};

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
  
    const data: ResultItem[] = await res.json();
  
    return data.map((item, index) => ({
      ...item,
      id: String(index),
      thumbnail: adjustThumbnail(item.thumbnail),
    }));
  };