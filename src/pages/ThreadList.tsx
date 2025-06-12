import { Link, useParams } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

export default function ThreadList() {
  const { threads } = useChat();
  const { user } = useUser();
  const { id: activeId } = useParams<{ id: string }>();

  return (
    <div className="w-72 border-r h-full overflow-y-auto">
      <h2 className="p-4 font-bold text-lg">Your Conversations</h2>
      {threads.map((t) => (
        <Link
          to={`/chat/${t.id}`}
          key={t.id}
          className={`block px-4 py-3 hover:bg-gray-50 border-b ${
            t.id === activeId ? "bg-gray-100" : ""
          }`}
        >
          <p className="font-medium truncate">{t.property_title}</p>
          <p className="text-sm text-gray-500 truncate">{t.other_username}</p>
          {t.unread_count > 0 && (
            <span className="text-xs text-blue-600">{t.unread_count} unread</span>
          )}
        </Link>
      ))}
    </div>
  );
} 