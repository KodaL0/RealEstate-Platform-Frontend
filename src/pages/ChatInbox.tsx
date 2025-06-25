// src/pages/ChatInbox.tsx
import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";
import { Search, MessageCircle, Clock, MapPin, Home, Plus, Filter, User as UserIcon, X } from "lucide-react";

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
        filtered = filtered.sort((a, b) =>
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        break;
    }
    setFilteredThreads(filtered);
  }, [currentThreads, searchTerm, filterType]);

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    return threadMessages && threadMessages.length > 0
      ? threadMessages[0]
      : null;
  };

  const getUnreadCount = (threadId: string) => {
    const threadMessages = messages[threadId] || [];
    return threadMessages.filter(
      msg => msg.sender !== user?.id && !msg.read_at
    ).length;
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
    <div className="h-full flex flex-col bg-gray-50 w-full max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
      {/* Enhanced Header with better spacing and hierarchy */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Messages</h1>
            <p className="text-sm text-gray-600">
              {currentThreads.length} conversation{currentThreads.length !== 1 ? 's' : ''}
              {currentThreads.filter(t => getUnreadCount(t.id) > 0).length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {currentThreads.filter(t => getUnreadCount(t.id) > 0).length} unread
                </span>
              )}
            </p>
          </div>
          <button 
            className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Start new chat"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Improved Tab Navigation with better responsive design */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('property')}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              activeTab === 'property'
                ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === 'property'}
          >
            <Home size={16} />
            <span className="hidden xs:inline">Property</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {propertyThreads.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              activeTab === 'dm'
                ? 'bg-white text-blue-600 shadow-sm transform scale-[1.02]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-pressed={activeTab === 'dm'}
          >
            <UserIcon size={16} />
            <span className="hidden xs:inline">Direct</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {dmThreads.length}
            </span>
          </button>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              aria-label="Search conversations"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'recent')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              aria-label="Filter conversations"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="recent">Recent</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <Filter size={14} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages List with improved scrolling and spacing */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or filters' 
                : `Start a ${activeTab === 'property' ? 'property' : 'direct'} conversation`
              }
            </p>
            {!searchTerm && (
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                <Plus size={16} className="inline mr-2" />
                Start Chatting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredThreads.map(thread => {
              const lastMessage = getLastMessage(thread.id);
              const isOwnMessage = lastMessage?.sender === user?.id;
              const unreadCount = getUnreadCount(thread.id);

              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className="block bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 p-4 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  tabIndex={0}
                  role="button"
                  aria-label={`Open chat with ${thread.other_username}${activeTab === 'property' ? ` about ${thread.property_title}` : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 relative">
                      {activeTab === 'property' ? (
                        thread.property_image ? (
                          <img
                            src={thread.property_image}
                            alt={thread.property_title || 'Property'}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-200 transition-colors"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            <Home size={20} className="text-white" />
                          </div>
                        )
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                          <UserIcon size={20} className="text-white" />
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
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
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-sm">
                                {thread.property_title || `Property #${thread.property}`}
                              </h3>
                            </div>
                          ) : (
                            <h3 
                              className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors text-sm"
                              title={thread.other_username}
                            >
                              {thread.other_username}
                            </h3>
                          )}
                          <p className="text-xs text-gray-500 truncate">
                            {activeTab === 'property' ? thread.other_username : 'Direct Message'}
                          </p>
                        </div>
                        {lastMessage && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                            <Clock size={12} />
                            <time dateTime={lastMessage.created_at}>
                              {formatTime(lastMessage.created_at || thread.updated_at || new Date().toISOString())}
                            </time>
                          </div>
                        )}
                      </div>

                      <div className="mb-2">
                        {lastMessage ? (
                          <p className="text-sm text-gray-600 truncate">
                            <span className={`font-medium ${isOwnMessage ? 'text-blue-600' : 'text-gray-800'}`}>
                              {isOwnMessage ? 'You: ' : `${thread.other_username}: `}
                            </span>
                            <span>{lastMessage.content}</span>
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No messages yet</p>
                        )}
                      </div>

                      {activeTab === 'property' && thread.property_address && (
                        <div className="flex items-center text-xs text-gray-400 gap-1" title={thread.property_address}>
                          <MapPin size={12} className="flex-shrink-0" />
                          <span className="truncate">{thread.property_address}</span>
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
