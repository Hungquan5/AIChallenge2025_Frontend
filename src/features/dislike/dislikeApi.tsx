// src/features/results/components/dislikeApi.ts

import type { ResultItem } from "../results/types";

/**
 * Sends a request to the backend to mark a cluster as "disliked" by a user.
 *
 * @param item - The result item containing video_id and timestamp (frame_index).
 * @param userId - The ID of the user disliking the cluster.
 * @returns A promise that resolves with the server's response.
 */

// ✅ This should point to your FastAPI backend server
const API_BASE_URL = 'http://localhost:9991'; 

export const dislikeCluster = async (item: ResultItem, userId: string): Promise<any> => {
  const { videoId, timestamp } = item;
  // The timestamp is expected to be a frame index. We might need to convert it.
  const frameIndex = parseInt(timestamp, 10);

  if (!videoId || isNaN(frameIndex)) {
    throw new Error('Invalid video_id or frame_index for disliking cluster.');
  }

  const queryParams = new URLSearchParams({
    video_id: videoId,
    frame_index: frameIndex.toString(),
    user_id: userId,
  });

  // ✅ FIX: Prepend the API_BASE_URL and use the endpoint name from your Python code
  const url = `${API_BASE_URL}/keyframes/dislike_cluster?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ✅ IMPROVEMENT: Better error handling to avoid JSON parsing errors
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        throw new Error(errorData.detail || `Failed to dislike cluster with status: ${response.status}`);
      } else {
        // The response is not JSON (e.g., HTML error page), so read as text.
        errorData = await response.text();
        throw new Error(`Server returned a non-JSON response: ${errorData}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error in dislikeCluster API call:', error);
    throw error;
  }
};


export const undislikeCluster = async (item: ResultItem, userId: string): Promise<any> => {
  const { videoId, timestamp } = item;
  const frameIndex = parseInt(timestamp, 10);

  if (!videoId || isNaN(frameIndex)) {
    throw new Error('Invalid video_id or frame_index for un-disliking cluster.');
  }

  const queryParams = new URLSearchParams({
    video_id: videoId,
    frame_index: frameIndex.toString(),
    user_id: userId,
  });

  // Note the different endpoint name
  const url = `${API_BASE_URL}/keyframes/un_dislike_cluster?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        throw new Error(errorData.detail || `Failed with status: ${response.status}`);
      } else {
        errorData = await response.text();
        throw new Error(`Server returned a non-JSON response: ${errorData}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error in undislikeCluster API call:', error);
    throw error;
  }
};