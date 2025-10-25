// src/pages/ChatInbox.tsx
import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";
import { Search, MessageCircle, Clock, MapPin, Home, Plus, Filter, User as UserIcon, X, Circle } from "lucide-react";

export default function ChatInbox() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredThreads, setFilteredThreads] = useState(threads);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'recent'>('all');
  const [activeTab, setActiveTab] = useState<'property' | 'dm'>('property');

  // Separate threads by type
  const propertyThreads = threads.filter(thread => thread.property);
  const dmThreads = threads.filter(thread => !thread.property);
  const currentThreads = activeTab === 'property' ? propertyThreads : dmThreads;

  useEffect(() => {
    let filtered = [...currentThreads];
    
    // Always sort by most recent message first (most relevant)
    filtered = filtered.sort((a, b) => {
      const aLastMessage = getLastMessage(a.id);
      const bLastMessage = getLastMessage(b.id);
      
      // Use the most recent timestamp available
      const aTimestamp = aLastMessage?.created_at || a.updated_at || new Date(0).toISOString();
      const bTimestamp = bLastMessage?.created_at || b.updated_at || new Date(0).toISOString();
      
      return new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime();
    });
    
    if (searchTerm) {
      filtered = filtered.filter(thread =>
        thread.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.other_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(t => getUnreadCount(t.id) > 0);
        break;
      case 'recent':
        // Already sorted by most recent, no additional sorting needed
        break;
    }
    setFilteredThreads(filtered);
  }, [currentThreads, searchTerm, filterType]);

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    if (threadMessages && threadMessages.length > 0) {
      return threadMessages[threadMessages.length - 1]; // Get the latest message
    }
    // Fallback to server data if no cached messages
    const thread = threads.find((t) => t.id === threadId);
    if (thread?.last_message) {
      return {
        id: thread.last_message.id,
        thread_id: threadId,
        property_id: thread.property,
        sender: thread.last_message.sender,
        recipient: thread.user1 === thread.last_message.sender ? thread.user2 : thread.user1,
        content: thread.last_message.content,
        created_at: thread.last_message.created_at,
        read_at: thread.last_message.read_at
      };
    }
    return null;
  };

  // Use server unread_count for consistency with notification system
  const getUnreadCount = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    return thread?.unread_count || 0;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle size={32} className="text-white" />
          </div>
          <p className="text-sm text-gray-600">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 w-full overflow-hidden">
      {/* Enhanced Header with better mobile spacing */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Messages</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              {currentThreads.length} conversation{currentThreads.length !== 1 ? 's' : ''}
              {currentThreads.filter(t => getUnreadCount(t.id) > 0).length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {currentThreads.filter(t => getUnreadCount(t.id) > 0).length} unread
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Improved Tab Navigation with better mobile design */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-3 sm:mb-4">
          <button
            onClick={() => setActiveTab('property')}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              activeTab === 'property'
                ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === 'property'}
          >
            <Home size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Property</span>
            <span className="xs:hidden">Prop</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full min-w-[16px] sm:min-w-[20px] text-center text-[10px] sm:text-xs">
              {propertyThreads.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              activeTab === 'dm'
                ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === 'dm'}
          >
            <UserIcon size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Direct</span>
            <span className="xs:hidden">DM</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-1 sm:px-1.5 py-0.5 rounded-full min-w-[16px] sm:min-w-[20px] text-center text-[10px] sm:text-xs">
              {dmThreads.length}
            </span>
          </button>
        </div>

        {/* Enhanced Search and Filter Bar - Mobile Optimized */}
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <Search size={14} className="sm:w-4 sm:h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              aria-label="Search conversations"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'recent')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-2 pr-6 sm:pr-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              aria-label="Filter conversations"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="recent">Recent</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-1 sm:pr-2 flex items-center pointer-events-none">
              <Filter size={12} className="sm:w-3.5 sm:h-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages List with mobile optimizations */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 sm:py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 isolate chat-thread-list">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <MessageCircle size={20} className="sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 px-4">
              {searchTerm 
                ? 'Try adjusting your search terms or filters' 
                : `Start a ${activeTab === 'property' ? 'property' : 'direct'} conversation`
              }
            </p>
            {!searchTerm && (
              <button className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors">
                <Plus size={14} className="inline mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                Start Chatting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-2">
            {filteredThreads.map(thread => {
              const lastMessage = getLastMessage(thread.id);
              const isOwnMessage = lastMessage?.sender === user?.id;
              const unreadCount = getUnreadCount(thread.id);
              const hasUnread = unreadCount > 0;

              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className={`block rounded-lg sm:rounded-xl border p-3 sm:p-4 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] ${
                    hasUnread 
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm' 
                      : 'bg-white border-gray-200 hover:shadow-lg hover:border-gray-300'
                  }`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open chat with ${thread.other_username}${activeTab === 'property' ? ` about ${thread.property_title}` : ''}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 relative">
                      {activeTab === 'property' ? (
                        thread.property_image ? (
                          <img
                            src={thread.property_image}
                            alt={thread.property_title || 'Property'}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-200 transition-colors"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <Home size={16} className="sm:w-5 sm:h-5 text-white" />
                          </div>
                        )
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                          <UserIcon size={16} className="sm:w-5 sm:h-5 text-white" />
                        </div>
                      )}
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-sm">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                          {activeTab === 'property' ? (
                            <div 
                              className="group/title"
                              title={thread.property_title || `Property #${thread.property}`}
                            >
                              <h3 className={`font-semibold truncate group-hover:text-blue-600 transition-colors text-xs sm:text-sm ${
                                hasUnread ? 'text-gray-900' : 'text-gray-900'
                              }`}>
                                {thread.property_title || `Property #${thread.property}`}
                              </h3>
                            </div>
                          ) : (
                            <h3 
                              className={`font-semibold truncate group-hover:text-blue-600 transition-colors text-xs sm:text-sm ${
                                hasUnread ? 'text-gray-900' : 'text-gray-900'
                              }`}
                              title={thread.other_username}
                            >
                              {thread.other_username}
                            </h3>
                          )}
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                            {activeTab === 'property' ? thread.other_username : 'Direct Message'}
                          </p>
                        </div>
                        {lastMessage && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 flex-shrink-0">
                            <Clock size={10} className="sm:w-3 sm:h-3" />
                            <time dateTime={lastMessage.created_at}>
                              {formatTime(lastMessage.created_at || thread.updated_at || new Date().toISOString())}
                            </time>
                          </div>
                        )}
                      </div>

                      <div className="mb-1 sm:mb-2">
                        {lastMessage ? (
                          <p className={`text-xs sm:text-sm truncate ${
                            hasUnread ? 'text-gray-800 font-medium' : 'text-gray-600'
                          }`}>
                            <span className={`font-medium ${isOwnMessage ? 'text-blue-600' : hasUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                              {isOwnMessage ? 'You: ' : `${thread.other_username}: `}
                            </span>
                            <span>{lastMessage.content}</span>
                          </p>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-400 italic">No messages yet</p>
                        )}
                      </div>

                      {activeTab === 'property' && thread.property_address && (
                        <div className="flex items-center text-[10px] sm:text-xs text-gray-400 gap-1" title={thread.property_address}>
                          <MapPin size={10} className="sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate">{thread.property_address}</span>
                        </div>
                      )}

                      {/* Unread indicator dot */}
                      {hasUnread && (
                        <div className="flex items-center gap-1 mt-1">
                          <Circle size={8} className="text-blue-500 fill-current" />
                          <span className="text-[10px] sm:text-xs text-blue-600 font-medium">
                            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
