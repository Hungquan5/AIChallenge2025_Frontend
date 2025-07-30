export interface ResultItem {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string;
    confidence: number;
    timestamp: string;
}

export interface Query {
  text: string;        // nội dung chính (được tự động dịch sang tiếng anh)
  asr: string;         // automatic speech recognition input
  ocr: string;         // OCR text
  origin: string;      // nội dung gốc (chưa dịch)
  obj?: string[];      // optional list of objects (e.g., ["car", "man"])
  lang?: 'ori' | 'eng';      // nội dung chọn để vector search
}

export interface GroupedResult {
    videoId: string;
    videoTitle: string;
    items: ResultItem[];
}