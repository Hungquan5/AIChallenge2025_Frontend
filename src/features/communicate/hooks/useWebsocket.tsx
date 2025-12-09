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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const currentUsernameRef = useRef<string>('');
  
  const WS_URL = 'ws://localhost:23111/ws';
  
  // Stable callback refs to prevent reconnections
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  
  // Update refs when props change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  }, [onMessage, onConnect, onDisconnect, onError]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || 
        wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING ||
        !username) {
      console.log('Connection attempt blocked:', {
        isConnecting: isConnectingRef.current,
        readyState: wsRef.current?.readyState,
        username: !!username
      });
      return;
    }

    console.log(`Attempting to connect WebSocket for user: ${username}`);
    isConnectingRef.current = true;
    currentUsernameRef.current = username;
    
    try {
      const ws = new WebSocket(`${WS_URL}/${encodeURIComponent(username)}`);

      ws.onopen = () => {
        console.log(`WebSocket connected for user: ${username}`);
        isConnectingRef.current = false;
        setIsConnected(true);
        clearReconnectTimeout();
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected for user: ${username}`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        isConnectingRef.current = false;
        setIsConnected(false);
        onDisconnectRef.current?.();
        
        // Only auto-reconnect if:
        // 1. We should reconnect (not manually disconnected)
        // 2. The connection was for the current username
        // 3. The close wasn't clean (unexpected disconnect)
        if (shouldReconnectRef.current && 
            currentUsernameRef.current === username && 
            !event.wasClean &&
            event.code !== 1000) { // 1000 = normal closure
          
          console.log('Scheduling reconnection in 3 seconds...');
          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current && currentUsernameRef.current === username) {
              console.log('Auto-reconnecting...');
              connect();
            }
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for user: ${username}`, error);
        isConnectingRef.current = false;
        onErrorRef.current?.(error);
      };

      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      isConnectingRef.current = false;
    }
  }, [username, clearReconnectTimeout, WS_URL]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting WebSocket');
    shouldReconnectRef.current = false;
    isConnectingRef.current = false;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      // Use clean close code to prevent auto-reconnection
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearReconnectTimeout]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected. Current state:', wsRef.current?.readyState);
    }
  }, []);

  const sendImage = useCallback((imageData: string) => {
    sendMessage(imageData);
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    shouldReconnectRef.current = true;
    disconnect();
    setTimeout(() => {
      if (shouldReconnectRef.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  // Main connection effect - only runs when username changes
  useEffect(() => {
    if (!username) {
      console.log('No username provided, skipping connection');
      return;
    }

    // If username changed, we need to disconnect old connection first
    if (currentUsernameRef.current && currentUsernameRef.current !== username) {
      console.log(`Username changed from ${currentUsernameRef.current} to ${username}`);
      shouldReconnectRef.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, 'Username changed');
      }
    }

    shouldReconnectRef.current = true;
    connect();

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection');
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [username]); // Only depend on username

  return {
    isConnected,
    sendMessage,
    sendImage,
    disconnect,
    reconnect,
    lastMessage,
  };
};