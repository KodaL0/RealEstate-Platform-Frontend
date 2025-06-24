import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";
import { Search, MessageCircle, Clock, MapPin, Home, Plus, Filter, User as UserIcon } from "lucide-react";

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

  if (!user) {
    return (
      <div className="pt-[64px] min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle size={28} className="text-white" />
          </div>
          <p className="text-sm text-gray-600">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="max-w-full px-4 pt-4 pb-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
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
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center gap-2">
              <Plus size={16} /> New Chat
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('property')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'property'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home size={16} />
              Property Chats ({propertyThreads.length})
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'dm'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserIcon size={16} />
              Direct Messages ({dmThreads.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'recent')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>
        </div>

        {filteredThreads.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-600">
            {searchTerm ? 'No results found.' : 'No conversations yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThreads.map(thread => {
              const lastMessage = getLastMessage(thread.id);
              const isOwnMessage = lastMessage?.sender === user?.id;
              const unreadCount = getUnreadCount(thread.id);

              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className="block bg-white rounded-lg border border-gray-200 hover:shadow-md p-4 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {activeTab === 'property' ? (
                        thread.property_image ? (
                          <img
                            src={thread.property_image}
                            alt={thread.property_title || 'Property'}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Home size={20} className="text-white" />
                          </div>
                        )
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <UserIcon size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <div className="flex-1 mr-2">
                          {activeTab === 'property' ? (
                            <Link
                              to={`/property/${thread.property}`}
                              className="hover:text-blue-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-medium text-gray-800 truncate hover:text-blue-600 block">
                                {thread.property_title || `Property #${thread.property}`}
                              </span>
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-800 truncate block">
                              {thread.other_username}
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(lastMessage.created_at || thread.updated_at || new Date().toISOString())}
                          </span>
                        )}
                      </div>
                      <div className="text-sm truncate mb-2">
                        {lastMessage ? (
                          <>
                            <span className={`font-medium ${isOwnMessage ? 'text-blue-600' : 'text-gray-800'}`}>
                              {isOwnMessage ? 'You: ' : `${thread.other_username || 'Them'}: `}
                            </span>
                            <span className="text-gray-600">{lastMessage.content}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No messages yet</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="text-xs text-white bg-blue-500 w-fit mt-1 px-2 py-0.5 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                      {activeTab === 'property' && thread.property_address && (
                        <div className="flex items-center text-xs text-gray-400 mt-1 gap-1">
                          <MapPin size={12} /> {thread.property_address}
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
