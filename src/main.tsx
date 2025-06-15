import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ChatProvider } from './context/ChatContext';
import { UserProvider } from './context/UserContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </UserProvider>
  </StrictMode>
);
