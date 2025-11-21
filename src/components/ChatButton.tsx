import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import analytics from "../utils/analytics";

interface Props {
  sellerId: number;
  itemId: number;
  itemType: "property" | "project" | "organization";
  title: string;
  // Legacy support - will be deprecated
  propertyId?: number;
}

const ChatButton: React.FC<Props> = ({
  sellerId,
  itemId,
  itemType = "property",
  title,
  propertyId, // legacy support
}) => {
  const { getOrCreateThread } = useChat();
  const { user } = useUser();
  const navigate = useNavigate();

  // Support legacy propertyId prop
  const effectiveItemId = propertyId ?? itemId;
  const effectiveItemType = propertyId ? "property" : itemType;

  const handleClick = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // Track chat initiation
    if (effectiveItemType === "property") {
      analytics.trackPropertyContact(String(effectiveItemId), "chat");
    }
    analytics.trackChatAction("initiate");

    // Call getOrCreateThread with appropriate IDs based on type
    const threadId = await getOrCreateThread(
      sellerId,
      effectiveItemType === "property" ? effectiveItemId : null,
      title,
      effectiveItemType === "project" ? effectiveItemId : null,
      effectiveItemType === "organization" ? effectiveItemId : null,
    );
    navigate(`/chat/${threadId}`);
  };

  return (
    <button
      type="button"
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      onClick={handleClick}
    >
      <MessageSquare className="w-5 h-5" />
      Message
    </button>
  );
};

export default ChatButton;
