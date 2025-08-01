import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Thread, Message } from "../types";
import { apiClient } from "../config/api";
import { useUser } from "./UserContext";

/* -------------------------------------------------------------------------- */
/*                                Context API                                 */
/* -------------------------------------------------------------------------- */

interface ChatContextValue {
  threads: Thread[];
  messages: Record<string, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  getOrCreateThread: (
    sellerId: number,
    propertyId: number | null,
    title?: string
  ) => Promise<string>;
  getOrCreateDmThread: (userId: number) => Promise<string>;
  sendMessage: (
    threadId: string,
    recipientId: number,
    content: string,
    propertyId?: number
  ) => void;
  markThreadRead: (threadId: string) => void;
  sendTypingStart: (threadId: string, recipientId: number) => void;
  sendTypingStop: (threadId: string, recipientId: number) => void;
  unsendMessage: (messageId: string) => Promise<void>;
  typingUsers: Record<string, boolean>;
  userStatuses: Record<number, "online" | "offline">;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                              Helper functions                               */
/* -------------------------------------------------------------------------- */

// Very small helper to grab a cookie by name – we avoid the extra logic of fall-backs
const getCookie = (name: string): string | null => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] ?? null
  );
};

/* -------------------------------------------------------------------------- */
/*                             Provider component                              */
/* -------------------------------------------------------------------------- */

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* ------------------------------ Local state ------------------------------ */
  const { user } = useUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [userStatuses, setUserStatuses] = useState<Record<number, "online" | "offline">>({});

  /* ---------------------------- WebSocket setup --------------------------- */
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isReconnectingRef = useRef(false);

  const openSocket = useCallback(() => {
    // Prevent multiple simultaneous reconnection attempts
    if (isReconnectingRef.current) {
      return;
    }

    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    isReconnectingRef.current = true;

    const baseWs =
      (import.meta.env.VITE_API_WS as string | undefined) || window.location.origin.replace(/^http/, "ws");

    const token = getCookie("access_token") ?? getCookie("mobile_access_token");
    const url = token ? `${baseWs}/ws/chat/?token=${encodeURIComponent(token)}` : `${baseWs}/ws/chat/`;

    ws.current = new WebSocket(url);

    // Keep the connection alive
    const pingInterval = window.setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // 30 s

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "chat.message": {
          const msg: Message = data.message;

          // Handle our own messages (to replace optimistic messages)
          if (msg.sender === user?.id) {
            console.log('Processing own message from server:', msg.id);
            
            // Replace any optimistic message with the real one
            setMessages((prev) => {
              const list = prev[msg.thread_id] ?? [];
              const hasOptimistic = list.some((m) => m.id.startsWith('temp_'));
              
              if (hasOptimistic) {
                // Replace optimistic message with real message
                return {
                  ...prev,
                  [msg.thread_id]: list.map((m) => 
                    m.id.startsWith('temp_') ? msg : m
                  ),
                };
              } else {
                // No optimistic message to replace, just add if not already present
                if (list.some((m) => m.id === msg.id)) return prev;
                return {
                  ...prev,
                  [msg.thread_id]: [...list, msg],
                };
              }
            });
            
            // Update thread timestamp but don't increment unread count for own messages
            setThreads((prev) => {
              const updated = prev.map((t) => {
                if (t.id === msg.thread_id) {
                  return {
                    ...t,
                    updated_at: msg.created_at,
                    // Don't increment unread_count for own messages
                  };
                }
                return t;
              });
              return updated.sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              );
            });
            break;
          }

          // Handle messages from other users
          // Deduplicate by message ID
          setMessages((prev) => {
            const list = prev[msg.thread_id] ?? [];
            if (list.some((m) => m.id === msg.id)) return prev;
            return {
              ...prev,
              [msg.thread_id]: [...list, msg],
            };
          });

          // Move thread to top of list and update unread count
          setThreads((prev) => {
            const updated = prev.map((t) => {
              if (t.id === msg.thread_id) {
                // This is a message from another user, increment unread count
                return {
                  ...t,
                  updated_at: msg.created_at,
                  unread_count: (t.unread_count || 0) + 1,
                };
              }
              return t;
            });
            return updated.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });
          break;
        }

        case "message.read": {
          const { thread_id, message_ids, read_at } = data;
          setMessages((prev) => {
            if (!prev[thread_id]) return prev;
            return {
              ...prev,
              [thread_id]: prev[thread_id].map((m) =>
                message_ids.includes(m.id) ? { ...m, read_at } : m
              ),
            };
          });
          break;
        }

        case "typing.indicator": {
          const { thread_id, user_id, is_typing } = data;
          if (user_id !== user?.id) {
            setTypingUsers((prev) => ({ ...prev, [thread_id]: is_typing }));
          }
          break;
        }

        case "user.status": {
          const { user_id, status } = data;
          setUserStatuses((prev) => ({ ...prev, [user_id]: status }));
          break;
        }

        case "message.unsent": {
          const { message_id, thread_id } = data;
          setMessages((prev) => {
            if (!prev[thread_id]) return prev;
            return {
              ...prev,
              [thread_id]: prev[thread_id].map((m) =>
                m.id === message_id ? { ...m, content: "Message Unsent", is_unsent: true } : m
              ),
            };
          });
          break;
        }

        default:
          break;
      }
    };

    ws.current.onerror = (err) => {
      console.warn("WebSocket error", err);
      isReconnectingRef.current = false;
    };

    ws.current.onopen = () => {
      console.log("WebSocket connected successfully");
      isReconnectingRef.current = false;
    };

    ws.current.onclose = () => {
      clearInterval(pingInterval);
      ws.current = null;
      isReconnectingRef.current = false;

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Attempt a simple reconnect after a short delay
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log("Re-opening WebSocket after close…");
        openSocket();
      }, 5000); // Increased delay to 5 seconds to avoid rate limiting
    };
  }, [user?.id]);

  /* ------------------------------ Lifecycle ------------------------------- */
  useEffect(() => {
    apiClient.get<Thread[]>("chat/").then((res) => setThreads(res.data));
    openSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Remove openSocket dependency to prevent infinite re-renders

  /* --------------------------- Helper functions --------------------------- */
  const getOrCreateThread = useCallback(
    async (sellerId: number, propertyId: number | null, title?: string) => {
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
    },
    [threads]
  );

  const getOrCreateDmThread = useCallback(
    async (otherUserId: number) => {
      // Look for existing DM thread (no property)
      const existing = threads.find(
        (t) =>
          !t.property &&
          ((t.user1 === otherUserId && t.user2 === user?.id) ||
            (t.user1 === user?.id && t.user2 === otherUserId))
      );
      if (existing) {
        console.log('Found existing DM thread:', existing.id);
        return existing.id;
      }

      console.log('Creating new DM thread with user:', otherUserId);
      const res = await apiClient.post<Thread>("chat/", {
        recipient_id: otherUserId,
        // Explicitly not passing property_id to ensure it's a DM thread
      });
      console.log('Created DM thread:', res.data);
      setThreads((prev) => [res.data, ...prev]);
      return res.data.id;
    },
    [threads, user?.id]
  );

  const sendMessage = useCallback(
    (
      threadId: string,
      recipientId: number,
      content: string,
      propertyId?: number
    ) => {
      // Ensure the socket is (re)opened
      openSocket();

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID
        thread_id: threadId,
        property_id: propertyId || null,
        sender: user?.id || 0,
        recipient: recipientId,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
        is_unsent: false,
      };

      // Add optimistic message to UI immediately
      setMessages((prev) => {
        const list = prev[threadId] ?? [];
        return {
          ...prev,
          [threadId]: [...list, optimisticMessage],
        };
      });

      // Update thread timestamp (but don't increment unread count for own messages)
      setThreads((prev) => {
        const updated = prev.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              updated_at: optimisticMessage.created_at,
              // Don't increment unread_count for own messages
            };
          }
          return t;
        });
        return updated.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });

      const payload: any = {
        type: "chat.message",
        recipient_id: recipientId,
        content,
      };
      if (propertyId) payload.property_id = propertyId;

      const json = JSON.stringify(payload);

      const sendViaRest = async () => {
        try {
          const response = await apiClient.post<Message>(`chat/${threadId}/messages/`, {
            content,
            property_id: propertyId,
            recipient_id: recipientId,
          });
          
          // Replace optimistic message with real message from server
          setMessages((prev) => {
            const list = prev[threadId] ?? [];
            return {
              ...prev,
              [threadId]: list.map((msg) => 
                msg.id === optimisticMessage.id ? response.data : msg
              ),
            };
          });
        } catch (error) {
          console.error('Failed to send message:', error);
          // Remove optimistic message on error
          setMessages((prev) => {
            const list = prev[threadId] ?? [];
            return {
              ...prev,
              [threadId]: list.filter((msg) => msg.id !== optimisticMessage.id),
            };
          });
        }
      };

      if (!ws.current) {
        // No socket – fallback immediately
        void sendViaRest();
        return;
      }

      switch (ws.current.readyState) {
        case WebSocket.OPEN:
          ws.current.send(json);
          break;
        case WebSocket.CONNECTING:
          ws.current.addEventListener(
            "open",
            () => {
              ws.current?.send(json);
            },
            { once: true }
          );
          break;
        default:
          void sendViaRest();
      }
    },
    [openSocket, user?.id]
  );

  const markThreadRead = useCallback((threadId: string) => {
    setMessages((prev) => {
      if (!prev[threadId]) return prev;
      return {
        ...prev,
        [threadId]: prev[threadId].map((m) =>
          !m.read_at && m.sender !== user?.id ? { ...m, read_at: new Date().toISOString() } : m
        ),
      };
    });
    
    // Update threads state to reflect the new unread count
    setThreads((prev) => {
      return prev.map((thread) => {
        if (thread.id === threadId) {
          // Calculate new unread count based on unread messages
          const threadMessages = messages[threadId] || [];
          const newUnreadCount = threadMessages.filter(
            (msg) => msg.sender !== user?.id && !msg.read_at
          ).length;
          
          return {
            ...thread,
            unread_count: newUnreadCount,
          };
        }
        return thread;
      });
    });
    
    apiClient.post(`chat/${threadId}/mark_read/`).catch(() => {});
  }, [user?.id, messages]);

  const sendTypingStart = useCallback((threadId: string, recipientId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({ type: "typing.start", thread_id: threadId, recipient_id: recipientId })
      );
    }
  }, []);

  const sendTypingStop = useCallback((threadId: string, recipientId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({ type: "typing.stop", thread_id: threadId, recipient_id: recipientId })
      );
    }
  }, []);

  const unsendMessage = useCallback(async (messageId: string) => {
    await apiClient.post(`chat/messages/${messageId}/unsend/`);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "message.unsend", message_id: messageId }));
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                 Provider                                   */
  /* -------------------------------------------------------------------------- */

  const value: ChatContextValue = {
    threads,
    messages,
    setMessages,
    getOrCreateThread,
    getOrCreateDmThread,
    sendMessage,
    markThreadRead,
    sendTypingStart,
    sendTypingStop,
    unsendMessage,
    typingUsers,
    userStatuses,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                   Hook                                      */
/* -------------------------------------------------------------------------- */

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return ctx;
};

