import { Link, useParams } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { useEffect, useState, useRef } from "react";
import { Clock, MapPin } from "lucide-react";

export default function ThreadList() {
  const { threads, messages } = useChat();
  const { user } = useUser();
  const { id: activeId } = useParams<{ id: string }>();
  const [filteredThreads, setFilteredThreads] = useState(threads);

  // State to hold navbar height in px
  const [navHeight, setNavHeight] = useState(0);
  // Static sidebar width in px (e.g. 18rem = 18 * 16 = 288px). Adjust if your Tailwind w-72 differs.
  const SIDEBAR_WIDTH_PX = 288;

  useEffect(() => {
    setFilteredThreads(threads);
  }, [threads]);

  // Measure navbar height and listen for changes
  useEffect(() => {
    const navEl = document.querySelector("nav");
    if (!navEl) return;
    // Initial measurement
    setNavHeight(navEl.getBoundingClientRect().height);

    // If navbar might resize (e.g. responsive), observe it:
    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setNavHeight(entry.contentRect.height);
        }
      });
      ro.observe(navEl);
    }
    // Clean up
    return () => {
      if (ro && navEl) ro.unobserve(navEl);
    };
  }, []);

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

  // Inline style for fixed sidebar
  const sidebarStyle: React.CSSProperties = {
    position: "fixed",
    top: navHeight,       // push it below the navbar
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH_PX,
    backgroundColor: "white",
    borderRight: "1px solid #E5E7EB", // border-gray-200
    overflow: "hidden",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={sidebarStyle}>
      {/* Sidebar header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          borderBottom: "1px solid #E5E7EB",
          zIndex: 20,
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <img src="/logo.svg" alt="Logo" className="h-6" />
        <span className="text-blue-600 font-bold text-lg">PROPERTPRO</span>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
        }}
      >
        <h2 className="px-4 pt-3 pb-2 text-sm font-medium text-gray-600">
          Your Conversations
        </h2>
        <div className="space-y-1">
          {filteredThreads.map((t) => {
            const lastMessage = getLastMessage(t.id);
            return (
              <Link
                to={`/chat/${t.id}`}
                key={t.id}
                className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${
                  t.id === activeId ? "bg-gray-100" : ""
                }`}
              >
                <p className="font-medium truncate text-gray-800">
                  {t.property_title || `Property #${t.property}`}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {t.other_username}
                </p>

                {lastMessage && (
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>
                        {formatTime(
                          lastMessage.timestamp ||
                            t.updated_at ||
                            new Date().toISOString()
                        )}
                      </span>
                    </div>
                    {t.unread_count > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        {t.unread_count > 99 ? "99+" : t.unread_count} unread
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
