export type SearchMode = 'normal' | 'chain' | 'ocr';

export interface ResultItem {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string;
    confidence: number;
    timestamp: string;
}

export interface GroupedResult {
    videoId: string;
    videoTitle: string;
    items: ResultItem[];
}