// src/components/SearchRequest/searchApi.ts
import type { ResultItem, SearchMode, ApiQuery } from '../../types';

const API_BASE_URL = 'http://localhost:5731';
const LOCAL_DATASET_URL = 'http://localhost:1406';

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
    sl: 'auto',
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

export const searchByText = async (
  queries: ApiQuery[],
  mode: SearchMode = 'normal'
): Promise<ResultItem[]> => {



  const endpoint =
    mode === 'chain'
      ? '/embeddings/chain_search'
      : '/embeddings/search';

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // The received 'queries' are sent directly in the body.
    body: JSON.stringify(queries),
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
  console.log('Search results:', { mode, data });

  return data.map((item, index) => ({
    ...item,
    id: String(index),
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
  console.log('Single query search results:', { data });

  return data.map((item, index) => ({
    ...item,
    id: String(index),
    thumbnail: adjustThumbnail(item.thumbnail),
  }));
};