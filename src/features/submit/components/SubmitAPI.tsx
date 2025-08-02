import type { ResultItem } from "../../search/types";

const submitToDres = async (result: ResultItem) => {
  try {
    const response = await fetch('https://your-dres-endpoint.com/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include authorization token if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: result.id,
        timestamp: result.timestamp,
        videoId: result.videoId,
        // Add other fields required by DRES API
      }),
    });

    if (!response.ok) {
      throw new Error(`DRES submission failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Submission success:', data);
    // Optionally show toast or success indicator
  } catch (error) {
    console.error('DRES submission error:', error);
    // Optionally show error message
  }
};
export { submitToDres };   