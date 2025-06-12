import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

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
    <button className="btn btn-primary" onClick={handleClick}>
      Chat with seller
    </button>
  );
};

export default ChatButton; 