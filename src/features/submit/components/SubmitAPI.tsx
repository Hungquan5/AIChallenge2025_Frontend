import frameRates from '../../../assets/video_fps.json'; // 1. Import the JSON file
import type { ResultItem } from "../../search/types";

// Define a type for the frame rates data for better type checking
type FrameRates = {
  [key: string]: number;
};

// Cast the imported JSON data to our defined type
const videoFrameRates: FrameRates = frameRates;

const loginToDres = async (username: string = 'quannh', password: string='123456') => {
  const response = await fetch('http://192.168.28.151:5000/api/v2/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.sessionId;
};

const getEvaluationId = async (sessionId: string) => {
  const response = await fetch(`http://192.168.28.151:5000/api/v2/client/evaluation/list?session=${sessionId}`, {
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
  evaluationId: string
) => {
  try {
    // 2. Look up the frame rate, with a fallback to a default value
    const frameRate = videoFrameRates[`${result.videoId}.mp4`] || 25.0;

    const body = {
      answerSets: [
        {
          answers: [
            {
              mediaItemName: result.videoId,
              // 3. Use the dynamic frameRate in the calculation
              start: parseInt(result.timestamp) / frameRate * 1000,
              end: parseInt(result.timestamp) / frameRate * 1000
            },
          ],
        },
      ],
    };

    const response = await fetch(`http://192.168.28.151:5000/api/v2/submit/${evaluationId}?session=${sessionId}`, {
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

const fullSubmissionFlow = async (result: ResultItem) => {
  const sessionId = "gKUoLj-0Sms2QsGts1g-7LO6NVST6ha8";
  const evaluationId = await getEvaluationId(sessionId);
  return await submitToDres(result, sessionId, evaluationId);
};

export { fullSubmissionFlow };
