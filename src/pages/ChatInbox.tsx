import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

export default function ChatInbox() {
  const { threads } = useChat();
  const { user } = useUser();

  if (!user) return <p className="p-8">Loading…</p>;
  if (!threads.length) return <p className="p-8">No conversations yet.</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Your Conversations</h1>
      {threads.map((t) => {
        const otherUser = t.user1 === user.id ? t.user2 : t.user1;
        return (
          <Link
            key={t.id}
            to={`/chat/${t.id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <span>With user #{otherUser}</span>
              {t.unread_count > 0 && (
                <span className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {t.unread_count}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Listing #{t.property}</p>
          </Link>
        );
      })}
    </div>
  );
} 