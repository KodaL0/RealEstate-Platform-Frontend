// src/pages/ChatContainer.tsx
import { Routes, Route } from "react-router-dom";
import ThreadList from "./ThreadList";
import ChatThread from "./ChatThread";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

export default function ChatContainer() {
  const [navHeight, setNavHeight] = useState(0);

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

  // Inline style to push below navbar and limit height to viewport minus navbar
  const containerStyle: React.CSSProperties = {
    paddingTop: navHeight,
    height: `calc(100vh - ${navHeight}px)`,
  };

  return (
    <div style={containerStyle} className="flex flex-col bg-gray-50">
      {/* Content area: sidebar + main chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Thread List */}
        <aside className="w-80 border-r border-gray-200 bg-white hidden lg:block">
          <ThreadList />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatEmptyState />} />
            <Route path="/:id" element={<ChatThread />} />
          </Routes>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <Footer />
      </footer>
    </div>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Select a conversation to begin.</p>
    </div>
  );
}
