import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Thread, Message } from "../types";
import { apiClient } from "../config/api";
import { useUser } from "../context/UserContext";

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
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const ws = useRef<WebSocket | null>(null);

  const { user } = useUser();

  // helper to lazy-open websocket
  const openSocket = () => {
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return; // already have a live or connecting socket
    }
    const baseWs =
      (import.meta.env.VITE_API_WS as string | undefined) ||
      window.location.origin.replace(/^http/, "ws");

    try {
      ws.current = new WebSocket(`${baseWs}/ws/chat/`);
      // eslint-disable-next-line no-console
      console.log("WS connecting to", ws.current.url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("WebSocket creation failed", err);
      return;
    }

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "chat.message") {
        const msg: Message = data.message;
        setMessages((prev) => ({
          ...prev,
          [msg.thread_id]: [msg, ...(prev[msg.thread_id] || [])],
        }));

        // update thread metadata (unread count + updated_at)
        setThreads((prev) => {
          // find thread; if not present, ignore (will refetch later)
          const threadsCopy = prev.map((t) => {
            if (t.id !== msg.thread_id) return t;
            const isIncoming = msg.sender !== user?.id;
            return {
              ...t,
              updated_at: msg.created_at,
              unread_count: t.unread_count + (isIncoming ? 1 : 0),
            };
          });
          // sort newest first
          return threadsCopy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        });
      }
    };

    // keepalive
    const ping = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    ws.current.onclose = () => clearInterval(ping);
  };

  // initial fetch threads
  useEffect(() => {
    apiClient.get<Thread[]>("chat/").then((res) => setThreads(res.data));
    openSocket();
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
    openSocket();

    const payload = JSON.stringify({
      type: "chat.message",
      recipient_id: recipientId,
      property_id: propertyId,
      content,
    });

    if (!ws.current) return;

    const sendNow = () => ws.current?.send(payload);

    if (ws.current.readyState === WebSocket.OPEN) {
      sendNow();
    } else {
      ws.current.addEventListener("open", sendNow, { once: true });
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

    setMessages((prev) => ({
      ...prev,
      [threadId]: [newMsg, ...(prev[threadId] || [])],
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
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t)));
  };

  return (
    <ChatContext.Provider value={{ threads, messages, getOrCreateThread, sendMessage, markThreadRead }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be within ChatProvider");
  return ctx;
}; 