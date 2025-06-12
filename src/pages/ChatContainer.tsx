// src/pages/ChatContainer.tsx
import { Routes, Route } from "react-router-dom";
import ThreadList from "./ThreadList";
import ChatThread from "./ChatThread";
import { MessageCircle } from "lucide-react";
import Footer from "../components/Footer"; // make sure this path is correct

export default function ChatContainer() {
  return (
    // flex-col stacks content area and footer.
    // pt-16 pushes everything below a navbar of height h-16 (4rem = 64px).
    // h-screen makes the container 100vh tall; the inner flex areas will size accordingly.
    <div className="flex flex-col h-screen pt-16 bg-gray-50">
      
      {/* Content area: sidebar + main chat */}
      {/* flex-1 + overflow-hidden ensures this area fills remaining height and children manage scrolling */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Thread List (hidden on smaller screens) */}
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

      {/* Footer: appears at bottom of viewport if content short, or after scrolling if content tall */}
      <footer className="border-t border-gray-200 bg-white">
        <Footer />
      </footer>
    </div>
  );
}

function ChatEmptyState() {
  return (
    // flex-1 ensures this fills the available main area if no chat selected
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MessageCircle size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to PropertyPro Chat
        </h2>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Select a conversation from the sidebar to start chatting about properties, or connect with property owners and agents.
        </p>
        <div className="mt-8">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            Browse Properties
          </button>
        </div>
      </div>
    </div>
  );
}
