import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// Import the custom fetchUser function from your auth.ts file
import { fetchUser as apiFetchUser } from "../middleware/auth";

// Define the User type (using number since TypeScript doesn't have "integer")
type User = {
  id: number;
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

  // Use the custom fetchUser from auth.ts which includes token handling
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchUser();
      // Check if the backend returns an object that contains a "user" property
      if (data && data.user) {
        setUser(data.user);
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

  // Expose refreshUser to let other parts of the app force a refresh
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

// Custom hook to use the UserContext in your components
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
