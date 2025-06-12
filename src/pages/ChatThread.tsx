import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { Message } from "../types";
import { apiClient } from "../config/api";
import { useUser } from "../context/UserContext";
import { Send, MoreVertical, Phone, Video, Info, ArrowLeft, User } from "lucide-react";

export default function ChatThread() {
  const { id } = useParams<{ id: string }>();
  const { messages, sendMessage, threads } = useChat();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    if (messages[id]) {
      setLocalMsgs(messages[id]);
      return;
    }
    apiClient.get<Message[]>(`chat/${id}/messages/`).then((res) => setLocalMsgs(res.data));
  }, [id, messages]);

  useEffect(() => {
    if (id && messages[id]) {
      setLocalMsgs(messages[id]);
    }
  }, [messages, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMsgs]);

  const thread = threads.find((t) => t.id === id);

  const recipientId: number | null = thread
    ? thread.user1 === user?.id
      ? thread.user2
      : thread.user1
    : localMsgs[0]
    ? localMsgs[0].sender === user?.id
      ? localMsgs[0].recipient
      : localMsgs[0].sender
    : null;

  const propertyId: number | null = thread
    ? thread.property
    : localMsgs[0]?.property_id ?? null;

  const handleSend = () => {
    if (!input.trim() || !id || !user || !recipientId || !propertyId) return;
    sendMessage(id, recipientId, propertyId, input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const groupedMessages = localMsgs.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = formatDate(message.timestamp || new Date().toISOString());
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="pt-[64px] h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="lg:hidden text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-medium text-sm text-gray-800">Property Inquiry</h2>
            <p className="text-xs text-gray-500">Property ID: {propertyId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Phone size={16} className="text-gray-600 hover:text-blue-600 cursor-pointer" />
          <Video size={16} className="text-gray-600 hover:text-blue-600 cursor-pointer" />
          <Info size={16} className="text-gray-600 hover:text-blue-600 cursor-pointer" />
          <MoreVertical size={16} className="text-gray-600 hover:text-gray-800 cursor-pointer" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 text-sm">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-2">
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{date}</span>
            </div>
            {dateMessages.reverse().map((message, index) => {
              const isOwn = message.sender === user?.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl shadow-sm ${isOwn ? "bg-blue-600 text-white" : "bg-white border"}`}>
                    {message.content}
                    <div className="text-[10px] text-gray-400 mt-1 text-right">
                      {formatTime(message.timestamp || new Date().toISOString())}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-200" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-2">
        <div className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            placeholder="Type your message..."
            style={{
              minHeight: "36px",
              height: Math.min(Math.max(36, input.split("\n").length * 18 + 18), 120) + "px",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !recipientId || !propertyId}
            className={`p-2 rounded-full ${
              input.trim() && recipientId && propertyId
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
          <span>Enter to send • Shift + Enter = newline</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div> Online
          </span>
        </div>
      </div>
    </div>
  );
}
