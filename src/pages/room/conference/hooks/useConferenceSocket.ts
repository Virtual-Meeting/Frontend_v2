import { useCallback, useEffect, useRef } from 'react';
import type { ClientMessage, ServerMessage } from '../conference.types';

const wsServerUrl = import.meta.env.VITE_WS_SERVER_URL as string;

type UseConferenceSocketParams = {
  connectMessage: ClientMessage;
  onMessage: (message: ServerMessage) => void;
  onBeforeUnload?: () => ClientMessage | null;
};

export function useConferenceSocket({
  connectMessage,
  onMessage,
  onBeforeUnload,
}: UseConferenceSocketParams) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onBeforeUnloadRef = useRef(onBeforeUnload);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onBeforeUnloadRef.current = onBeforeUnload;
  }, [onBeforeUnload]);

  const sendMessage = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(wsServerUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify(connectMessage));
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as ServerMessage;
        onMessageRef.current(parsed);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    const handleBeforeUnload = () => {
      const message = onBeforeUnloadRef.current?.();
      if (message && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      ws.close();
      wsRef.current = null;
    };
  }, []); 

  return {
    wsRef,
    sendMessage,
  };
}