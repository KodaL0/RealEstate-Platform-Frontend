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
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Check if we're in a chat thread
  const isInThread = location.pathname.includes('/chat/') && location.pathname.split('/').length > 2;
  const isDesktop = window.innerWidth >= 1024; // lg breakpoint

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
      const newIsDesktop = window.innerWidth >= 1024;
      
      // On desktop, always show sidebar unless manually hidden
      if (newIsDesktop) {
        setShowSidebar(true);
      } else {
        // On mobile, show sidebar only when not in thread
        setShowSidebar(!isInThread);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInThread]);

  // Handle back navigation on mobile
  const handleBackToInbox = () => {
    if (!isDesktop) {
      navigate('/chat');
    }
  };

  // Close sidebar when clicking outside (mobile only)
  const handleOverlayClick = () => {
    if (!isDesktop) {
      setShowSidebar(false);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-gray-50"
      style={{ 
        top: `${navHeight}px`,
        height: `calc(100vh - ${navHeight}px)` 
      }}
    >
      {/* Mobile sidebar overlay */}
      {!isDesktop && showSidebar && isInThread && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOverlayClick}
        />
      )}

      {/* Content area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar - Inbox */}
        <aside className={`
          w-full lg:w-80 lg:max-w-none border-r border-gray-200 bg-white flex-shrink-0
          ${isDesktop
            ? 'relative z-auto' // Desktop: always visible
            : showSidebar 
              ? 'fixed left-0 top-0 bottom-0 z-50' // Mobile: overlay when visible
              : 'fixed left-0 top-0 bottom-0 z-50 -translate-x-full' // Mobile: hidden
          }
          transition-transform duration-300 ease-in-out
        `}>
          <div className="h-full flex flex-col">
            {/* Mobile header with close button - only show on mobile when in thread */}
            {!isDesktop && isInThread && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close messages"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              <ChatInbox />
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className={`
          flex-1 flex flex-col min-h-0 bg-white
          ${!isDesktop && !isInThread ? 'hidden' : 'flex'}
          ${!isDesktop && showSidebar && isInThread ? 'hidden' : ''}
        `}>
          {/* Mobile header for chat threads */}
          {!isDesktop && isInThread && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={handleBackToInbox}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
                aria-label="Back to messages"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Show messages list"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
            </div>
          )}

          {/* Desktop header with menu button (only when sidebar can be toggled) */}
          {isDesktop && (
            <div className="hidden lg:flex bg-white border-b border-gray-200 px-4 py-3 items-center gap-3 flex-shrink-0">
              <button 
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle messages sidebar"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
            </div>
          )}

          {/* Chat content */}
          <div className="flex-1 flex flex-col min-h-0">
            <Routes>
              <Route path="/" element={
                isDesktop ? <ChatEmptyState /> : <ChatInbox />
              } />
              <Route path="/:id" element={<ChatThread />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile floating action button for opening messages when in a thread */}
      {!isDesktop && isInThread && !showSidebar && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 z-30"
          aria-label="Open messages list"
        >
          <MessageCircle size={24} className="mx-auto" />
        </button>
      )}
    </div>
  );
}
