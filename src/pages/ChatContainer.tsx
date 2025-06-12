import { Routes, Route } from "react-router-dom";
import ThreadList from "./ThreadList";
import ChatThread from "./ChatThread";
import { MessageCircle } from "lucide-react";

export default function ChatContainer() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Thread List */}
      <div className="w-80 border-r border-gray-200 bg-white hidden lg:block">
        <ThreadList />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<ChatEmptyState />} />
          <Route path="/:id" element={<ChatThread />} />
        </Routes>
      </div>
    </div>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MessageCircle size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to PropertyPro Chat</h2>
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
