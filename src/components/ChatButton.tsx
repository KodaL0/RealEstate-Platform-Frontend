import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";
import { MessageSquare } from "lucide-react";

interface Props {
  sellerId: number;
  propertyId: number;
  title: string;
}

const ChatButton: React.FC<Props> = ({ sellerId, propertyId, title }) => {
  const { getOrCreateThread } = useChat();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const threadId = await getOrCreateThread(sellerId, propertyId, title);
    navigate(`/chat/${threadId}`);
  };

  return (
    <button
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      onClick={handleClick}
    >
      <MessageSquare className="w-5 h-5" />
      Message
    </button>
  );
};

export default ChatButton;
