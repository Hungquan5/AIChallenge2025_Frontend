import type { ResultItem } from "../../search/types";
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
    const body = {
      answerSets: [
        {
          answers: [
            {
              mediaItemName: result.videoId,
              start: parseInt(result.timestamp) / 25 * 1000,
              end: parseInt(result.timestamp) / 25 * 1000
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
      // Try to parse error message from DRES if available
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.description || `DRES submission failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('DRES submission success:', data);
    return data; // ✅ RETURN THE SUBMISSION RESULT
  } catch (error) {
    console.error('DRES submission error:', error);
    // Re-throw the error so the calling function can catch it
    throw error;
  }
};
const fullSubmissionFlow = async (result: ResultItem) => {
  const sessionId = "uneVJA5BbMLneeYbeARgO4t4JBBNy7wq";
  const evaluationId = await getEvaluationId(sessionId);
  // ✅ RETURN THE RESULT FROM THE FLOW
  return await submitToDres(result, sessionId, evaluationId); 
};
export { fullSubmissionFlow };   