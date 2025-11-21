import frameRates from '../../../assets/video_fps.json'; // 1. Import the JSON file
import type { ResultItem } from "../../search/types";
import { dresService } from '../../../utils/DresService';
// Define a type for the frame rates data for better type checking
type FrameRates = {
  [key: string]: number;
};

// Cast the imported JSON data to our defined type
const videoFrameRates: FrameRates = frameRates;

const submitTrakeToDres = async (
  videoId: string,
  frames: ResultItem[],
  sessionId: string,
  evaluationId: string
) => {
try {
    if (!frames || frames.length === 0) {
      throw new Error("TRAKE submission requires at least one frame.");
    }

    const frameIds = frames.map(frame => frame.timestamp).join(',');
    const submissionText = `TR-${videoId}-${frameIds}`;
    const body = {
      answerSets: [ { answers: [ { text: submissionText, } ] } ]
    };

    // This is a temporary way to get the base URL. It's better to have a getter in the service.
    const dresUrl = (dresService as any).dresBaseUrl; 

    // ✅ 2. CRITICAL FIX: Added a '/' to correctly construct the URL path.
    const response = await fetch(`${dresUrl}/api/v2/submit/${evaluationId}?session=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.description || `DRES TRAKE submission failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('DRES TRAKE submission success:', data);
    return data;

  } catch (error) {
    console.error('DRES TRAKE submission error:', error);
    throw error;
  }
};
// This is the public-facing function that the application calls.
export const fullTrakeSubmissionFlow = async (videoId: string, frames: ResultItem[]) => {
  // ✅ 3. Get the session ID dynamically from the configured service.
  const sessionId = dresService.getSessionId();
  
  // ✅ 4. Add a safety check.
  if (!sessionId) {
    throw new Error("DRES Session ID not found. Please connect first.");
  }
  
  const evaluationId = await getEvaluationId(sessionId);
  return await submitTrakeToDres(videoId, frames, sessionId, evaluationId);
};

// This helper function remains the same.
const getEvaluationId = async (sessionId: string) => {
  const dresUrl = (dresService as any).dresBaseUrl;

  // ✅ 2. CRITICAL FIX: Added a '/' to correctly construct the URL path.
  const response = await fetch(`${dresUrl}/api/v2/client/evaluation/list?session=${sessionId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Get evaluation list failed: ${response.statusText}`);
  }

  const evaluations = await response.json();
  const activeEval = evaluations.find((e: any) => e.status === 'ACTIVE');

  if (!activeEval) {
    throw new Error('No active evaluation found');
  }

  return activeEval.id;
};


const submitToDres = async (
  result: ResultItem,
  sessionId: string,
  evaluationId: string,
  question?: string // Add an optional question parameter
) => {
  try {
    const frameRate = videoFrameRates[`${result.videoId}.mp4`] || 25.0;

    let body;

    if (question) {
      // VQA Submission Body
      body = {
        answerSets: [
          {
            answers: [
              {
                "text": `QA-${question}-${result.videoId}-${Math.round(parseInt(result.timestamp) / frameRate * 1000)}`
              }
            ]
          }
        ]
      };
    } else {
      // Standard Submission Body
      body = {
        answerSets: [
          {
            answers: [
              {
                mediaItemName: result.videoId,
                start: parseInt(result.timestamp) / frameRate * 1000,
                end: parseInt(result.timestamp) / frameRate * 1000
              },
            ],
          },
        ],
      };
    }
  const dresUrl = (dresService as any).dresBaseUrl; // Quick access for now

    const response = await fetch(`${dresUrl}/api/v2/submit/${evaluationId}?session=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.description || `DRES submission failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('DRES submission success:', data);
    return data;
  } catch (error) {
    console.error('DRES submission error:', error);
    throw error;
  }
};

export const fullSubmissionFlow = async (result: ResultItem, question?: string) => {
  // ✅ 3. Get the session ID dynamically from the configured service.
  const sessionId = dresService.getSessionId();
  
  // ✅ 4. Add a safety check.
  if (!sessionId) {
    throw new Error("DRES Session ID not found. Please connect first.");
  }
  
  const evaluationId = await getEvaluationId(sessionId);
  return await submitToDres(result, sessionId, evaluationId, question);
};

