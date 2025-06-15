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
    let filtered = [...threads]; // copy to avoid mutating context state
    if (searchTerm) {
      filtered = filtered.filter(thread => 
        thread.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.other_username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(thread => thread.unread_count > 0);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime()
        );
        break;
    }
    setFilteredThreads(filtered);
  }, [threads, searchTerm, filterType]);

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    return threadMessages && threadMessages.length > 0 
      ? threadMessages[0] // newest message is always first in array
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
    <div className="pt-[64px] h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Messages</h1>
              <p className="text-sm text-gray-600">
                {threads.length} conversation{threads.length !== 1 ? 's' : ''} 
                {threads.filter(t => t.unread_count > 0).length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {threads.filter(t => t.unread_count > 0).length} unread
                  </span>
                )}
              </p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
              <Plus size={16} /> New Chat
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

              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className="block bg-white rounded-lg border border-gray-200 hover:shadow-md p-4 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-medium text-gray-800 truncate">
                          {thread.property_title || `Property #${thread.property}`}
                        </span>
                        {lastMessage && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(lastMessage.created_at || thread.updated_at || new Date().toISOString())}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {isOwnMessage ? 'You: ' : ''}{lastMessage?.content || 'No messages yet'}
                      </div>
                      {thread.unread_count > 0 && (
                        <div className="text-xs text-white bg-blue-500 w-fit mt-1 px-2 py-0.5 rounded-full">
                          {thread.unread_count > 99 ? '99+' : thread.unread_count}
                        </div>
                      )}
                      {thread.property_address && (
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
