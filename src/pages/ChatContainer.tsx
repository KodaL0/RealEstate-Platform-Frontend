// src/pages/ChatContainer.tsx
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import ChatInbox from "./ChatInbox";
import ChatThread from "./ChatThread";
import { useState, useEffect } from "react";
import { ArrowLeft, Menu, MessageCircle } from "lucide-react";

// Empty state component for when no chat is selected on desktop
function ChatEmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle size={32} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Welcome to Messages
        </h2>
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

export default function ChatContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [navHeight, setNavHeight] = useState(64); // Default navbar height
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Check if we're in a chat thread
  const isInThread = location.pathname.includes('/chat/') && location.pathname.split('/').length > 2;
  const isMobile = window.innerWidth < 1024; // lg breakpoint

  useEffect(() => {
    // Calculate navbar height dynamically
    const navEl = document.querySelector("nav");
    if (navEl) {
      const rect = navEl.getBoundingClientRect();
      setNavHeight(rect.height);

      // Observe for size changes
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(entries => {
          for (let entry of entries) {
            setNavHeight(entry.contentRect.height);
          }
        });
        ro.observe(navEl);
        return () => ro.unobserve(navEl);
      }
    }
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const currentIsMobile = window.innerWidth < 1024;
      
      if (!currentIsMobile) {
        // Desktop: always show sidebar
        setShowSidebar(true);
      }
      // Mobile: don't change sidebar state on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle back navigation on mobile
  const handleBackToInbox = () => {
    navigate('/chat');
  };

  // Toggle sidebar (desktop only)
  const toggleSidebar = () => {
    if (!isMobile) {
      setShowSidebar(prev => !prev);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-gray-50"
      style={{ 
        top: `${navHeight}px`,
        height: `calc(100vh - ${navHeight}px)` 
      }}
    >
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Layout */}
        {isMobile ? (
          <>
            {/* Mobile: Show inbox when not in thread, show thread when in thread */}
            {!isInThread ? (
              /* Mobile Inbox View */
              <div className="w-full h-full bg-white">
                <ChatInbox />
              </div>
            ) : (
              /* Mobile Thread View */
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
                  <Routes>
                    <Route path="/:id" element={<ChatThread />} />
                  </Routes>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop Layout */
          <>
            {/* Desktop Sidebar - Inbox */}
            <aside className={`
              w-80 border-r border-gray-200 bg-white flex-shrink-0 transition-all duration-300
              ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <ChatInbox />
                </div>
              </div>
            </aside>

            {/* Desktop Main Chat Area */}
            <main className="flex-1 flex flex-col min-h-0 bg-white">
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
              <div className="flex-1 flex flex-col min-h-0">
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
