// src/pages/ChatContainer.tsx
import { Routes, Route } from "react-router-dom";
import ChatInbox from "./ChatInbox";
import ChatThread from "./ChatThread";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

export default function ChatContainer() {
  const [navHeight, setNavHeight] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    // Select the navbar element. Adjust selector if needed (e.g. '.navbar' instead of 'nav')
    const navEl = document.querySelector("nav");
    if (!navEl) return;

    // Initial measurement
    const rect = navEl.getBoundingClientRect();
    setNavHeight(rect.height);

    // Observe for size changes (e.g. responsive)
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
          setNavHeight(entry.contentRect.height);
        }
      });
      ro.observe(navEl);
      return () => {
        ro.unobserve(navEl);
      };
    }
  }, []);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    setShowSidebar(false);
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
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Content area: sidebar + main chat */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar - Thread List */}
        <aside className={`
          w-80 max-w-[80vw] border-r border-gray-200 bg-white flex-shrink-0
          lg:relative lg:translate-x-0 lg:z-auto
          ${showSidebar 
            ? 'fixed left-0 top-0 bottom-0 z-50 translate-x-0' 
            : 'fixed left-0 top-0 bottom-0 z-50 -translate-x-full lg:block'
          }
          transition-transform duration-300 ease-in-out
        `}>
          <div className="h-full flex flex-col">
            {/* Mobile close button */}
            <div className="lg:hidden p-4 border-b border-gray-200">
              <button 
                onClick={() => setShowSidebar(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInbox />
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header with menu button */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4">
            <button 
              onClick={() => setShowSidebar(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              ☰ Messages
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <Routes>
              <Route path="/" element={<ChatEmptyState />} />
              <Route path="/:id" element={<ChatThread />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.7-6M3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </div>
        <p className="text-gray-600 text-lg mb-2">Select a conversation to begin</p>
        <p className="text-gray-400 text-sm">Choose from your conversations on the left</p>
      </div>
    </div>
  );
}
