// src/pages/ThreadList.tsx
import { Link, useParams } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { MessageCircle, User, MapPin, Search, Plus } from "lucide-react";

export default function ThreadList() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const { id: activeId } = useParams<{ id: string }>();
  const [filteredThreads, setFilteredThreads] = useState(threads);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let filtered = [...threads]; // copy to avoid mutating context state
    if (searchTerm) {
      filtered = filtered.filter(thread =>
        thread.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.other_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered = filtered.sort((a, b) => {
      const aLast = getLastMessage(a.id);
      const bLast = getLastMessage(b.id);
      const aTime = aLast?.created_at || a.updated_at || '0';
      const bTime = bLast?.created_at || b.updated_at || '0';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    setFilteredThreads(filtered);
  }, [threads, searchTerm, messages]);

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    return threadMessages && threadMessages.length > 0
      ? threadMessages[0] // newest first
      : null;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? "Just now" : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const totalUnread = threads.reduce((sum, thread) => sum + thread.unread_count, 0);

  return (
    <div className="h-full flex flex-col bg-white min-h-0">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-900 mb-3">Messages</h1>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* New Chat Button */}
        <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center justify-center gap-2">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchTerm ? 'No conversations found.' : 'No conversations yet.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredThreads.map(thread => {
              const lastMessage = getLastMessage(thread.id);
              const isOwnMessage = lastMessage?.sender === user?.id;
              const isActive = thread.id === activeId;
              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className={`block p-3 sm:p-4 hover:bg-gray-50 transition-colors active:bg-gray-100 ${
                    isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">
                          {thread.property_title || `Property #${thread.property}`}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(lastMessage.created_at || thread.updated_at || new Date().toISOString())}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {isOwnMessage ? 'You: ' : ''}{lastMessage?.content || 'No messages yet'}
                      </p>
                      <div className="flex items-center justify-between">
                        {thread.property_address && (
                          <div className="flex items-center text-xs text-gray-400 gap-1 truncate flex-1 mr-2">
                            <MapPin size={12} className="flex-shrink-0" />
                            <span className="truncate">{thread.property_address}</span>
                          </div>
                        )}
                        {thread.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                            {thread.unread_count > 99 ? '99+' : thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {threads.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{threads.length}</div>
              <div className="text-xs text-gray-600">Total Chats</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {new Set(threads.map(t => t.property)).size}
              </div>
              <div className="text-xs text-gray-600">Properties</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
