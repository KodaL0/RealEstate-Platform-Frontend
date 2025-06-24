import { Link, useParams } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import {
  MapPin,
  Search,
  Home,
  MessageCircle,
  Clock,
  CheckCheck
} from "lucide-react";

export default function ThreadList() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const { id: activeId } = useParams<{ id: string }>();
  const [filteredThreads, setFilteredThreads] = useState(threads);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let filtered = [...threads];
    if (searchTerm) {
      filtered = filtered.filter((thread) =>
        thread.property_title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        thread.other_username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        thread.property_address
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      const aLast = getLastMessage(a.id);
      const bLast = getLastMessage(b.id);
      const aTime =
        aLast?.created_at ||
        a.last_message?.created_at ||
        a.updated_at ||
        "0";
      const bTime =
        bLast?.created_at ||
        b.last_message?.created_at ||
        b.updated_at ||
        "0";
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    setFilteredThreads(filtered);
  }, [threads, searchTerm, messages]);

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    if (threadMessages && threadMessages.length > 0) {
      return threadMessages[threadMessages.length - 1];
    }
    const thread = threads.find((t) => t.id === threadId);
    if (thread?.last_message) {
      return {
        id: thread.last_message.id,
        thread_id: threadId,
        property_id: thread.property,
        sender: thread.last_message.sender,
        recipient:
          thread.user1 === thread.last_message.sender
            ? thread.user2
            : thread.user1,
        content: thread.last_message.content,
        created_at: thread.last_message.created_at,
        read_at: thread.last_message.read_at
      };
    }
    return null;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? "Just now" : `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-GB", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
      });
    }
  };

  const getTotalUnreadCount = () =>
    filteredThreads.reduce((total, thread) => {
      const unreadMessages =
        messages[thread.id]?.filter(
          (msg) => !msg.read_at && msg.sender !== user?.id
        ) || [];
      return total + unreadMessages.length;
    }, 0);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white min-h-0">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-6 py-5 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-100">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Messages
              </h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>
                  {filteredThreads.length} conversation
                  {filteredThreads.length !== 1 ? "s" : ""}
                </span>
                {getTotalUnreadCount() > 0 && (
                  <>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="font-medium text-blue-600">
                        {getTotalUnreadCount()} unread
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search conversations, properties, or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border-2 border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <MessageCircle size={28} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              {searchTerm ? "No matches found" : "No conversations yet"}
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              {searchTerm
                ? "Try adjusting your search terms or browse all conversations."
                : "Start meaningful conversations by reaching out to property owners and begin building connections."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50">
            {filteredThreads.map((thread) => {
              const lastMessage = getLastMessage(thread.id);
              const isOwn = lastMessage?.sender === user?.id;
              const hasUnread = (thread.unread_count || 0) > 0;

              return (
                <Link
                  key={thread.id}
                  to={`/chat/${thread.id}`}
                  className="block hover:bg-slate-50/80 transition-all duration-200 group relative"
                >
                  <div className="px-6 py-5 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {thread.property_image ? (
                        <div className="relative">
                          <img
                            src={thread.property_image}
                            alt={thread.property_title || "Property"}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-lg ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all duration-200"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-200">
                          <Home size={20} className="text-white" />
                        </div>
                      )}

                      {hasUnread && (
                        <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse px-1.5">
                          {thread.unread_count! > 99 ? "99+" : thread.unread_count}
                        </div>
                      )}

                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          {/* Make this Link a block so truncate works */}
                          <Link
                            to={`/property/${thread.property}`}
                            className="block hover:text-blue-600 transition-colors group/property"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h3
                              className={`font-semibold text-slate-800 truncate transition-colors ${
                                hasUnread ? "text-slate-900" : ""
                              }`}
                            >
                              {thread.property_title ||
                                `Property #${thread.property}`}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-sm font-medium truncate ${
                                hasUnread ? "text-slate-700" : "text-slate-600"
                              }`}
                            >
                              {thread.other_username || "Unknown User"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span
                            className={`text-xs font-medium ${
                              hasUnread ? "text-blue-600" : "text-slate-500"
                            }`}
                          >
                            {lastMessage
                              ? formatTime(lastMessage.created_at)
                              : thread.last_message
                              ? formatTime(thread.last_message.created_at)
                              : formatTime(new Date().toISOString())}
                          </span>
                          {isOwn && (
                            <div className="flex items-center gap-1">
                              {(lastMessage?.read_at ||
                                thread.last_message?.read_at) ? (
                                <CheckCheck
                                  size={12}
                                  className="text-blue-500"
                                />
                              ) : (
                                <Clock
                                  size={12}
                                  className="text-slate-400"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        {lastMessage ? (
                          <p
                            className={`text-sm truncate ${
                              hasUnread
                                ? "font-medium text-slate-700"
                                : "text-slate-600"
                            }`}
                          >
                            <span
                              className={`font-medium ${
                                isOwn ? "text-blue-600" : "text-slate-800"
                              }`}
                            >
                              {isOwn ? "You: " : ""}
                            </span>
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 italic flex items-center gap-2">
                            <MessageCircle size={14} />
                            Start the conversation
                          </p>
                        )}
                      </div>

                      {thread.property_address && (
                        <div className="flex items-center text-xs text-slate-500 gap-1.5 mb-2">
                          <MapPin
                            size={12}
                            className="flex-shrink-0 text-slate-400"
                          />
                          <span className="truncate">
                            {thread.property_address}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {hasUnread && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-blue-600">
                              New messages
                            </span>
                          </div>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                          <svg
                            className="w-4 h-4 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
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
        <div className="flex-shrink-0 border-t border-slate-200/60 bg-white/90 backdrop-blur-sm px-6 py-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="group">
              <div className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {threads.length}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Total Chats
              </div>
            </div>
            <div className="group">
              <div className="text-xl font-bold text-slate-800 group-hover:text-green-600 transition-colors">
                {new Set(threads.map((t) => t.property)).size}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Properties
              </div>
            </div>
            <div className="group">
              <div className="text-xl font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                {getTotalUnreadCount()}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Unread
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
