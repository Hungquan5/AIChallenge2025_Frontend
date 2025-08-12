export interface ResultItem {
  id: string; // This should be a stable, unique identifier (e.g., from the backend)
  videoId: string;
  title: string;
  thumbnail: string;
  confidence: number;
  timestamp: string;
  filename?: string;
  submittedBy?: string; // Add this to track who sent the item
}
export interface GroupedResult {
  videoId: string;
  videoTitle: string;
  items: ResultItem[];
}

export type ViewMode = 'sortByConfidence' | 'groupByVideo';
