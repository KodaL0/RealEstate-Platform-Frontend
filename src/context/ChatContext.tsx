import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Thread, Message } from "../types";
import { apiClient } from "../config/api";
import { useUser } from "./UserContext";

interface ChatContextValue {
  threads: Thread[];
  messages: Record<string, Message[]>; // keyed by threadId
  getOrCreateThread: (
    sellerId: number,
    propertyId: number,
    title: string
  ) => Promise<string>; // returns threadId
  sendMessage: (
    threadId: string,
    recipientId: number,
    propertyId: number,
    content: string
  ) => void;
  markThreadRead: (threadId: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const { user } = useUser();

  // helper to lazy-open websocket
  const openSocket = (isReconnect = false) => {
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionStatus('connecting');
    console.log(`${isReconnect ? 'Reconnecting' : 'Connecting'} to WebSocket...`);
    
    const baseWs =
      (import.meta.env.VITE_API_WS as string | undefined) ||
      window.location.origin.replace(/^http/, "ws");

    // grab JWT from cookie
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("access_token="))
      ?.split("=")[1];

    const wsUrl = token ? `${baseWs}/ws/chat/?token=${token}` : `${baseWs}/ws/chat/`;

    try {
      ws.current = new WebSocket(wsUrl);
      console.log("WebSocket connecting to:", ws.current.url);
    } catch (err) {
      console.error("WebSocket creation failed:", err);
      setConnectionStatus('error');
      scheduleReconnect();
      return;
    }

    ws.current.onopen = () => {
      console.log("WebSocket connected successfully");
      setConnectionStatus('connected');
      setRetryCount(0);
      
      // Start keepalive ping
      startPingInterval();
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket error:", e);
      setConnectionStatus('error');
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("WebSocket received:", data);
        
        if (data.type === "pong") {
          console.log("Received pong from server");
          return;
        }
        
        if (data.type === "chat.message") {
          const msg: Message = data.message;
          console.log("Processing chat message:", msg);
          
          setMessages((prev) => ({
            ...prev,
            [msg.thread_id]: [...(prev[msg.thread_id] || []), msg],
          }));

          // update thread metadata (unread count + updated_at)
          setThreads((prev) => {
            // find thread; if not present, ignore (will refetch later)
            const threadsCopy = prev.map((t) => {
              if (t.id !== msg.thread_id) return t;
              // Only increment unread count for incoming messages that are unread
              const isIncoming = user ? msg.sender !== user.id : true;
              const isUnread = !msg.read_at;
              const shouldIncrement = isIncoming && isUnread;
              
              return {
                ...t,
                updated_at: msg.created_at,
                unread_count: t.unread_count + (shouldIncrement ? 1 : 0),
              };
            });
            // sort newest first
            return threadsCopy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error, e.data);
      }
    };

    ws.current.onclose = (event) => {
      console.warn("WebSocket closed:", event.code, event.reason);
      setConnectionStatus('disconnected');
      stopPingInterval();
      ws.current = null;
      
      // Don't reconnect if it was a clean close (code 1000) or authentication error (code 1008)
      if (event.code !== 1000 && event.code !== 1008) {
        scheduleReconnect();
      }
    };
  };

  const startPingInterval = () => {
    stopPingInterval();
    pingIntervalRef.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        console.log("Sending ping to server");
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  };

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return; // Already scheduled
    
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${retryCount + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setRetryCount(prev => prev + 1);
      openSocket(true);
    }, delay);
  };

  // initial fetch threads
  useEffect(() => {
    apiClient.get<Thread[]>("chat/").then((res) => setThreads(res.data));
    openSocket();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopPingInterval();
      if (ws.current) {
        ws.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  const getOrCreateThread = async (
    sellerId: number,
    propertyId: number,
    title: string
  ) => {
    const existing = threads.find(
      (t) => t.property === propertyId && (t.user1 === sellerId || t.user2 === sellerId)
    );
    if (existing) return existing.id;
    const res = await apiClient.post<Thread>("chat/", {
      recipient_id: sellerId,
      property_id: propertyId,
      title,
    });
    setThreads((prev) => [res.data, ...prev]);
    return res.data.id;
  };

  const sendMessage = (
    threadId: string,
    recipientId: number,
    propertyId: number,
    content: string
  ) => {
    // ensure we have an OPEN or CONNECTING socket
    openSocket();

    const payload = JSON.stringify({
      type: "chat.message",
      thread_id: threadId,
      recipient_id: recipientId,
      property_id: propertyId,
      content,
    });

    const attemptSend = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("Sending message via WebSocket:", payload);
        ws.current.send(payload);
      } else {
        console.warn("WebSocket not ready for sending, state:", ws.current?.readyState);
      }
    };

    if (!ws.current) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      attemptSend();
    } else if (ws.current.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket connecting, queuing message...");
      (ws.current as WebSocket).addEventListener("open", attemptSend, { once: true });
    } else {
      // socket is closed – open a fresh one and send once it opens
      console.log("WebSocket closed, reopening and queuing message...");
      ws.current = null;
      openSocket();
      if (ws.current) {
        (ws.current as WebSocket).addEventListener("open", attemptSend, { once: true });
      }
    }

    // optimistic local update
    const newMsg: Message = {
      id: `temp-${Date.now()}`,
      thread_id: threadId,
      property_id: propertyId,
      sender: user?.id || 0,
      recipient: recipientId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    } as Message;

    console.log("Adding optimistic message:", newMsg);
    setMessages((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg],
    }));

    // optimistically bump the thread row
    setThreads((prev) => {
      const threadsCopy = prev.map((t) =>
        t.id === threadId ? { ...t, updated_at: newMsg.created_at } : t
      );
      return threadsCopy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    });
  };

  const markThreadRead = (threadId: string) => {
    // Mark thread as read and update message read_at timestamps
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t)));
    
    // Mark all messages in this thread as read
    setMessages((prev) => {
      if (!prev[threadId]) return prev;
      
      const updatedMessages = prev[threadId].map((msg) => ({
        ...msg,
        read_at: msg.read_at || new Date().toISOString(),
      }));
      
      return {
        ...prev,
        [threadId]: updatedMessages,
      };
    });
    
    // TODO: Send API request to mark messages as read on server
    // apiClient.post(`chat/${threadId}/mark-read/`);
  };

  return (
    <ChatContext.Provider value={{ threads, messages, getOrCreateThread, sendMessage, markThreadRead, connectionStatus }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be within ChatProvider");
  return ctx;
};