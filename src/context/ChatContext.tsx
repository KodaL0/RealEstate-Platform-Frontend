import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiClient } from "../config/api";
import type { Message, Thread } from "../types";
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
    title?: string,
    projectId?: number | null,
    organizationId?: number | null,
  ) => Promise<string>;
  getOrCreateDmThread: (userId: number) => Promise<string>;
  sendMessage: (
    threadId: string,
    recipientId: number,
    content: string,
    propertyId?: number,
    projectId?: number,
    organizationId?: number,
  ) => void;
  markThreadRead: (threadId: string) => void;
  sendTypingStart: (threadId: string, recipientId: number) => void;
  sendTypingStop: (threadId: string, recipientId: number) => void;
  unsendMessage: (messageId: string) => Promise<void>;
  typingUsers: Record<string, boolean>;
  userStatuses: Record<number, "online" | "offline">;
  recalculateUnreadCounts: () => void;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
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

  // In-flight thread creation guard to prevent duplicates
  const inFlightThreadCreation = useRef<Set<string>>(new Set());

  // Exponential backoff for reconnection
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 20000; // 20 seconds max

  // Typing debounce timers
  const typingTimers = useRef<Record<string, number>>({});

  // Debug user context
  // console.log('=== CHAT PROVIDER USER CONTEXT ===');
  // console.log('User:', user);
  // console.log('User ID:', user?.id);
  // console.log('User type:', typeof user?.id);

  // Track user context changes
  useEffect(() => {
    // console.log('=== USER CONTEXT CHANGED ===');
    // console.log('New user:', user);
    // console.log('New user ID:', user?.id);
    // console.log('New user type:', typeof user?.id);
  }, []);

  // Track message count changes for debugging
  useEffect(() => {
    // console.log('=== MESSAGE COUNT CHANGED ===');
    // Object.entries(messages).forEach(([threadId, messageList]) => {
    //   console.log(`Thread ${threadId}: ${messageList.length} messages`);
    //   // Log the last few messages to see if there are duplicates
    //   const lastMessages = messageList.slice(-3);
    //   console.log('Last 3 messages:', lastMessages.map(m => ({ id: m.id, content: m.content, isOptimistic: m.id.startsWith('temp_') })));
    // });
  }, []);

  /* ---------------------------- WebSocket setup --------------------------- */
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isReconnectingRef = useRef(false);
  const currentUserIdRef = useRef<number | null>(null);
  // Connection status tracking - exposed in context for UI feedback
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");

  // Ping interval ref for cleanup
  const pingIntervalRef = useRef<number | null>(null);

  // Update current user ID ref when user changes
  useEffect(() => {
    currentUserIdRef.current = user?.id || null;
    // console.log('=== UPDATED CURRENT USER ID REF ===');
    // console.log('New current user ID:', currentUserIdRef.current);
  }, [user?.id]);

  const openSocket = useCallback(async () => {
    // Don't attempt connection if user is not logged in
    if (!user?.id) {
      // console.log('=== WEBSOCKET CONNECTION SKIPPED - NO USER ===');
      return;
    }

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

    // Check for valid token before attempting connection
    let token = getCookie("access_token") ?? getCookie("mobile_access_token");

    // If no access token but we have a refresh token, attempt to refresh first
    if (!token) {
      const refreshToken = getCookie("refresh_token");
      if (refreshToken) {
        // console.log('=== NO ACCESS TOKEN, ATTEMPTING REFRESH ===');
        try {
          const response = await fetch("/api/users/refresh/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (response.ok) {
            // console.log("Token refreshed successfully before WebSocket connection");
            // Retry getting the token after refresh
            token = getCookie("access_token") ?? getCookie("mobile_access_token");
          } else {
            // console.log("Token refresh failed, cannot connect to WebSocket");
            return;
          }
        } catch (_error) {
          // console.warn("Token refresh failed:", error);
          return;
        }
      } else {
        // console.log('=== WEBSOCKET CONNECTION SKIPPED - NO TOKEN AND NO REFRESH TOKEN ===');
        return;
      }
    }

    // Final check - if still no token, don't connect
    if (!token) {
      // console.log('=== WEBSOCKET CONNECTION SKIPPED - NO TOKEN AFTER REFRESH ATTEMPT ===');
      return;
    }

    isReconnectingRef.current = true;
    setConnectionStatus("connecting");

    const baseWs =
      (import.meta.env.VITE_API_WS as string | undefined) ||
      window.location.origin.replace(/^http/, "ws");

    const url = `${baseWs}/ws/chat/?token=${encodeURIComponent(token)}`;

    // Note: Never log the WebSocket URL as it contains the JWT token
    // console.log(`Attempting WebSocket connection`);

    ws.current = new WebSocket(url);

    // Keep the connection alive
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = window.setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // 30 s

    ws.current.onmessage = (event) => {
      // console.log('=== WEBSOCKET MESSAGE RECEIVED ===');
      // console.log('Raw event data:', event.data);

      const data = JSON.parse(event.data);
      // console.log('Parsed data:', data);
      // console.log('Message type:', data.type);

      switch (data.type) {
        case "chat.message": {
          const msg: Message = data.message;

          // console.log('=== PROCESSING CHAT MESSAGE ===');
          // console.log('Message sender ID:', msg.sender, 'Type:', typeof msg.sender);
          // console.log('Current user ID (context):', user?.id, 'Type:', typeof user?.id);
          // console.log('Current user ID (ref):', currentUserIdRef.current, 'Type:', typeof currentUserIdRef.current);
          // console.log('Sender comparison (context):', msg.sender === user?.id);
          // console.log('Sender comparison (ref):', msg.sender === currentUserIdRef.current);
          // console.log('Messages in thread BEFORE processing:', messages[msg.thread_id]?.length || 0);

          // Handle our own messages (to replace optimistic messages)
          // Use the ref for reliable user ID comparison
          const isOwnMessage = msg.sender === currentUserIdRef.current;

          // console.log('Is own message:', isOwnMessage);

          if (isOwnMessage) {
            // console.log('=== PROCESSING OWN MESSAGE FROM SERVER ===');
            // console.log('Message ID:', msg.id);
            // console.log('Thread ID:', msg.thread_id);
            // console.log('Content:', msg.content);

            // Replace any optimistic message with the real one
            setMessages((prev) => {
              const list = prev[msg.thread_id] ?? [];
              // console.log('Current messages in thread:', list.map(m => ({ id: m.id, content: m.content })));

              // Check if we already have this exact message (prevent duplicates)
              if (list.some((m) => m.id === msg.id)) {
                // console.log('❌ Message already exists, skipping duplicate');
                return prev;
              }

              // Also check for content duplicates to prevent double rendering
              const contentDuplicates = list.filter(
                (m) => m.content === msg.content && m.sender === msg.sender,
              );
              if (contentDuplicates.length > 0) {
                // console.log('❌ Content duplicate found, skipping:', contentDuplicates.map(m => ({ id: m.id, content: m.content })));
                return prev;
              }

              // Find and replace optimistic message, or add new message
              const optimisticMessages = list.filter((m) => m.id.startsWith("temp_"));
              const hasOptimistic = optimisticMessages.length > 0;

              // console.log('Optimistic messages found:', optimisticMessages.length);
              // console.log('Optimistic message IDs:', optimisticMessages.map(m => m.id));

              if (hasOptimistic) {
                // console.log('✅ Replacing optimistic message with real message');
                // Replace only the optimistic message that matches the content
                const newList = list
                  .map((m) => {
                    if (m.id.startsWith("temp_") && m.content === msg.content) {
                      // console.log(`Replacing optimistic message ${m.id} with real message ${msg.id}`);
                      return msg;
                    }
                    return m;
                  })
                  // Sort messages by created_at to prevent out-of-order rendering
                  .sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                  );

                // console.log('New message list:', newList.map(m => ({ id: m.id, content: m.content })));
                return {
                  ...prev,
                  [msg.thread_id]: newList,
                };
              } else {
                // console.log('⚠️ Adding new message (no optimistic message to replace)');
                // No optimistic message to replace, just add the new message
                const newList = [...list, msg]
                  // Sort messages by created_at to prevent out-of-order rendering
                  .sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                  );

                // console.log('New message list:', newList.map(m => ({ id: m.id, content: m.content })));
                return {
                  ...prev,
                  [msg.thread_id]: newList,
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
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
              );
            });
            return; // Exit early - don't process as "other user" message
          }

          // Handle messages from other users
          // console.log('=== PROCESSING MESSAGE FROM OTHER USER ===');
          // console.log('Message is from another user, processing normally');

          // Deduplicate by message ID
          setMessages((prev) => {
            const list = prev[msg.thread_id] ?? [];
            if (list.some((m) => m.id === msg.id)) return prev;

            // Add new message and sort by created_at
            const newList = [...list, msg].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );

            return {
              ...prev,
              [msg.thread_id]: newList,
            };
          });

          // Move thread to top of list and update unread count
          setThreads((prev) => {
            const updated = prev.map((t) => {
              if (t.id === msg.thread_id) {
                return {
                  ...t,
                  updated_at: msg.created_at,
                  unread_count: (t.unread_count || 0) + 1,
                };
              }
              return t;
            });
            return updated.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
            );
          });
          break;
        }

        case "message.read": {
          const { thread_id, message_ids, read_at } = data;

          // Update messages
          setMessages((prev) => {
            if (!prev[thread_id]) return prev;
            return {
              ...prev,
              [thread_id]: prev[thread_id].map((m) =>
                message_ids.includes(m.id) ? { ...m, read_at } : m,
              ),
            };
          });

          // 🔥 FIX: also reset unread count on the thread
          setThreads((prev) =>
            prev.map((t) =>
              t.id === thread_id
                ? {
                    ...t,
                    unread_count: 0,
                  }
                : t
            )
          );

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
                m.id === message_id ? { ...m, content: "Message Unsent", is_unsent: true } : m,
              ),
            };
          });
          break;
        }

        default:
          break;
      }
    };

    ws.current.onerror = () => {
      // console.log('=== WEBSOCKET ERROR ===');
      // console.warn("WebSocket error");
      isReconnectingRef.current = false;
      setConnectionStatus("error");

      // Clear ping interval on error
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    ws.current.onopen = () => {
      // console.log('=== WEBSOCKET CONNECTED ===');
      // console.log("WebSocket connected successfully");
      isReconnectingRef.current = false;
      setConnectionStatus("connected");

      // Reset reconnect attempts on successful connection
      reconnectAttempts.current = 0;
    };

    ws.current.onclose = async (event) => {
      // console.log('=== WEBSOCKET CLOSED ===');
      // console.log('Close event:', event);
      // console.log('Close code:', event.code);
      // console.log('Close reason:', event.reason);

      // Clear ping interval on close
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      ws.current = null;
      isReconnectingRef.current = false;
      setConnectionStatus("disconnected");

      // Check if this might be a token expiration issue
      if (event.code === 4001 || event.code === 1008) {
        // console.log("WebSocket closed due to authentication issue, attempting token refresh...");

        // Don't attempt token refresh if user is not logged in
        if (!currentUserIdRef.current) {
          // console.log("User not logged in, skipping reconnection");
          return;
        }

        try {
          // Attempt to refresh the token
          const refreshToken = getCookie("refresh_token");
          if (refreshToken) {
            const response = await fetch("/api/users/refresh/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
              await response.json(); // Tokens are set as cookies by the backend
              // console.log("Token refreshed successfully, reconnecting...");

              // Clear any existing reconnect timeout
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
              }

              // Reconnect immediately with new token
              reconnectTimeoutRef.current = window.setTimeout(() => {
                // console.log("Reconnecting with refreshed token...");
                openSocket();
              }, 1000);
              return;
            } else {
              // Token refresh failed, don't attempt reconnection
              // console.log("Token refresh failed, not attempting reconnection");
              return;
            }
          } else {
            // No refresh token available, don't attempt reconnection
            // console.log("No refresh token available, not attempting reconnection");
            return;
          }
        } catch (_error) {
          // console.warn("Token refresh failed:", error);
          // Don't attempt reconnection after failed refresh
          return;
        }
      }

      // For non-authentication related disconnections, only reconnect if user is still logged in
      if (!currentUserIdRef.current) {
        // console.log("User not logged in, skipping reconnection");
        return;
      }

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Exponential backoff reconnection: 1s, 2s, 4s, 8s, 16s, 20s (max)
      reconnectAttempts.current += 1;
      const baseDelay = 1000; // 1 second
      const exponentialDelay = Math.min(
        baseDelay * 2 ** (reconnectAttempts.current - 1),
        maxReconnectDelay,
      );

      // console.log(`Reconnecting in ${exponentialDelay / 1000}s (attempt ${reconnectAttempts.current})`);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        // Double-check user is still logged in before reconnecting
        if (currentUserIdRef.current) {
          // console.log("Re-opening WebSocket after close…");
          openSocket();
        }
      }, exponentialDelay);
    };
  }, [user?.id, user]);

  /* ------------------------------ Lifecycle ------------------------------- */
  useEffect(() => {
    // Only connect WebSocket and fetch threads if user is logged in
    if (user?.id) {
      apiClient.get<Thread[]>("chat/").then((res) => setThreads(res.data));
      openSocket();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user?.id, openSocket]); // Connect when user logs in, disconnect when user logs out

  /* --------------------------- Helper functions --------------------------- */
  const getOrCreateThread = useCallback(
    async (
      sellerId: number,
      propertyId: number | null,
      title?: string,
      projectId?: number | null,
      organizationId?: number | null,
    ) => {
      // Find existing thread based on context
      const existing = threads.find((t) => {
        const sameParticipants = t.user1 === sellerId || t.user2 === sellerId;
        if (propertyId) return t.property === propertyId && sameParticipants;
        if (projectId) return t.project === projectId && sameParticipants;
        if (organizationId) return t.organization === organizationId && sameParticipants;
        // DM thread (no context)
        return !t.property && !t.project && !t.organization && sameParticipants;
      });
      if (existing) return existing.id;

      // Create a unique key for this thread creation request
      const requestKey = `${sellerId}-${propertyId || "null"}-${projectId || "null"}-${organizationId || "null"}`;

      // Check if we're already creating this thread
      if (inFlightThreadCreation.current.has(requestKey)) {
        // Wait a bit and retry to get the thread once it's created
        await new Promise((resolve) => setTimeout(resolve, 100));
        const retryExisting = threads.find((t) => {
          const sameParticipants = t.user1 === sellerId || t.user2 === sellerId;
          if (propertyId) return t.property === propertyId && sameParticipants;
          if (projectId) return t.project === projectId && sameParticipants;
          if (organizationId) return t.organization === organizationId && sameParticipants;
          return !t.property && !t.project && !t.organization && sameParticipants;
        });
        if (retryExisting) return retryExisting.id;
      }

      // Mark this thread creation as in-flight
      inFlightThreadCreation.current.add(requestKey);

      try {
        const payload: {
          recipient_id: number;
          title: string;
          property_id?: number;
          project_id?: number;
          organization_id?: number;
        } = {
          recipient_id: sellerId,
          title: title || "New Conversation",
        };
        // Only include non-null IDs
        if (propertyId) payload.property_id = propertyId;
        if (projectId) payload.project_id = projectId;
        if (organizationId) payload.organization_id = organizationId;

        const res = await apiClient.post<Thread>("chat/", payload);
        setThreads((prev) => [res.data, ...prev]);
        return res.data.id;
      } finally {
        // Remove from in-flight set once done
        inFlightThreadCreation.current.delete(requestKey);
      }
    },
    [threads],
  );

  const getOrCreateDmThread = useCallback(
    async (otherUserId: number) => {
      // Look for existing DM thread (no property)
      const existing = threads.find(
        (t) =>
          !t.property &&
          ((t.user1 === otherUserId && t.user2 === user?.id) ||
            (t.user1 === user?.id && t.user2 === otherUserId)),
      );
      if (existing) {
        // console.log('Found existing DM thread:', existing.id);
        return existing.id;
      }

      // Create a unique key for DM thread (use 'dm' prefix to distinguish from property threads)
      const requestKey = `dm-${otherUserId}`;

      // Check if we're already creating this DM thread
      if (inFlightThreadCreation.current.has(requestKey)) {
        // Wait a bit and retry to get the thread once it's created
        await new Promise((resolve) => setTimeout(resolve, 100));
        const retryExisting = threads.find(
          (t) =>
            !t.property &&
            ((t.user1 === otherUserId && t.user2 === user?.id) ||
              (t.user1 === user?.id && t.user2 === otherUserId)),
        );
        if (retryExisting) return retryExisting.id;
      }

      // Mark this DM thread creation as in-flight
      inFlightThreadCreation.current.add(requestKey);

      try {
        // console.log('Creating new DM thread with user:', otherUserId);
        const res = await apiClient.post<Thread>("chat/", {
          recipient_id: otherUserId,
          // Explicitly not passing property_id to ensure it's a DM thread
        });
        // console.log('Created DM thread:', res.data);
        setThreads((prev) => [res.data, ...prev]);
        return res.data.id;
      } finally {
        // Remove from in-flight set once done
        inFlightThreadCreation.current.delete(requestKey);
      }
    },
    [threads, user?.id],
  );

  const sendMessage = useCallback(
    (threadId: string, recipientId: number, content: string, propertyId?: number) => {
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
        unsent_at: null,
      };

      // console.log('=== CREATING OPTIMISTIC MESSAGE ===');
      // console.log('Optimistic message ID:', optimisticMessage.id);
      // console.log('Thread ID:', threadId);
      // console.log('Content:', content);

      // Add optimistic message to UI immediately
      setMessages((prev) => {
        const list = prev[threadId] ?? [];
        // console.log('Adding optimistic message to thread. Current messages:', list.map(m => ({ id: m.id, content: m.content })));
        const newList = [...list, optimisticMessage];
        // console.log('New message list with optimistic:', newList.map(m => ({ id: m.id, content: m.content })));
        return {
          ...prev,
          [threadId]: newList,
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
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
      });

      const payload: {
        type: "chat.message";
        recipient_id: number;
        content: string;
        property_id?: number;
      } = {
        type: "chat.message",
        recipient_id: recipientId,
        content,
      };
      if (propertyId) payload.property_id = propertyId;

      const json = JSON.stringify(payload);

      const sendViaRest = async () => {
        // console.log('=== SENDING VIA REST API ===');
        // console.log('Thread ID:', threadId);
        // console.log('Content:', content);
        try {
          const response = await apiClient.post<Message>(`chat/${threadId}/messages/`, {
            content,
            property_id: propertyId,
            recipient_id: recipientId,
          });

          // console.log('✅ REST API success. Response:', response.data);

          // Replace optimistic message with real message from server
          setMessages((prev) => {
            const list = prev[threadId] ?? [];
            // console.log('Replacing optimistic message via REST. Current messages:', list.map(m => ({ id: m.id, content: m.content })));
            const newList = list.map((msg) =>
              msg.id === optimisticMessage.id ? response.data : msg,
            );
            // console.log('New message list after REST replacement:', newList.map(m => ({ id: m.id, content: m.content })));
            return {
              ...prev,
              [threadId]: newList,
            };
          });
        } catch (_error) {
          // console.error('❌ REST API failed:', error);
          // Remove optimistic message on error
          setMessages((prev) => {
            const list = prev[threadId] ?? [];
            // console.log('Removing optimistic message due to REST API error');
            return {
              ...prev,
              [threadId]: list.filter((msg) => msg.id !== optimisticMessage.id),
            };
          });
        }
      };

      if (!ws.current) {
        // No socket – fallback immediately
        // console.log('=== NO WEBSOCKET - USING REST FALLBACK ===');
        void sendViaRest();
        return;
      }

      // console.log('=== WEBSOCKET STATE CHECK ===');
      // console.log('WebSocket exists:', !!ws.current);
      // console.log('WebSocket readyState:', ws.current.readyState);
      // console.log('WebSocket URL:', ws.current.url);

      switch (ws.current.readyState) {
        case WebSocket.OPEN:
          // WebSocket is open - send via WebSocket only
          // The server will send the message back to confirm, which will replace the optimistic message
          // console.log('=== SENDING VIA WEBSOCKET ===');
          // console.log('WebSocket state: OPEN');
          // console.log('Sending payload:', json);
          ws.current.send(json);
          break;
        case WebSocket.CONNECTING:
          // WebSocket is connecting - wait for it to open then send
          // console.log('=== WEBSOCKET CONNECTING - WAITING ===');
          // console.log('WebSocket state: CONNECTING');
          ws.current.addEventListener(
            "open",
            () => {
              // console.log('=== WEBSOCKET OPENED - SENDING ===');
              // console.log('Sending payload:', json);
              ws.current?.send(json);
            },
            { once: true },
          );
          break;
        default:
          // WebSocket is closed or in error state - use REST fallback
          // console.log('=== USING REST API FALLBACK ===');
          // console.log('WebSocket state:', ws.current.readyState);
          void sendViaRest();
      }
    },
    [openSocket, user?.id],
  );

  const markThreadRead = useCallback(
    (threadId: string) => {
      // Use functional state update to avoid stale closures
      setMessages((prevMessages) => {
        if (!prevMessages[threadId]) return prevMessages;

        const updatedMessages = prevMessages[threadId].map((m) =>
          !m.read_at && m.sender !== user?.id ? { ...m, read_at: new Date().toISOString() } : m,
        );

        return {
          ...prevMessages,
          [threadId]: updatedMessages,
        };
      });

      // Update threads state with functional update - calculates unread count from current state
      setThreads((prevThreads) => {
        return prevThreads.map((thread) => {
          if (thread.id === threadId) {
            return {
              ...thread,
              unread_count: 0, // All messages marked as read
            };
          }
          return thread;
        });
      });

      apiClient.post(`chat/${threadId}/mark_read/`).catch(() => {});
    },
    [user?.id],
  );

  // Function to recalculate unread counts for all threads
  const recalculateUnreadCounts = useCallback(() => {
    setThreads((prev) => {
      return prev.map((thread) => {
        const threadMessages = messages[thread.id] || [];
        const newUnreadCount = threadMessages.filter(
          (msg) => msg.sender !== user?.id && !msg.read_at,
        ).length;

        return {
          ...thread,
          unread_count: newUnreadCount,
        };
      });
    });
  }, [messages, user?.id]);

  const sendTypingStop = useCallback((threadId: string, recipientId: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({ type: "typing.stop", thread_id: threadId, recipient_id: recipientId }),
      );
    }

    // Clear any existing auto-stop timer
    const timerKey = `${threadId}-${recipientId}`;
    if (typingTimers.current[timerKey]) {
      clearTimeout(typingTimers.current[timerKey]);
      delete typingTimers.current[timerKey];
    }
  }, []);

  const sendTypingStart = useCallback(
    (threadId: string, recipientId: number) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({ type: "typing.start", thread_id: threadId, recipient_id: recipientId }),
        );

        // Auto-stop typing after 3 seconds of inactivity
        const timerKey = `${threadId}-${recipientId}`;

        // Clear existing timer for this thread/recipient
        if (typingTimers.current[timerKey]) {
          clearTimeout(typingTimers.current[timerKey]);
        }

        // Set new auto-stop timer
        typingTimers.current[timerKey] = window.setTimeout(() => {
          sendTypingStop(threadId, recipientId);
          delete typingTimers.current[timerKey];
        }, 3000); // 3 seconds
      }
    },
    [sendTypingStop],
  );

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
    recalculateUnreadCounts,
    connectionStatus,
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
