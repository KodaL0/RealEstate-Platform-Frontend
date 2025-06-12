import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { RequireAuth } from "./RequireAuth";

interface Props {
  sellerId: number;
  propertyId: number;
  title: string;
}

const ChatButton: React.FC<Props> = ({ sellerId, propertyId, title }) => {
  const { getOrCreateThread } = useChat();
  const navigate = useNavigate();

  return (
    <RequireAuth>
      <button
        className="btn btn-primary"
        onClick={async () => {
          const threadId = await getOrCreateThread(sellerId, propertyId, title);
          navigate(`/chat/${threadId}`);
        }}
      >
        Chat with seller
      </button>
    </RequireAuth>
  );
};

export default ChatButton; 