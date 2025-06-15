// src/pages/ChatThread.tsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { Send, MoreVertical, Phone, Video, Info, ArrowLeft, User as UserIcon } from "lucide-react";
import { Message } from "../types";
import { apiClient } from "../config/api";
import axios from "axios";
import { useRef as useRefHook } from "react";

// Generic pagination type from DRF
interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function ChatThread() {
  const { id } = useParams<{ id: string }>();
  const { messages, sendMessage, threads, markThreadRead } = useChat();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Message[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showJumpToNewest, setShowJumpToNewest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // Load messages for thread
  useEffect(() => {
    if (!id) return;
    markThreadRead(id);
    console.log("Initial page fetch", id);
    fetchPage(`chat/${id}/messages/?limit=30`).then((res) => {
      setLocalMsgs(res.data.results.reverse()); // chronological ascending
      setNextUrl(res.data.next);
      console.log("Initial page loaded, next=", res.data.next);
      
      // Scroll to bottom after initial load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    });
  }, [id, messages]);

  // Sync real-time context updates without wiping paginated history.
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

  // Auto-scroll when new messages arrive, but only if near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Show/hide jump to newest button based on scroll position
    setShowJumpToNewest(!isNearBottom && localMsgs.length > 0);
    
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMsgs]);

  // Handle scroll events to show/hide jump button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShowJumpToNewest(!isNearBottom && localMsgs.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Standardize date format: "Today", "Yesterday", or "12 Jun"
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    // Format as "12 Jun" for consistency
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const jumpToNewest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToNewest(false);
  };

  // Build an ORDER-PRESERVING array of message groups so date labels always
  // appear before the messages that belong to them (fixes "Today" chip
  // mis-placement when older pages are prepended).
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
      const older = res.data.results.reverse(); // keep ascending

      const container = messagesContainerRef.current;
      const prevHeight = container ? container.scrollHeight : 0;

      // Prepend older messages while de-duplicating (guards against page
      // boundary overlaps that can otherwise flash duplicates).
      setLocalMsgs((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !seen.has(m.id)), ...prev];
      });
      setNextUrl(res.data.next);
      setIsFetchingMore(false);
      console.log("Loaded older page, new next=", res.data.next);

      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight;
        }
      }, 0);
    });
  };

  // IntersectionObserver to trigger loadMore when sentinel visible
  useEffect(() => {
    if (!nextUrl) return; // nothing more
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
    <div className="flex flex-col h-full bg-gray-50 min-h-0">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          {/* Back button for mobile */}
          <button className="lg:hidden text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <UserIcon size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <Link 
              to={`/property/${propertyId}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h2 className="font-medium text-sm sm:text-base text-gray-800 truncate hover:text-blue-600">
                {thread?.property_title || `Property #${propertyId}`}
              </h2>
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {thread?.other_username ? `Chat with ${thread.other_username}` : `Property ID: ${propertyId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
            <Phone size={16} />
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
            <Video size={16} />
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
            <Info size={16} />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages area: scroll internally */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 space-y-3 sm:space-y-4 text-sm min-h-0"
      >
        {/* Sentinel div to trigger older loading */}
        <div ref={topSentinelRef} className="h-1" />
        {groupedMessages.map(({ label, items }) => (
          <div key={label}>
            <div className="flex justify-center mb-2">
              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">{label}</span>
            </div>
            {items.map((message) => {
              const isOwn = message.sender === user?.id;
              return (
                <div key={message.id} className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                  {/* Sender label for incoming messages */}
                  {!isOwn && (
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-500 mb-1 ml-1">
                        {thread?.other_username || 'Other User'}
                      </span>
                      <div className={`
                        max-w-[85%] sm:max-w-xs md:max-w-sm px-3 py-2 rounded-xl shadow-sm break-words
                        bg-white border border-gray-200 rounded-bl-md
                      `}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-[10px] mt-1 text-right text-gray-400">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Own messages (right side) */}
                  {isOwn && (
                    <div className={`
                      max-w-[85%] sm:max-w-xs md:max-w-sm px-3 py-2 rounded-xl shadow-sm break-words
                      bg-blue-600 text-white rounded-br-md
                    `}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-[10px] mt-1 text-right text-blue-100 flex items-center justify-end gap-1">
                        <span>{formatTime(message.created_at)}</span>
                        {/* Read receipt indicator */}
                        {message.read_at && (
                          <svg className="w-3 h-3 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {nextUrl && !isFetchingMore && localMsgs.length > 0 && (
          <div className="text-center my-4">
            <button
              onClick={loadMore}
              className="text-xs sm:text-sm text-blue-600 hover:underline disabled:text-gray-400 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors"
              disabled={isFetchingMore}
            >
              Load earlier messages
            </button>
          </div>
        )}
        {isFetchingMore && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <UserIcon size={12} className="text-white" />
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-200" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Jump to newest button */}
      {showJumpToNewest && (
        <div className="absolute bottom-20 right-4 z-10">
          <button
            onClick={jumpToNewest}
            className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            Jump to newest
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t px-3 sm:px-4 py-3 flex-shrink-0">
        <div className="flex items-end space-x-2 sm:space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
              flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-400 min-h-[40px] max-h-[120px]
            "
            rows={1}
            placeholder="Type your message..."
            style={{
              height: Math.min(Math.max(40, input.split("\n").length * 20 + 20), 120) + "px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !recipientId || !propertyId}
            className={`
              p-2 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              input.trim() && recipientId && propertyId
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
            `}
          >
            <Send size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="text-[10px] sm:text-xs text-gray-400 mt-2 flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="hidden sm:inline">Enter to send • Shift + Enter = newline</span>
          <span className="sm:hidden">Enter to send</span>
          <span className="flex items-center gap-1 self-end sm:self-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div> Online
          </span>
        </div>
      </div>
    </div>
  );
}
