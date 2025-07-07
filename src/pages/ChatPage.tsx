import { Outlet } from "react-router-dom";
import ChatInbox from "./ChatInbox";

export default function ChatPage() {
  return (
    // Correct: apply pt-16 to the whole container
    <div className="flex h-full pt-16 overflow-hidden">
      {/* Sidebar: fill full height */}
      <div className="w-80 h-full border-r border-gray-200 bg-white hidden lg:block">
        <ChatInbox />
      </div>

      {/* Main chat area: fill remaining width & height */}
      <div className="flex h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
