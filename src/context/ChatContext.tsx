import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Thread, Message } from "../types";
import { apiClient } from "../config/api";

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
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const ws = useRef<WebSocket | null>(null);

  // helper to lazy-open websocket
  const openSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
    const token = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("access_token="))
      ?.split("=")[1];
    if (!token) return;
    const baseWs =
      (import.meta.env.VITE_API_WS as string | undefined) ||
      window.location.origin.replace(/^http/, "ws");

    try {
      ws.current = new WebSocket(`${baseWs}/ws/chat/?token=${token}`);
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
      sender: Number(document.cookie.split('; ').find(c=>c.startsWith('user_id='))?.split('=')[1] || 0),
      recipient: recipientId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    } as Message;

    setMessages((prev) => ({
      ...prev,
      [threadId]: [newMsg, ...(prev[threadId] || [])],
    }));
  };

  return (
    <ChatContext.Provider value={{ threads, messages, getOrCreateThread, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be within ChatProvider");
  return ctx;
}; 