// src/features/SearchRequest/searchApi.ts

// ... (your existing searchByText, etc.)

// ✅ 1. Define the type for the information payload based on your backend model
export interface InformationOfFrame {
    ocr_text: string;
    asr_text: string;
    objects: string;
  }
  
  // ✅ 2. Create the new API function
  export const getFrameInformation = async (
    videoId: string,
    frameId: string
  ): Promise<InformationOfFrame | null> => {
    const url = new URL('http://localhost:2311/embeddings/information');
    // Pass video_id and frame_id as query parameters
    url.searchParams.append('video_id', videoId);
    url.searchParams.append('frame_id', frameId);
  
    const res = await fetch(url.toString(), {
      method: 'POST', // As defined in your FastAPI router
      headers: { 'Content-Type': 'application/json' },
    });
  
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        `Failed to fetch frame information: ${
          errorData ? JSON.stringify(errorData) : res.statusText
        }`
      );
    }
  
    // Your endpoint can return `null`, which res.json() will parse correctly.
    const data: InformationOfFrame | null = await res.json();
    console.log('Frame Information:', data);
    return data;
  };