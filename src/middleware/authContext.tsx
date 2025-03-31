import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  // Add other fields as needed
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // On mount, try to fetch the protected endpoint to keep the user logged in if tokens are valid.
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/protected`, {
          method: 'GET',
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          // Expecting a user object { id, name, email }
          if (data && data.id) {
            setUser(data);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user on mount:', error);
        setUser(null);
      }
    };

    fetchUser();
  }, [API_URL]);

  const value = { user, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
