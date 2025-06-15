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
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;
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
      // eslint-disable-next-line no-console
      console.log("WS connecting to", ws.current.url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("WebSocket creation failed", err);
      return;
    }

    ws.current.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.error("WebSocket error", e);
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "chat.message") {
        const msg: Message = data.message;
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
      
      // Handle read receipts
      if (data.type === "message.read") {
        const { thread_id, message_ids, read_at } = data;
        
        // Update messages with read_at timestamp
        setMessages((prev) => {
          if (!prev[thread_id]) return prev;
          
          const updatedMessages = prev[thread_id].map((msg) => 
            message_ids.includes(msg.id) 
              ? { ...msg, read_at } 
              : msg
          );
          
          return {
            ...prev,
            [thread_id]: updatedMessages,
          };
        });
        
        // Update thread unread count (should be 0 for the reader)
        setThreads((prev) => prev.map((t) => 
          t.id === thread_id 
            ? { ...t, unread_count: Math.max(0, t.unread_count - message_ids.length) }
            : t
        ));
      }
    };

    // keepalive
    const ping = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    ws.current.onclose = () => {
      clearInterval(ping);
      // eslint-disable-next-line no-console
      console.warn("WebSocket closed, will retry on next action");
      ws.current = null;
    };
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
    // ensure we have an OPEN or CONNECTING socket
    openSocket();

    const payload = JSON.stringify({
      type: "chat.message",
      recipient_id: recipientId,
      property_id: propertyId,
      content,
    });

    const attemptSend = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // eslint-disable-next-line no-console
        console.log("WS sent", payload);
        ws.current.send(payload);
      }
    };

    if (!ws.current) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      attemptSend();
    } else if (ws.current.readyState === WebSocket.CONNECTING) {
      (ws.current as WebSocket).addEventListener("open", attemptSend, { once: true });
    } else {
      // socket is closed – open a fresh one and send once it opens
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
    
    // Send API request to mark messages as read on server
    apiClient.post(`chat/${threadId}/mark_read/`)
      .then((response) => {
        console.log("Messages marked as read:", response.data);
      })
      .catch((error) => {
        console.error("Failed to mark messages as read:", error);
        // Optionally revert optimistic update on error
      });
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