// src/types.ts

export interface ResultItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  confidence: number;
  timestamp: string;
}

export interface Query {
  text: string;
  asr: string;
  ocr: string;
  origin: string;
  obj: string[];
  lang: 'eng' | 'ori';
  imageFile?: File | null;
  
}

export interface GroupedResult {
  videoId: string;
  videoTitle: string;
  items: ResultItem[];
}

export type SearchMode = 'normal' | 'chain';



// ✅ ADD THIS TYPE DEFINITION
export interface HistoryItem {
  queries: Query[];
  dislike_labels: string[];
}


// 1. First, update your types to include model selection

// src/features/search/types.ts
export interface ModelSelection {
  use_clip: boolean;
  use_siglip2: boolean;
  use_beit3: boolean;
}

export interface ApiQuery {
  text: string;
  asr: string;
  ocr: string;
  origin: string;
  obj: string[];
  lang: 'eng' | 'ori';
  image: string;
}

// Add to existing search function signature
export interface SearchParams {
  queries: ApiQuery[];
  mode: SearchMode;
  page?: number;
  page_size?: number;
  user_id?: string;
  modelSelection?: ModelSelection;
}