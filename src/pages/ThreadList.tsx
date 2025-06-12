import { Link, useParams } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { User, Clock, MapPin } from "lucide-react";

export default function ThreadList() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const { id: activeId } = useParams<{ id: string }>();
  const [filteredThreads, setFilteredThreads] = useState(threads);

  useEffect(() => {
    setFilteredThreads(threads);
  }, [threads]);

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

  return (
    // Fixed sidebar container: fixed position, full height from below navbar to bottom
    <div className="fixed top-[64px] left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-10 flex flex-col">
      {/* Header inside sidebar: sticky so it remains visible when threads scroll */}
      <div className="sticky top-0 bg-white px-4 py-4 border-b border-gray-200 flex items-center gap-2 z-20">
        <img src="/logo.svg" alt="Logo" className="h-6" />
        <span className="text-blue-600 font-bold text-lg">PROPERTPRO</span>
      </div>

      {/* Scrollable thread list */}
      <div className="overflow-y-auto flex-1">
        <h2 className="px-4 pt-3 pb-2 text-sm font-medium text-gray-600">Your Conversations</h2>
        <div className="space-y-1">
          {filteredThreads.map((t) => {
            const lastMessage = getLastMessage(t.id);
            // ...
            return (
              <Link
                to={`/chat/${t.id}`}
                key={t.id}
                className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${t.id === activeId ? "bg-gray-100" : ""}`}
              >
                <p className="font-medium truncate text-gray-800">
                  {t.property_title || `Property #${t.property}`}
                </p>
                <p className="text-sm text-gray-500 truncate">{t.other_username}</p>

                {lastMessage && (
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatTime(lastMessage.timestamp || t.updated_at || new Date().toISOString())}</span>
                    </div>
                    {t.unread_count > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        {t.unread_count > 99 ? '99+' : t.unread_count} unread
                      </span>
                    )}
                  </div>
                )}

                {t.property_address && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin size={12} /> {t.property_address}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
