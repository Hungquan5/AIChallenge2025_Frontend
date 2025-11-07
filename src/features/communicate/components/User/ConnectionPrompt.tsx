import React, { useState } from 'react';

interface ConnectionPromptProps {
  isLoading: boolean;
  // ✅ 1. Update the onConnect signature to pass all three values
  onConnect: (username: string, dresSessionId: string, dresBaseUrl: string) => void;
}

export const ConnectionPrompt: React.FC<ConnectionPromptProps> = ({ isLoading, onConnect }) => {
  // ✅ 2. Add state for the new username field
  const [username, setUsername] = useState('');
  const [dresSessionId, setDresSessionId] = useState('');
  const [dresBaseUrl, setDresBaseUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ 3. Validate all three fields
    if (!username.trim() || !dresSessionId.trim() || !dresBaseUrl.trim()) {
      setError('Username, DRES Session ID, and DRES Base URL cannot be empty.');
      return;
    }
    setError(null);
    // ✅ 4. Pass all three values to the handler
    onConnect(username.trim(), dresSessionId.trim(), dresBaseUrl.trim());
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Connect to VBS</h2>
        <p className="mb-6 text-gray-600">Please enter your credentials.</p>
        <form onSubmit={handleSubmit}>
          {/* ✅ 5. Add Input for Username */}
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Username..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          {/* ✅ 6. Clarify label for DRES Session ID */}
          <div className="mb-4">
            <input
              type="text"
              value={dresSessionId}
              onChange={(e) => setDresSessionId(e.target.value)}
              placeholder="Enter your DRES Session ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <input
              type="text"
              value={dresBaseUrl}
              onChange={(e) => setDresBaseUrl(e.target.value)}
              placeholder="Enter the DRES Base URL (e.g., https://...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !dresSessionId.trim() || !dresBaseUrl.trim()}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
};