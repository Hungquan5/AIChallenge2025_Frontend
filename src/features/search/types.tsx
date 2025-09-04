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

// Define a separate type for the API payload
export interface ApiQuery {
  text: string;
  asr: string;
  ocr: string;
  origin: string;
  obj: string[];
  lang: 'eng' | 'ori';
  image: string; // For the base64 encoded image
}


// ✅ ADD THIS TYPE DEFINITION
export interface HistoryItem {
  queries: Query[];
  dislike_labels: string[];
}
