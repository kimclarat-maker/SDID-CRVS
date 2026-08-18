import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveEnrollMessage } from "../types/enroll";

export function useEnrollWS() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastMsg, setLastMsg] = useState<LiveEnrollMessage | null>(null);

  // Track last init message + path for reconnect
  const lastInitMsg = useRef<any>(null);
  const lastPath = useRef<string>("");

  // Reconnect state
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<any>(null);

  // const API = cfg.VITE_API_URL ?? "http://localhost:11401";
  const API = "https://localhost:11401";
  const API_KEY =
    "723259e0dee63366e057c8b9ee6369e7062d832c9c4bbf87452cf2fbb4120a83";
  // cfg.VITE_API_KEY ?? localStorage.getItem("apiKey") ?? "";

  const cleanupReconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    setReconnecting(false);
  };

  const scheduleReconnect = useCallback(() => {
    if (!lastPath.current || !lastInitMsg.current) {
      console.warn("[WS] No init message or path, skipping reconnect");
      return;
    }

    reconnectAttempts.current += 1;
    const delay = Math.min(5000, 500 * reconnectAttempts.current); // exponential backoff capped at 5s

    console.info(`[WS] Attempting reconnect in ${delay}ms`);
    setReconnecting(true);

    cleanupReconnect();
    reconnectTimeout.current = setTimeout(() => {
      connect(lastPath.current, lastInitMsg.current);
    }, delay);
  }, []);

  /**
   * Establishes WebSocket connection and sends init message
   */
  const connect = useCallback(
    (path: string, initMsg: unknown) => {
      if (!API_KEY) {
        console.error("[WS] Missing API key");
        return;
      }

      lastPath.current = path;
      lastInitMsg.current = initMsg;

      if (wsRef.current) {
        console.warn("[WS] Already connected, closing existing socket first");
        wsRef.current.close(1000, "Reconnecting");
        wsRef.current = null;
      }

      const url = `${API.replace(
        "http",
        "ws"
      )}${path}?apiKey=${encodeURIComponent(API_KEY)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.info("[WS] Connection opened");
        setConnected(true);
        reconnectAttempts.current = 0; // reset attempts on success
        cleanupReconnect();

        try {
          ws.send(JSON.stringify(initMsg));
          console.debug("[WS] Sent init message:", initMsg);
        } catch (err) {
          console.error("[WS] Failed to send init message:", err);
        }
      };

      ws.onmessage = (evt) => {
        try {
          const msg: LiveEnrollMessage = JSON.parse(evt.data);
          setLastMsg(msg);
          console.debug("[WS] Received message:", msg.type);
        } catch (err) {
          console.warn("[WS] Invalid message received:", evt.data, err);
        }
      };

      ws.onclose = (evt) => {
        if (evt.wasClean) {
          console.info(
            `[WS] Connection closed cleanly (code=${evt.code}, reason=${
              evt.reason || "none"
            })`
          );
        } else {
          console.warn(
            `[WS] Connection dropped (code=${evt.code}, reason=${
              evt.reason || "none"
            })`
          );
          scheduleReconnect();
        }
        setConnected(false);
        wsRef.current = null;
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
        ws.close();
      };
    },
    [API, API_KEY, scheduleReconnect]
  );

  /**
   * Gracefully disconnect WebSocket with custom stop message + close handshake
   */
  const disconnect = useCallback(() => {
    cleanupReconnect();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        console.info("[WS] Sending custom stop request before closing");
        ws.send(JSON.stringify({ type: "stop" }));
      } catch (err) {
        console.warn("[WS] Failed to send stop message:", err);
      }
      ws.close(1000, "Client requested disconnect");
    } else {
      console.info("[WS] Disconnect skipped — socket not open");
    }

    wsRef.current = null;
    setConnected(false);
  }, []);

  /**
   * Cleanup connection automatically on unmount
   */
  useEffect(() => {
    return () => {
      cleanupReconnect();

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.info("[WS] Cleaning up connection on unmount");
        try {
          ws.send(JSON.stringify({ type: "stop" }));
        } catch {
          /* ignore */
        }
        ws.close(1000, "Component unmounted");
      }
      wsRef.current = null;
    };
  }, []);

  /**
   * Force capture current frame
   */
  const forceCapture = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        console.info("[WS] Sending force capture request");
        ws.send(JSON.stringify({ type: "forceCapture" }));
      } catch (err) {
        console.error("[WS] Failed to send force capture:", err);
      }
    } else {
      console.warn("[WS] Cannot force capture - socket not open");
    }
  }, []);

  return {
    connected,
    reconnecting,
    lastMsg,
    connect,
    disconnect,
    forceCapture,
  };
}
