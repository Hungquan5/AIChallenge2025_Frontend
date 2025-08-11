// src/utils/imageUtils.ts
export const getImageUrl = (videoId: string, thumbnail: string): string => {
  // If the thumbnail is already a full URL, return it directly.
  if (thumbnail.startsWith('http')) {
    return thumbnail;
  }
  // Otherwise, construct the URL for keyframes.
  return `http://localhost:1406/dataset/full_batch1/${videoId}/keyframes/${thumbnail}`;
};