// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from '../types';

interface UseWebSocketProps {
  username: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: string) => void;
  sendImage: (imageData: string) => void;
  disconnect: () => void;
  reconnect: () => void;
  lastMessage: WebSocketMessage | null;
}
export const useWebSocket = ({
    username,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    }: UseWebSocketProps): UseWebSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const WS_URL = 'ws://localhost:9991/ws'; // Use the updated path
    
    const connect = useCallback(() => {
    // --- FIX: Do not attempt to connect if the username is not set ---
    if (!username || wsRef.current?.readyState === WebSocket.OPEN) {
    return;
    }
    
    

    const ws = new WebSocket(`${WS_URL}/${username}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        onMessage?.(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onDisconnect?.();
        
        // Auto-reconnect logic
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          // Only try to reconnect if there is still a valid username
          if (username) {
            connect();
          }
        }, 3000);
      };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    wsRef.current = ws;
  }, [username, onMessage, onConnect, onDisconnect, onError, WS_URL]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const sendImage = useCallback((imageData: string) => {
    sendMessage(imageData);
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [disconnect, connect]);

  useEffect(() => {
    // --- FIX: Connect only when username is valid ---
    if (username) {
    connect();
    }
    return () => {
      disconnect();
    };
  }, [username,connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    sendImage,
    disconnect,
    reconnect,
    lastMessage,
  };
};
