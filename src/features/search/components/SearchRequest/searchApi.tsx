// src/components/InputPanel/api.ts

import type { ResultItem } from '../../types/result';
const LOCAL_DATASET_URL = 'http://localhost:1406';

export const searchByText = async (query: string): Promise<ResultItem[]> => {
  const res = await fetch('http://localhost:5731/embeddings/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: query }),
  });

  if (!res.ok) throw new Error('Failed to search');

  const data: ResultItem[] = await res.json();
  console.log(data);

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
