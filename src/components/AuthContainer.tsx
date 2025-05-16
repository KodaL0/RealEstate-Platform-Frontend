// project/src/components/AuthContainer.tsx
import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../middleware/authContext';
import { login, register, logout, getProtectedData } from '../middleware/auth';

interface AuthContainerProps {
  onAuthComplete?: () => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthComplete }) => {
  const { user, setUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        const data = await login(email, password);
        console.log("Login response:", data);
        if (data && data.message === 'Login successful') {
          // Fetch complete user details from the protected endpoint
          const userData = await getProtectedData();
          console.log("Protected data:", userData);
          if (userData && userData.id) {
            setUser(userData);
            onAuthComplete?.();
          } else {
            setError('Login succeeded but fetching user data failed.');
          }
        } else {
          setError('Login failed. Please check your credentials.');
        }
      } else {
        // Registration flow
        const data = await register(username, email, password);
        console.log("Register response:", data);
        if (data && data.message && data.message.toLowerCase().includes('registered')) {
          // Auto-login after successful registration
          const loginData = await login(email, password);
          console.log("Login after registration response:", loginData);
          if (loginData && loginData.message === 'Login successful') {
            const userData = await getProtectedData();
            console.log("Protected data after registration:", userData);
            if (userData && userData.id) {
              setUser(userData);
              onAuthComplete?.();
            } else {
              setError('Registration succeeded but fetching user data failed.');
            }
          } else {
            setError('Auto-login after registration failed.');
          }
        } else {
          // Check for specific errors
          if (data && data.error && data.error === 'Email already exists') {
            setError('This email is already registered. You can log in instead.');
            // Optionally switch to login mode after a delay
            setTimeout(() => setMode('login'), 2000);
          } else if (data && data.error && data.error === 'Username already exists') {
            setError('This username is already taken. Please choose another one.');
          } else {
            setError('Registration failed. Please try again.');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      onAuthComplete?.();
    } catch (err) {
      console.error(err);
    }
  };

  if (user) {
    return (
      <div className="flex flex-col items-start space-y-2">
        <h2 className="font-semibold text-lg">Welcome, {user.name}!</h2>
        <button onClick={handleLogout} className="btn btn-primary bg-red-600 hover:bg-red-700">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="font-semibold text-lg">{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        {mode === 'register' && (
          <div className="flex flex-col">
            <label className="text-sm font-medium">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        )}
        <div className="flex flex-col">
          <label className="text-sm font-medium">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="btn btn-primary">
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
      <div className="text-sm">
        {mode === 'login' ? (
          <p>
            Don't have an account?{' '}
            <button onClick={() => setMode('register')} className="underline text-blue-600">
              Register here.
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button onClick={() => setMode('login')} className="underline text-blue-600">
              Login here.
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthContainer;
