import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Thread, Message } from "../types";
import { apiClient } from "../config/api";
import { useUser } from "./UserContext";

interface ChatContextValue {
  threads: Thread[];
  messages: Record<string, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  getOrCreateThread: (
    sellerId: number,
    propertyId: number,
    title: string
  ) => Promise<string>;
  getOrCreateDmThread: (userId: number) => Promise<string>;
  sendMessage: (
    threadId: string,
    recipientId: number,
    content: string,
    propertyId?: number
  ) => void;
  unsendMessage: (messageId: string) => Promise<void>;
  markThreadRead: (threadId: string) => void;
  sendTypingStart: (threadId: string, recipientId: number) => void;
  sendTypingStop: (threadId: string, recipientId: number) => void;
  typingUsers: Record<string, boolean>; // threadId -> isOtherUserTyping
  userStatuses: Record<number, 'online' | 'offline'>; // userId -> status
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [userStatuses, setUserStatuses] = useState<Record<number, 'online' | 'offline'>>({});
  const ws = useRef<WebSocket | null>(null);
  const { user } = useUser();
  const markReadTimeouts = useRef<Record<string, number>>({});
  const typingTimeouts = useRef<Record<string, number>>({});



  const openSocket = () => {
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) return;

    const baseWs = (import.meta.env.VITE_API_WS as string | undefined) || window.location.origin.replace(/^http/, "ws");
    const token = document.cookie.split("; ").find((c) => c.startsWith("access_token="))?.split("=")[1];
    const wsUrl = token ? `${baseWs}/ws/chat/?token=${token}` : `${baseWs}/ws/chat/`;

    try {
      ws.current = new WebSocket(wsUrl);
      console.log("WS connecting to", ws.current.url);
    } catch (err) {
      console.error("WebSocket creation failed", err);
      return;
    }

    ws.current.onerror = (e) => console.error("WebSocket error", e);

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "chat.message") {
        const msg: Message = data.message;

        setMessages((prev) => {
          const threadMsgs = prev[msg.thread_id] || [];
          
          // Check if this is a real message replacing an optimistic one
          // Remove any optimistic messages with similar content and sender
          const filteredMsgs = threadMsgs.filter((m) => {
            if (m.id.toString().startsWith('temp_') && 
                m.sender === msg.sender && 
                m.content === msg.content) {
              return false; // Remove optimistic message
            }
            return m.id !== msg.id; // Remove any exact duplicates
          });

          return {
            ...prev,
            [msg.thread_id]: [...filteredMsgs, msg],
          };
        });

        setThreads((prev) => {
          const threadsCopy = prev.map((t) => {
            if (t.id !== msg.thread_id) return t;
            const isIncoming = user ? msg.sender !== user.id : true;
            const isUnread = !msg.read_at;
            const shouldIncrement = isIncoming && isUnread;

            return {
              ...t,
              updated_at: msg.created_at,
              unread_count: t.unread_count + (shouldIncrement ? 1 : 0),
            };
          });

          return threadsCopy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        });
      }

      if (data.type === "message.read") {
        const { thread_id, message_ids, read_at } = data;

        setMessages((prev) => {
          if (!prev[thread_id]) return prev;

          const updatedMessages = prev[thread_id].map((msg) =>
            message_ids.includes(msg.id) ? { ...msg, read_at } : msg
          );

          return {
            ...prev,
            [thread_id]: updatedMessages,
          };
        });

        setThreads((prev) =>
          prev.map((t) =>
            t.id === thread_id
              ? { ...t, unread_count: Math.max(0, t.unread_count - message_ids.length) }
              : t
          )
        );
      }

      if (data.type === "typing.indicator") {
        const { thread_id, user_id, is_typing } = data;
        
        // Only show typing indicator if it's from another user
        if (user && user_id !== user.id) {
          setTypingUsers((prev) => ({
            ...prev,
            [thread_id]: is_typing,
          }));

          // Clear typing indicator after 3 seconds if no stop signal
          if (is_typing) {
            if (typingTimeouts.current[thread_id]) {
              clearTimeout(typingTimeouts.current[thread_id]);
            }
            typingTimeouts.current[thread_id] = window.setTimeout(() => {
              setTypingUsers((prev) => ({
                ...prev,
                [thread_id]: false,
              }));
              delete typingTimeouts.current[thread_id];
            }, 3000);
          } else {
            if (typingTimeouts.current[thread_id]) {
              clearTimeout(typingTimeouts.current[thread_id]);
              delete typingTimeouts.current[thread_id];
            }
          }
        }
      }

      if (data.type === "user.status") {
        const { user_id, status } = data;
        setUserStatuses((prev) => ({
          ...prev,
          [user_id]: status,
        }));
      }

      if (data.type === "message.unsent") {
        const { message_id, thread_id } = data;
        setMessages((prev) => {
          if (!prev[thread_id]) return prev;

          const updatedMessages = prev[thread_id].map((msg) =>
            msg.id === message_id 
              ? { ...msg, content: "Message Unsent", is_unsent: true, unsent_at: new Date().toISOString() } 
              : msg
          );

          return {
            ...prev,
            [thread_id]: updatedMessages,
          };
        });

        // Update thread list to reflect the unsent message
        setThreads((prev) => 
          prev.map((thread) => {
            if (thread.id === thread_id && thread.last_message?.id === message_id) {
              return {
                ...thread,
                last_message: thread.last_message ? {
                  ...thread.last_message,
                  content: "Message Unsent"
                } : null
              };
            }
            return thread;
          })
        );
      }
    };

    const ping = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    ws.current.onclose = () => {
      clearInterval(ping);
      console.warn("WebSocket closed, will retry on next action");
      ws.current = null;
    };
  };

  useEffect(() => {
    apiClient.get<Thread[]>("chat/").then((res) => {
      setThreads(res.data);
    });
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

  const getOrCreateDmThread = async (userId: number) => {
    // Check for existing DM thread
    const existing = threads.find(
      (t) => !t.property && ((t.user1 === userId && t.user2 === user?.id) || (t.user1 === user?.id && t.user2 === userId))
    );
    if (existing) return existing.id;
    
    const res = await apiClient.post<Thread>("chat/", {
      recipient_id: userId,
    });
    setThreads((prev) => [res.data, ...prev]);
    return res.data.id;
  };

  const sendMessage = (
    threadId: string,
    recipientId: number,
    content: string,
    propertyId?: number
  ) => {
    openSocket();

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`, // Temporary ID until server responds
      thread_id: threadId,
      property_id: propertyId || null,
      sender: user?.id || 0,
      recipient: recipientId,
      content: content,
      created_at: new Date().toISOString(),
      read_at: null,
      is_unsent: false,
      unsent_at: null,
    };

    // Add message optimistically to local state
    setMessages((prev) => {
      const threadMsgs = prev[threadId] || [];
      return {
        ...prev,
        [threadId]: [...threadMsgs, optimisticMessage],
      };
    });

    const payload: any = {
      type: "chat.message",
      recipient_id: recipientId,
      content,
    };
    
    // Only add property_id if it exists
    if (propertyId) {
      payload.property_id = propertyId;
    }

    const payloadString = JSON.stringify(payload);

    const attemptSend = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("WS sent", payloadString);
        ws.current.send(payloadString);
      } else {
        console.warn("WebSocket not available, falling back to REST API");
        sendViaRestAPI();
      }
    };

    const sendViaRestAPI = async () => {
      try {
        const response = await apiClient.post<Message>(`chat/${threadId}/messages/`, {
          content: content,
        });
        
        // Replace optimistic message with real message from server
        const realMessage: Message = {
          id: response.data.id,
          thread_id: threadId,
          property_id: propertyId || null,
          sender: user?.id || 0,
          recipient: recipientId,
          content: response.data.content,
          created_at: response.data.created_at,
          read_at: response.data.read_at,
          is_unsent: response.data.is_unsent || false,
          unsent_at: response.data.unsent_at || null,
        };

        setMessages((prev) => {
          const threadMsgs = prev[threadId] || [];
          
          // Remove optimistic message and add real message
          const filteredMsgs = threadMsgs.filter((m) => {
            if (m.id.toString().startsWith('temp_') && 
                m.sender === realMessage.sender && 
                m.content === realMessage.content) {
              return false; // Remove optimistic message
            }
            return true;
          });

          return {
            ...prev,
            [threadId]: [...filteredMsgs, realMessage],
          };
        });

        console.log("Message sent via REST API");
      } catch (error) {
        console.error("Failed to send message via REST API:", error);
        // Mark optimistic message as failed
        setMessages((prev) => {
          const threadMsgs = prev[threadId] || [];
          const updatedMsgs = threadMsgs.map((m) => {
            if (m.id.toString().startsWith('temp_') && 
                m.sender === user?.id && 
                m.content === content) {
              return { ...m, content: `❌ Failed to send: ${content}` };
            }
            return m;
          });

          return {
            ...prev,
            [threadId]: updatedMsgs,
          };
        });
      }
    };

    if (!ws.current) {
      console.warn("No WebSocket available, using REST API");
      sendViaRestAPI();
      return;
    }

    if (ws.current.readyState === WebSocket.OPEN) {
      attemptSend();
    } else if (ws.current.readyState === WebSocket.CONNECTING) {
      (ws.current as WebSocket).addEventListener("open", attemptSend, { once: true });
    } else {
      ws.current = null;
      openSocket();
      if (ws.current) {
        (ws.current as WebSocket).addEventListener("open", attemptSend, { once: true });
      } else {
        // If WebSocket creation failed, fallback to REST API
        sendViaRestAPI();
      }
    }

    // Update thread timestamp optimistically
    setThreads((prev) => {
      const threadsCopy = prev.map((t) =>
        t.id === threadId ? { ...t, updated_at: new Date().toISOString() } : t
      );
      return threadsCopy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    });
  };

  const markThreadRead = useCallback((threadId: string) => {
    if (markReadTimeouts.current[threadId]) {
      clearTimeout(markReadTimeouts.current[threadId]);
    }

    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t))
    );

    setMessages((prev) => {
      if (!prev[threadId]) return prev;

      const updatedMessages = prev[threadId].map((msg) => {
        if (!msg.read_at && msg.sender !== user?.id) {
          return { ...msg, read_at: new Date().toISOString() };
        }
        return msg;
      });

      return {
        ...prev,
        [threadId]: updatedMessages,
      };
    });

    markReadTimeouts.current[threadId] = window.setTimeout(() => {
      apiClient
        .post(`chat/${threadId}/mark_read/`)
        .then((response) => {
          console.log("Messages marked as read:", response.data);
          delete markReadTimeouts.current[threadId];
        })
        .catch((error) => {
          console.error("Failed to mark messages as read:", error);
          delete markReadTimeouts.current[threadId];
        });
    }, 500);
  }, []);

  const sendTypingStart = useCallback((threadId: string, recipientId: number) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "typing.start",
        thread_id: threadId,
        recipient_id: recipientId,
      }));
    }
  }, []);

  const sendTypingStop = useCallback((threadId: string, recipientId: number) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "typing.stop",
        thread_id: threadId,
        recipient_id: recipientId,
      }));
    }
  }, []);

  const unsendMessage = useCallback(async (messageId: string) => {
    try {
      // Call the API to unsend the message
      await apiClient.post(`chat/messages/${messageId}/unsend/`);
      
      // Also send via WebSocket for real-time updates
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: "message.unsend",
          message_id: messageId,
        }));
      }
    } catch (error) {
      console.error("Failed to unsend message:", error);
      throw error;
    }
  }, []);

  return (
    <ChatContext.Provider value={{ 
      threads, 
      messages, 
      getOrCreateThread, 
      getOrCreateDmThread,
      sendMessage, 
      unsendMessage,
      markThreadRead, 
      setMessages,
      sendTypingStart,
      sendTypingStop,
      typingUsers,
      userStatuses
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be within ChatProvider");
  return ctx;
};
