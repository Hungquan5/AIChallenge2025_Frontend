// components/ConnectionStatus.tsx
import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  username: string | null;
  onReconnect: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  username,
  onReconnect,
}) => {
  const statusColor = isConnected ? 'text-green-600' : 'text-red-600';
  const statusText = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className={`font-medium ${statusColor}`}>
        {statusText}
        {username && ` as ${username}`}
      </span>
      {!isConnected && (
        <button
          onClick={onReconnect}
          className="ml-auto px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};