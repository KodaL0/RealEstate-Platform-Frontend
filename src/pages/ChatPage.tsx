import { Outlet } from "react-router-dom";
import ThreadList from "./ThreadList";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ThreadList />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
} 