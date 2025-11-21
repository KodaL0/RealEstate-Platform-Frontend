// src/pages/ChatContainer.tsx

import { ArrowLeft, Menu, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import ChatInbox from "./ChatInbox";
import ChatThread from "./ChatThread";

// Empty state component for when no chat is selected on desktop
function ChatEmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle size={32} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Messages</h2>
        <p className="text-gray-600 mb-6">
          Select a conversation from the sidebar to start chatting, or create a new conversation.
        </p>
        <div className="space-y-3 text-sm text-gray-500">
          <p>💬 Chat about properties with sellers</p>
          <p>📧 Send direct messages to other users</p>
          <p>🔔 Get notifications for new messages</p>
        </div>
      </div>
    </div>
  );
}

// Mobile Chat Thread Wrapper Component
function MobileChatThread() {
  const navigate = useNavigate();

  const handleBackToInbox = () => {
    navigate("/chat");
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Mobile Chat Header with Back Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button
          onClick={handleBackToInbox}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
          aria-label="Back to messages"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
      </div>

      {/* Mobile Thread Content */}
      <div className="flex-1 min-h-0">
        <ChatThread />
      </div>
    </div>
  );
}

export default function ChatContainer() {
  const [showSidebar, setShowSidebar] = useState(true);
  // Initialize mobile state based on current window size
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Handle responsive behavior with proper state management
  useEffect(() => {
    const handleResize = () => {
      const currentIsMobile = window.innerWidth < 1024;
      setIsMobile(currentIsMobile);

      if (!currentIsMobile) {
        // Desktop: always show sidebar
        setShowSidebar(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar (desktop only)
  const toggleSidebar = () => {
    if (!isMobile) {
      setShowSidebar((prev) => !prev);
    }
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 flex flex-col bg-gray-50 chat-container"
      style={{
        top: "var(--navbar-height)",
        height: "auto",
      }}
    >
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Layout - Use Routes at the top level */}
        {isMobile ? (
          <div className="w-full h-full">
            <Routes>
              <Route path="/" element={<ChatInbox />} />
              <Route path="/:id" element={<MobileChatThread />} />
            </Routes>
          </div>
        ) : (
          /* Desktop Layout */
          <>
            {/* Desktop Sidebar - Inbox */}
            <aside
              className={`
              w-80 border-r border-gray-200 bg-white flex-shrink-0 transition-all duration-300 chat-sidebar
              ${showSidebar ? "translate-x-0" : "-translate-x-full"}
            `}
            >
              <div className="h-full flex flex-col overflow-hidden">
                <ChatInbox />
              </div>
            </aside>

            {/* Desktop Main Chat Area */}
            <main className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden chat-main">
              {/* Desktop header with menu button */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle messages sidebar"
                >
                  <Menu size={20} />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
              </div>

              {/* Desktop Chat content */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Routes>
                  <Route path="/" element={<ChatEmptyState />} />
                  <Route path="/:id" element={<ChatThread />} />
                </Routes>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
