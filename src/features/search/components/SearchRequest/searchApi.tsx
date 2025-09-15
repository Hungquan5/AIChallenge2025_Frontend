import type { ResultItem, SearchMode, ApiQuery,HistoryItem } from '../../types';
import type { ModelSelection } from '../../types';
const API_BASE_URL = 'http://localhost:5731';
const LOCAL_DATASET_URL = 'http://localhost:1406';

const adjustThumbnail = (thumbnail: string): string => {
  const datasetIndex = thumbnail.indexOf('/dataset/');
  return datasetIndex !== -1
    ? `${LOCAL_DATASET_URL}${thumbnail.slice(datasetIndex)}`
    : thumbnail;
};


export const searchBySingleQuery = async (
  query: ApiQuery, 
  user_id: string,
  page: number = 1,
  pageSize: number = 100,
  modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
): Promise<ResultItem[]> => {
  const endpoint = '/embeddings/stage';
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  url.searchParams.append('user_id', user_id);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('page_size', pageSize.toString());
  
  url.searchParams.append('use_clip', modelSelection.use_clip.toString());
  url.searchParams.append('use_siglip2', modelSelection.use_siglip2.toString());
  url.searchParams.append('use_beit3', modelSelection.use_beit3.toString());

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([query]),
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
  return partialData.map((item: { videoId: string, timestamp: string, confidence: number }, index: number) => {
      const thumbnailPath = `/dataset/full/merge/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
      return {
          videoId: item.videoId,
          timestamp: item.timestamp,
          confidence: item.confidence,
          id: `${page}-${index}`,
          title: `${item.videoId} - ${item.timestamp}`,
          thumbnail: adjustThumbnail(thumbnailPath),
      };
  });
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

// ✅ UPDATED: Add modelSelection parameter
export const searchByText = async (
  queries: ApiQuery[],
  user_id: string,
  mode: SearchMode = 'normal',
  page: number = 1,
  pageSize: number = 100,
  modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
): Promise<ResultItem[]> => {
  const endpoint = mode === 'chain' ? '/embeddings/chain_search' : '/embeddings/search';
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('page_size', pageSize.toString());
  url.searchParams.append('user_id', user_id);
  
  // ✅ ADD: Model selection parameters
  url.searchParams.append('use_clip', modelSelection.use_clip.toString());
  url.searchParams.append('use_siglip2', modelSelection.use_siglip2.toString());
  url.searchParams.append('use_beit3', modelSelection.use_beit3.toString());

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queries),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(`Failed to search: ${errorData ? JSON.stringify(errorData) : res.statusText}`);
  }

  const partialData = await res.json();
  return partialData.map((item: { videoId: string, timestamp: string, confidence: number }, index: number) => {
    const thumbnailPath = `/dataset/full/merge/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
    return {
      videoId: item.videoId,
      timestamp: item.timestamp,
      confidence: item.confidence,
      id: `${page}-${index}`,
      title: `${item.videoId} - ${item.timestamp}`,
      thumbnail: adjustThumbnail(thumbnailPath),
    };
  });
};

/**
 * ✅ MODIFIED: This function now accepts page and pageSize for pagination
 */
// ✅ UPDATED: Add modelSelection parameter to single query search too
// export const searchBySingleQuery = async (
//   query: ApiQuery, 
//   user_id: string,
//   page: number = 1,
//   pageSize: number = 100,
//   modelSelection: ModelSelection = { use_clip: true, use_siglip2: true, use_beit3: true }
// ): Promise<ResultItem[]> => {
//   const endpoint = '/embeddings/stage';
//   const url = new URL(`${API_BASE_URL}${endpoint}`);
//   url.searchParams.append('user_id', user_id);
//   url.searchParams.append('page', page.toString());
//   url.searchParams.append('page_size', pageSize.toString());
  
//   // ✅ ADD: Model selection parameters
//   url.searchParams.append('use_clip', modelSelection.use_clip.toString());
//   url.searchParams.append('use_siglip2', modelSelection.use_siglip2.toString());
//   url.searchParams.append('use_beit3', modelSelection.use_beit3.toString());

//   const res = await fetch(url.toString(), {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify([query]),
//   });

//   if (!res.ok) {
//     const errorData = await res.json().catch(() => null);
//     throw new Error(
//       `Failed to search: ${
//         errorData ? JSON.stringify(errorData) : res.statusText
//       }`
//     );
//   }

//   const partialData = await res.json();
//   return partialData.map((item: { videoId: string, timestamp: string, confidence: number }, index: number) => {
//       const thumbnailPath = `/dataset/full/merge/${item.videoId}/keyframes/keyframe_${item.timestamp}.webp`;
//       return {
//           videoId: item.videoId,
//           timestamp: item.timestamp,
//           confidence: item.confidence,
//           id: `${page}-${index}`,
//           title: `${item.videoId} - ${item.timestamp}`,
//           thumbnail: adjustThumbnail(thumbnailPath),
//       };
//   });
// };

export const getHistory = async (username: string): Promise<HistoryItem[]> => {
  try {
    const endpoint = '/embeddings/history'
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.append('user_id', username);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`History fetch failed with status: ${response.status}`);
    }

    const data: HistoryItem[] = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get query history:', error);
    return [];
  }
};