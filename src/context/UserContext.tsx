import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../config/api";

// Define the User type (using number since TypeScript doesn't have "integer")
type User = {
  id: number;
  username: string;
  email: string;
  is_developer?: boolean;
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  office?: string;
  avatar?: string;
  website?: string;
  email_verified?: boolean;
  email_verified_at?: string;
  date_joined?: string;
};

// Define the context type
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  updateUserData: (userData: Partial<User>) => void;
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

  // Direct API call without auth.ts wrapper
  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await api.auth.getUser();
      console.log("UserContext: Response from API:", response.data);
      
      // Extract user data from API response
      const userData = response.data.user || response.data;
      if (userData) {
        console.log("Setting user from API response:", userData);
        setUser(userData);
      } else {
        console.log("No valid user data found in response");
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

  // Update user data without fetching from server (for local updates)
  const updateUserData = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, refreshUser, updateUserData }}>
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
