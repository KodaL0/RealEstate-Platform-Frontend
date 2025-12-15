import { Outlet, useParams } from "react-router-dom";
import { useEffect } from "react";
import ChatInbox from "./ChatInbox";
import { useChat } from "../context/ChatContext";

export default function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { markThreadRead, recalculateUnreadCounts } = useChat();

  useEffect(() => {
    if (threadId) {
      markThreadRead(threadId);
      recalculateUnreadCounts(); // safety net
    }
  }, [threadId, markThreadRead, recalculateUnreadCounts]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 h-full border-r border-gray-200 bg-white hidden lg:block">
        <ChatInbox />
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
