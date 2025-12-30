import { useEffect, useRef } from "react";
import { useParams, useLocation, Outlet } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import ChatInbox from "./ChatInbox";

export default function ChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const location = useLocation();
  const { threads, markThreadRead } = useChat();

  const lastHandledPath = useRef<string | null>(null);

  useEffect(() => {
    // Prevent re-running for same route
    if (lastHandledPath.current === location.pathname) return;
    lastHandledPath.current = location.pathname;

    // Case 1: open specific thread
    if (threadId) {
      markThreadRead(threadId);
      return;
    }

    // Case 2: open inbox
    if (location.pathname === "/chat") {
      threads.forEach((t) => {
        if (t.unread_count > 0) {
          markThreadRead(t.id);
        }
      });
    }
  }, [threadId, location.pathname, threads, markThreadRead]);

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
