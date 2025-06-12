import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";
import { Search, MessageCircle, User, Clock, MapPin, Home, Plus, Filter } from "lucide-react";

export default function ChatInbox() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredThreads, setFilteredThreads] = useState(threads);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'recent'>('all');

  useEffect(() => {
    let filtered = threads;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(thread => 
        thread.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.other_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(thread => thread.unread_count > 0);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        break;
      default:
        break;
    }

    setFilteredThreads(filtered);
  }, [threads, searchTerm, filterType]);

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
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle size={32} className="text-white" />
          </div>
          <p className="text-gray-600">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
              <p className="text-gray-600">
                {threads.length} conversation{threads.length !== 1 ? 's' : ''} 
                {threads.filter(t => t.unread_count > 0).length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {threads.filter(t => t.unread_count > 0).length} unread
                  </span>
                )}
              </p>
            </div>
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations, properties, or contacts..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'unread' | 'recent')}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread Only</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        {filteredThreads.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={40} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Start chatting about properties to see your conversations here. Connect with property owners, agents, and other interested parties.'
              }
            </p>
            {!searchTerm && (
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                Browse Properties
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThreads.map((thread) => {
              const lastMessage = getLastMessage(thread.id);
              const isOwnMessage = lastMessage?.sender === user?.id;
              
              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className="block bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <User size={24} className="text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Home size={16} className="text-gray-400" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {thread.property_title || `Property #${thread.property}`}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-3">
                            {lastMessage && (
                              <span className="text-sm text-gray-500 flex items-center space-x-1">
                                <Clock size={14} />
                                <span>{formatTime(lastMessage.timestamp || thread.updated_at || new Date().toISOString())}</span>
                              </span>
                            )}
                            {thread.unread_count > 0 && (
                              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full min-w-[20px] text-center">
                                {thread.unread_count > 99 ? '99+' : thread.unread_count}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {thread.other_username || 'Unknown User'}
                          </span>
                        </div>

                        {/* Last Message Preview */}
                        {lastMessage ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {isOwnMessage ? 'You: ' : ''}
                            </span>
                            <p className="text-sm text-gray-700 truncate flex-1">
                              {lastMessage.content}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No messages yet</p>
                        )}

                        {/* Property Location (if available) */}
                        {thread.property_address && (
                          <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                            <MapPin size={12} />
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

        {/* Quick Stats */}
        {threads.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={24} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{threads.length}</div>
              <div className="text-sm text-gray-600">Total Conversations</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {new Set(threads.map(t => t.other_username)).size}
              </div>
              <div className="text-sm text-gray-600">Unique Contacts</div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Home size={24} className="text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {new Set(threads.map(t => t.property)).size}
              </div>
              <div className="text-sm text-gray-600">Properties Discussed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
