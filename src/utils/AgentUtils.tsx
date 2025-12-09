// src/utils/agentUtils.ts

import type { ResultItem } from '../features/results/types';
const LOCAL_DATASET_URL = 'http://localhost:1406';
const adjustThumbnail = (thumbnail: string): string => {
  const datasetIndex = thumbnail.indexOf('/dataset/');
  return datasetIndex !== -1
    ? `${LOCAL_DATASET_URL}${thumbnail.slice(datasetIndex)}`
    : thumbnail;
};

/**
 * Agent API Response Types
 */
export interface AgentToolOutput {
  tool: string;
  ok: boolean;
  output: AgentSearchResult[];
}

export interface AgentSearchResult {
  id: string;
  videoId: string;
  confidence: number;
  timestamp: string;
}

export interface AgentChatResponse {
  message: string;
  tool_outputs: AgentToolOutput[];
}
// --- type guard(s)
const isToolOutputArray = (arr: unknown[]): arr is AgentToolOutput[] =>
  !!arr.length && typeof (arr[0] as any)?.tool === 'string' && Array.isArray((arr[0] as any)?.output);

/**
 * Convert agent API tool outputs to ResultItem format
 */
export const convertAgentOutputToResults = (
  source: AgentToolOutput[] | AgentSearchResult[],
  page: number = 1
): ResultItem[] => {
  if (!Array.isArray(source) || source.length === 0) return [];

  // Normalize to AgentSearchResult[]
  const items: AgentSearchResult[] = isToolOutputArray(source)
    ? (source as AgentToolOutput[])
        .filter(t => t?.ok && Array.isArray(t.output))
        .flatMap(t => t.output)
    : (source as AgentSearchResult[]);

  // Map EXACTLY like searchByText()
  return items.map((item, index) => {
    const thumbnailPath = `/dataset/${item.videoId}/${item.videoId}_keyframe_${item.timestamp}.webp`;
    return {
      videoId: item.videoId,
      timestamp: item.timestamp,
      confidence: item.confidence,
      id: `${page}-${index}`,
      title: `${item.videoId} - ${item.timestamp}`,
      thumbnail: adjustThumbnail(thumbnailPath),
    };
  });
};
/**
 * Call the agent API
 */
export const sendAgentMessage = async (
  message: string,
  userId: string = 'anonymous'
): Promise<AgentChatResponse> => {
  const response = await fetch('http://localhost:5731/agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msg: message,
      user_id: userId
    })
  });
  
  if (!response.ok) {
    throw new Error(`Agent API error: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Extract video IDs from agent message for reference
 */
export const extractVideoIds = (message: string): string[] => {
  const videoIdPattern = /Video ID:\s*([^\s,]+)/g;
  const matches = message.matchAll(videoIdPattern);
  return Array.from(matches, m => m[1]);
};

/**
 * Format timestamp for display (assumes timestamp is in milliseconds or frames)
 */
export const formatTimestamp = (timestamp: string | number): string => {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const seconds = Math.floor(ts / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};