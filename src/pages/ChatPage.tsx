// src/pages/ChatPage.tsx
import { Outlet } from "react-router-dom";
import ChatInbox from "./ChatInbox";

// This component wraps the sidebar + chat pane, offsetting below the navbar
// without modifying the navbar itself.
export default function ChatPage() {
  return (
    // Push down by 4rem (64px) to sit below a navbar of height h-16.
    // Constrain total height to viewport minus navbar, and hide overflow at this level.
    <div className="flex h-full pt-16 overflow-hidden">
      {/* Sidebar: fill full height of this container, scroll internally */}
      <div className="w-80 h-full border-r border-gray-200 bg-white hidden lg:block">
        <ChatInbox />
      </div>

      {/* Main chat area: fill remaining width & height, flex column, internal scroll */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* The Outlet will render ChatEmptyState or ChatThread */}
        <Outlet />
      </div>
    </div>
  );
}
