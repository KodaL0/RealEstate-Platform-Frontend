import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

// Define the User type
type User = {
  id: string;
  username: string;
  email: string;
};

// Define the context type
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define UserProvider props
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<{ user: User }>("https://propertprobackend.onrender.com/api/users/get_user", {
        withCredentials: true, // Send cookies with request
      });

      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Move refreshUser outside of useEffect
  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
