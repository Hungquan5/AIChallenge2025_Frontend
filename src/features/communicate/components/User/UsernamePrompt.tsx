import React, { useState } from 'react';

interface UsernamePromptProps {
  isLoading: boolean;
  onConnect: (username: string) => Promise<boolean>;
}

export const UsernamePrompt: React.FC<UsernamePromptProps> = ({ isLoading, onConnect }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    setError(null);
    const success = await onConnect(username.trim());
    if (!success) {
      setError('Failed to connect. Please try a different username.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome!</h2>
        <p className="mb-6 text-gray-600">Please enter your name to join the session.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
};