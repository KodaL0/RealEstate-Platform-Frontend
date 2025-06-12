import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";
import { Message, Thread } from "../types";
import { apiClient } from "../config/api";
import { useUser } from "../context/UserContext";

export default function ChatThread() {
  const { id } = useParams<{ id: string }>();
  const { messages, sendMessage, threads } = useChat();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Message[]>([]);

  // fetch once if not in context
  useEffect(() => {
    if (!id) return;
    if (messages[id]) {
      setLocalMsgs(messages[id]);
      return;
    }
    apiClient.get<Message[]>(`chat/${id}/messages/`).then((res) => setLocalMsgs(res.data));
  }, [id, messages]);

  // Update when new messages arrive via context
  useEffect(() => {
    if (id && messages[id]) {
      setLocalMsgs(messages[id]);
    }
  }, [messages, id]);

  const handleSend = () => {
    if (!input.trim() || !id || !user) return;

    // Determine recipient & property from existing msg or thread metadata
    let recipientId: number | null = null;
    let propertyId: number | null = null;

    if (localMsgs.length) {
      recipientId = localMsgs[0].sender === user.id ? localMsgs[0].recipient : localMsgs[0].sender;
      propertyId = localMsgs[0].property_id;
    } else {
      const thread: Thread | undefined = threads.find((t) => t.id === id);
      if (thread) {
        recipientId = thread.user1 === user.id ? thread.user2 : thread.user1;
        propertyId = thread.property;
      }
    }

    if (!recipientId || !propertyId) return;

    sendMessage(id, recipientId, propertyId, input.trim());
    setInput("");
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[80vh] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMsgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-sm p-2 rounded-lg ${m.sender === user?.id ? "bg-blue-600 text-white ml-auto" : "bg-gray-100"}`}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Type a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-lg">
          Send
        </button>
      </div>
    </div>
  );
} 