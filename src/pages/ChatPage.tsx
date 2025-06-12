import { Outlet } from "react-router-dom";
import ThreadList from "./ThreadList";

export default function ChatPage() {
  return (
    // Constrain height and hide overflow so the page itself won't scroll.
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar: ensure it fills height and scrolls internally */}
      <div className="w-80 border-r border-gray-200 bg-white hidden lg:block">
        <ThreadList />
      </div>

      {/* Main chat area: flex column, internal scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
