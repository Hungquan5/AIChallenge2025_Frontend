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

export type ViewMode = 'sortByConfidence' | 'groupByVideo';
