import { Outlet } from "react-router-dom";
import ChatInbox from "./ChatInbox";

export default function ChatPage() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: fill full height */}
      <div className="w-80 h-full border-r border-gray-200 bg-white hidden lg:block">
        <ChatInbox />
      </div>

      {/* Main chat area: expand & fill remaining width */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
