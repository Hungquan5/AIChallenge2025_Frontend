// src/utils/imageUtils.ts

export const getImageUrl = (videoId: string, thumbnail: string | number): string => {
  // 1. If the thumbnail is already a full URL (e.g., from an external source), return it.
  if (typeof thumbnail === 'string' && thumbnail.startsWith('http')) {
    return thumbnail;
  }

  // 2. Convert to string to ensure we can manipulate it
  const frameIdStr = thumbnail.toString();

  // 3. Pad with zeros to length 6 to match the Python script (f"{fid:06d}.webp")
  // Example: "55" -> "000055", "123" -> "000123"
  const paddedFilename = frameIdStr.padStart(6, '0');

  // 4. Construct the URL matching your Nginx alias
  // Nginx Location: /dataset/ -> maps to your keyframes folder
  // Structure: http://host:port/dataset/<Video_Name>/<000xxx>.webp
  return `http://localhost:1406/dataset/${videoId}/${paddedFilename}.webp`;
};