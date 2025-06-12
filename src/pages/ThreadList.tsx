import { Link, useParams } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { Clock, MapPin, MessageCircle, User, Search, Plus } from "lucide-react";

export default function ThreadList() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const { id: activeId } = useParams<{ id: string }>();
  const [filteredThreads, setFilteredThreads] = useState(threads);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let filtered = threads;
    
    if (searchTerm) {
      filtered = filtered.filter(thread => 
        thread.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.other_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by most recent activity
    filtered = filtered.sort((a, b) => {
      const aLastMsg = getLastMessage(a.id);
      const bLastMsg = getLastMessage(b.id);
      const aTime = aLastMsg?.timestamp || a.updated_at || '0';
      const bTime = bLastMsg?.timestamp || b.updated_at || '0';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setFilteredThreads(filtered);
  }, [threads, searchTerm, messages]);

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    return threadMessages && threadMessages.length > 0
      ? threadMessages[threadMessages.length - 1]
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-500">
                  {threads.length} conversation{threads.length !== 1 ? 's' : ''}
                  {totalUnread > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      • {totalUnread} unread
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
              <Plus size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {searchTerm 
                ? 'Try adjusting your search terms to find what you\'re looking for.'
                : 'Start chatting about properties to see your conversations here.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredThreads.map((thread) => {
              const lastMessage = getLastMessage(thread.id);
              const isOwnMessage = lastMessage?.sender === user?.id;
              const isActive = thread.id === activeId;
              
              return (
                <Link
                  to={`/chat/${thread.id}`}
                  key={thread.id}
                  className={`block hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {thread.property_title || `Property #${thread.property}`}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatTime(
                                lastMessage.timestamp ||
                                thread.updated_at ||
                                new Date().toISOString()
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600 truncate">
                            {thread.other_username || 'Unknown User'}
                          </p>
                          {thread.unread_count > 0 && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[18px] text-center">
                              {thread.unread_count > 99 ? '99+' : thread.unread_count}
                            </span>
                          )}
                        </div>

                        {/* Last Message Preview */}
                        {lastMessage ? (
                          <div className="flex items-center space-x-1 mb-2">
                            <span className="text-xs text-gray-500">
                              {isOwnMessage ? 'You: ' : ''}
                            </span>
                            <p className="text-xs text-gray-600 truncate flex-1">
                              {lastMessage.content}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic mb-2">No messages yet</p>
                        )}

                        {/* Property Location */}
                        {thread.property_address && (
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <MapPin size={10} />
                            <span className="truncate">{thread.property_address}</span>
                          </div>
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
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-4">
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
