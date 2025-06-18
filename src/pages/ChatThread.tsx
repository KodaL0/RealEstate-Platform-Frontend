import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { Send, MoreVertical, Phone, Video, Info, ArrowLeft, User as UserIcon, ChevronDown } from "lucide-react";
import { Message } from "../types";
import { apiClient } from "../config/api";
import axios from "axios";

// Generic pagination type from DRF
interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function waitForStableHeight(element: HTMLElement, timeout = 500): Promise<void> {
  return new Promise((resolve) => {
    let lastHeight = element.scrollHeight;
    let stableCount = 0;
    const check = () => {
      if (element.scrollHeight === lastHeight) {
        stableCount++;
        if (stableCount >= 3) {
          resolve();
          return;
        }
      } else {
        lastHeight = element.scrollHeight;
        stableCount = 0;
      }
      setTimeout(check, timeout / 10);
    };
    check();
  });
}

export default function ChatThread() {
  const { id } = useParams<{ id: string }>();
  const { threads, messages, setMessages, sendMessage, markThreadRead, sendTypingStart, sendTypingStop, typingUsers, userStatuses } = useChat();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Message[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showJumpToNewest, setShowJumpToNewest] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const currentFetchRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id || isInitialLoading) return;

    if (currentFetchRef.current === id) return;

    const existingMessages = messages[id];

    const scrollToBottom = async () => {
      if (!messagesContainerRef.current) return;
      await waitForStableHeight(messagesContainerRef.current);
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    if (existingMessages?.length > 0) {
      setLocalMsgs(existingMessages);
      scrollToBottom();
      return;
    }

    currentFetchRef.current = id;
    setIsInitialLoading(true);

    fetchPage(`chat/${id}/messages/?limit=30`)
      .then(async (res) => {
        if (currentFetchRef.current === id) {
          const reversed = res.data.results.reverse();
          setLocalMsgs(reversed);
          setNextUrl(res.data.next);

          setMessages((prev) => ({
            ...prev,
            [id]: reversed,
          }));

          await scrollToBottom();
        }
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err);
        if (currentFetchRef.current === id) {
          currentFetchRef.current = null;
          setIsInitialLoading(false);
        }
      });
  }, [id, messages, setMessages, isInitialLoading]);

  useEffect(() => {
    if (!id || !user || !messages[id]) return;
  
    const unreadFromOthers = messages[id].filter(
      (msg) => !msg.read_at && msg.sender !== user.id
    );
  
    if (unreadFromOthers.length > 0) {
      markThreadRead(id);
    }
  }, [id, messages[id]?.length, user?.id, markThreadRead]);

  useEffect(() => {
    if (!id || !messages[id]) return;
    setLocalMsgs((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      messages[id].forEach((m) => {
        if (!seen.has(m.id)) merged.push(m);
      });
      return merged;
    });
  }, [id, messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    setShowJumpToNewest(!isNearBottom && localMsgs.length > 0);

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMsgs]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowJumpToNewest(!isNearBottom && localMsgs.length > 0);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [localMsgs.length]);

  const thread = threads.find((t) => t.id === id);

  const recipientId: number | null = thread
    ? thread.user1 === user?.id
      ? thread.user2
      : thread.user1
    : localMsgs[0]
    ? localMsgs[0].sender === user?.id
      ? localMsgs[0].recipient
      : localMsgs[0].sender
    : null;

  const propertyId: number | null = thread
    ? thread.property
    : localMsgs[0]?.property_id ?? null;

  // Check if other user is typing and online
  const isOtherUserTyping = id ? typingUsers[id] || false : false;
  const isOtherUserOnline = recipientId ? userStatuses[recipientId] === 'online' : false;

  const handleSend = () => {
    if (!input.trim() || !id || !user || !recipientId || !propertyId) return;

    sendMessage(id, recipientId, propertyId, input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const jumpToNewest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToNewest(false);
  };

  const groupedMessages = useMemo(() => {
    const out: { label: string; items: Message[] }[] = [];
    localMsgs.forEach((m) => {
      const label = formatDate(m.created_at);
      const last = out[out.length - 1];
      if (!last || last.label !== label) out.push({ label, items: [] });
      out[out.length - 1].items.push(m);
    });
    return out;
  }, [localMsgs]);

  const fetchPage = (url: string) => {
    return url.startsWith("http")
      ? axios.get<Paginated<Message>>(url, { withCredentials: true })
      : apiClient.get<Paginated<Message>>(url);
  };

  const loadMore = () => {
    if (!nextUrl || isFetchingMore) return;
    setIsFetchingMore(true);

    fetchPage(nextUrl).then((res) => {
      const older = res.data.results.reverse();
      const container = messagesContainerRef.current;
      const prevHeight = container ? container.scrollHeight : 0;

      setLocalMsgs((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !seen.has(m.id)), ...prev];
      });
      setNextUrl(res.data.next);
      setIsFetchingMore(false);

      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight;
        }
      }, 0);
    });
  };

  useEffect(() => {
    if (!nextUrl) return;
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      { root: messagesContainerRef.current, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextUrl, isFetchingMore]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white min-h-0">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-4 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full p-2 transition-all duration-200">
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-blue-100">
            <UserIcon size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <Link 
              to={`/property/${propertyId}`}
              className="block hover:text-blue-600 transition-colors group"
            >
              <h2 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {thread?.property_title || `Property #${propertyId}`}
              </h2>
            </Link>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500 truncate">
                {thread?.other_username ? `${thread.other_username}` : `Property ID: ${propertyId}`}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-xs text-green-600 font-medium"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 min-h-0 scroll-smooth"
      >
        <div ref={topSentinelRef} className="h-1" />
        
        {groupedMessages.map(({ label, items }) => (
          <div key={label} className="space-y-4">
            {/* Enhanced Date Separator */}
            <div className="flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm text-slate-600 text-xs px-4 py-2 rounded-full font-medium shadow-sm border border-slate-200/50">
                {label}
              </div>
            </div>
            
            {/* Messages */}
            <div className="space-y-3">
              {items.map((message, idx) => {
                const isOwn = message.sender === user?.id;
                const showAvatar = idx === 0 || items[idx - 1]?.sender !== message.sender;
                
                return (
                  <div key={message.id} className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} group`}>
                    {/* Avatar for incoming messages */}
                    {!isOwn && (
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 transition-opacity duration-200 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center shadow-sm">
                          <UserIcon size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`
                      max-w-[75%] sm:max-w-md lg:max-w-lg xl:max-w-xl
                      ${isOwn 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'bg-white border border-slate-200/60 shadow-sm'
                      }
                      rounded-2xl px-4 py-3 relative
                      transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                      ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}
                    `}>
                      {/* Sender name for incoming messages */}
                      {!isOwn && showAvatar && (
                        <div className="text-xs font-medium text-slate-600 mb-1">
                          {thread?.other_username || 'Other User'}
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div className={`whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-slate-800'}`}>
                        {message.content}
                      </div>
                      
                      {/* Time and status */}
                      <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
                        <span>{formatTime(message.created_at)}</span>
                        {isOwn && (
                          <div className="flex items-center gap-1">
                            {/* Double check for read */}
                            {message.read_at ? (
                              <div className="flex">
                                <svg className="w-3 h-3 text-blue-200 -mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <svg className="w-3 h-3 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <svg className="w-3 h-3 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Enhanced Loading State */}
        {isFetchingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-3 shadow-sm border border-slate-200/50">
              <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <UserIcon size={12} className="text-white" />
              </div>
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-600 font-medium">Loading messages...</span>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {id && isOtherUserTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center shadow-sm">
              <UserIcon size={12} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Jump to Newest Button */}
      {showJumpToNewest && (
        <div className="absolute bottom-24 right-6 z-10">
          <button
            onClick={jumpToNewest}
            className="bg-white/90 backdrop-blur-sm text-slate-600 hover:text-blue-600 pl-4 pr-3 py-3 rounded-full shadow-lg hover:shadow-xl border border-slate-200/50 hover:border-blue-200 transition-all duration-200 flex items-center gap-2 text-sm font-medium hover:scale-105 group"
          >
            <span>Jump to newest</span>
            <div className="bg-blue-50 group-hover:bg-blue-100 rounded-full p-1 transition-colors">
              <ChevronDown size={14} className="text-blue-600" />
            </div>
          </button>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-slate-200/60 px-4 py-4 flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="
                w-full border-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 
                rounded-2xl px-4 py-3 pr-12 text-sm resize-none transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-blue-500/20
                placeholder-slate-400 bg-white/50 backdrop-blur-sm
                min-h-[48px] max-h-[120px]
              "
              rows={1}
              placeholder="Type your message..."
              style={{
                height: Math.min(Math.max(48, input.split("\n").length * 24 + 24), 120) + "px",
              }}
            />
            {/* Character count or typing indicator could go here */}
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || !recipientId || !propertyId}
            className={`
              p-3 rounded-full transition-all duration-200 flex-shrink-0 shadow-lg
              focus:outline-none focus:ring-4 focus:ring-blue-500/20
              ${input.trim() && recipientId && propertyId
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-95" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }
            `}
          >
            <Send size={18} />
          </button>
        </div>
        
        {/* Enhanced Status Bar */}
        <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Press Enter to send • Shift + Enter for new line</span>
            <span className="sm:hidden">Enter to send</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="font-medium text-green-600">{isOtherUserOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
