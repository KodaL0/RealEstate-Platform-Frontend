import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { Send, MoreVertical, Phone, Video, Info, ArrowLeft, User as UserIcon, ChevronDown, X, Trash2 } from "lucide-react";
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
  const navigate = useNavigate();
  const { threads, messages, setMessages, sendMessage, unsendMessage, markThreadRead, sendTypingStart, sendTypingStop, typingUsers, userStatuses } = useChat();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Message[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showJumpToNewest, setShowJumpToNewest] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const currentFetchRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Reset local state when thread changes
  useEffect(() => {
    if (!id) return;
    
    // Clear local state when switching threads
    setLocalMsgs([]);
    setNextUrl(null);
    setIsInitialLoading(false);
    setIsFetchingMore(false);
    setShowJumpToNewest(false);
    currentFetchRef.current = null;
  }, [id]);

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
          setIsInitialLoading(false);
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
    if (!id || !user) return;
    
    const threadMessages = messages[id];
    if (!threadMessages) return;
  
    const unreadFromOthers = threadMessages.filter(
      (msg) => !msg.read_at && msg.sender !== user.id
    );
  
    if (unreadFromOthers.length > 0) {
      markThreadRead(id);
    }
  }, [id, messages, user?.id, markThreadRead]);

  useEffect(() => {
    if (!id) return;
    
    const threadMessages = messages[id];
    if (!threadMessages) return;
    
    // If we're switching to a thread that already has messages cached,
    // and localMsgs is empty, set it directly
    if (localMsgs.length === 0 && threadMessages.length > 0) {
      setLocalMsgs(threadMessages);
      return;
    }
    
    // Otherwise, merge new messages
    setLocalMsgs((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      threadMessages.forEach((m) => {
        if (!seen.has(m.id)) merged.push(m);
      });
      return merged;
    });
  }, [id, messages, localMsgs.length]);

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
    if (!input.trim() || !id || !user || !recipientId) return;

    sendMessage(id, recipientId, input.trim(), propertyId || undefined);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUnsend = async (messageId: string) => {
    try {
      await unsendMessage(messageId);
      setShowContextMenu(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Failed to unsend message:", error);
      // You might want to show a toast notification here
    }
  };

  // Long press handlers for mobile context menu
  const handleLongPressStart = (messageId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    longPressTimerRef.current = window.setTimeout(() => {
      setSelectedMessage(messageId);
      setShowContextMenu(true);
      // Vibrate on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
    setSelectedMessage(null);
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
      {/* Enhanced Header - Mobile Optimized */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-blue-100">
            <UserIcon size={14} className="sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            {thread?.property ? (
              <Link 
                to={`/property/${propertyId}`}
                className="block hover:text-blue-600 transition-colors group"
                title={thread?.property_title || `Property #${propertyId}`}
              >
                <h2 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base leading-tight mb-0.5 break-words line-clamp-2">
                  {thread?.property_title || `Property #${propertyId}`}
                </h2>
              </Link>
            ) : (
              <h2 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight mb-0.5 break-words line-clamp-2" title={thread?.other_username || 'Direct Message'}>
                {thread?.other_username || 'Direct Message'}
              </h2>
            )}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <p className="text-xs sm:text-sm text-slate-500 truncate flex-shrink min-w-0">
                {thread?.property ? 
                  `${thread.other_username ? `${thread.other_username}` : `Property ID: ${propertyId}`}` :
                  'Direct Message'
                }
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-[10px] sm:text-xs text-green-600 font-medium hidden sm:inline">
                  {isOtherUserOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area - Mobile Optimized */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 min-h-0 scroll-smooth touch-pan-y"
      >
        <div ref={topSentinelRef} className="h-1" />
        
        {groupedMessages.map(({ label, items }) => (
          <div key={label} className="space-y-3 sm:space-y-4">
            {/* Enhanced Date Separator - Mobile Optimized */}
            <div className="flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm text-slate-600 text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium shadow-sm border border-slate-200/50">
                {label}
              </div>
            </div>
            
            {/* Messages - Mobile Optimized */}
            <div className="space-y-2 sm:space-y-3">
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
                    <div 
                      className={`
                        max-w-[75%] sm:max-w-md lg:max-w-lg xl:max-w-xl
                        ${isOwn 
                          ? message.is_unsent 
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/25' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white border border-slate-200/60 shadow-sm'
                        }
                        rounded-2xl px-4 py-3 relative
                        transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                        ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}
                        ${message.is_unsent ? 'opacity-75' : ''}
                        touch-manipulation select-text
                      `}
                      onTouchStart={isOwn && !message.is_unsent ? () => handleLongPressStart(message.id) : undefined}
                      onTouchEnd={handleLongPressEnd}
                      onTouchCancel={handleLongPressEnd}
                      onMouseDown={isOwn && !message.is_unsent ? () => handleLongPressStart(message.id) : undefined}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                    >
                      {/* Sender name for incoming messages */}
                      {!isOwn && showAvatar && (
                        <div className="text-xs font-medium text-slate-600 mb-1">
                          {thread?.other_username || 'Other User'}
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div className={`whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-slate-800'} ${message.is_unsent ? 'italic' : ''}`}>
                        {message.content}
                      </div>
                      
                      {/* Mobile-Optimized Unsend button for own messages (only if not already unsent) */}
                      {isOwn && !message.is_unsent && (
                        <button
                          onClick={() => handleUnsend(message.id)}
                          className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-red-500 hover:bg-red-600 focus:bg-red-600 text-white rounded-full p-1.5 sm:p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 min-w-[32px] min-h-[32px] sm:min-w-[24px] sm:min-h-[24px] flex items-center justify-center touch-manipulation active:scale-95"
                          title="Unsend message"
                          aria-label="Unsend this message"
                        >
                          <X size={14} className="sm:w-3 sm:h-3" />
                        </button>
                      )}
                      
                      {/* Time and status */}
                      <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>
                        <span>{formatTime(message.created_at)}</span>
                        {message.is_unsent && (
                          <span className="text-xs opacity-75">• Unsent</span>
                        )}
                        {isOwn && !message.is_unsent && (
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

      {/* Enhanced Jump to Newest Button - Mobile Optimized */}
      {showJumpToNewest && (
        <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-6 z-10">
          <button
            onClick={jumpToNewest}
            className="bg-white/90 backdrop-blur-sm text-slate-600 hover:text-blue-600 pl-3 sm:pl-4 pr-2 sm:pr-3 py-2.5 sm:py-3 rounded-full shadow-lg hover:shadow-xl border border-slate-200/50 hover:border-blue-200 transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium hover:scale-105 group touch-manipulation active:scale-95"
          >
            <span className="hidden xs:inline">Jump to newest</span>
            <span className="xs:hidden">New</span>
            <div className="bg-blue-50 group-hover:bg-blue-100 rounded-full p-0.5 sm:p-1 transition-colors">
              <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px] text-blue-600" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Context Menu for Message Actions */}
      {showContextMenu && selectedMessage && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseContextMenu}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-w-[280px] max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800 text-sm">Message Options</h3>
              <p className="text-xs text-slate-500 mt-1">Choose an action for this message</p>
            </div>
            <div className="py-2">
              <button
                onClick={() => handleUnsend(selectedMessage)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 focus:bg-red-50 text-red-600 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Unsend Message</div>
                  <div className="text-xs text-red-500">Remove this message for everyone</div>
                </div>
              </button>
              <button
                onClick={handleCloseContextMenu}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 focus:bg-slate-50 text-slate-600 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <X size={16} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Cancel</div>
                  <div className="text-xs text-slate-500">Close this menu</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Input Area - Mobile Optimized */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-slate-200/60 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0 safe-area-bottom">
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="
                w-full border-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 
                rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm resize-none transition-all duration-200
                focus:outline-none focus:ring-4 focus:ring-blue-500/20
                placeholder-slate-400 bg-white/50 backdrop-blur-sm
                min-h-[44px] sm:min-h-[48px] max-h-[100px] sm:max-h-[120px]
                touch-manipulation mobile-input
              "
              rows={1}
              placeholder="Type your message..."
              style={{
                height: Math.min(Math.max(44, input.split("\n").length * 20 + 24), 100) + "px",
                fontSize: "16px", // Prevents zoom on iOS
              }}
            />
            {/* Mobile-optimized character count */}
            {input.length > 800 && (
              <div className="absolute -top-6 right-0 text-xs text-slate-400 bg-white/80 px-2 py-0.5 rounded">
                {input.length}/1000
              </div>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || !recipientId}
            className={`
              p-2.5 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0 shadow-lg
              focus:outline-none focus:ring-4 focus:ring-blue-500/20
              min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px]
              touch-manipulation active:scale-95
              ${input.trim() && recipientId
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }
            `}
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
        
        {/* Enhanced Status Bar - Mobile Optimized */}
        <div className="flex justify-between items-center mt-2 sm:mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline">Press Enter to send • Shift + Enter for new line</span>
            <span className="sm:hidden text-[10px]">Enter to send</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="font-medium text-green-600 text-[10px] sm:text-xs">{isOtherUserOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
