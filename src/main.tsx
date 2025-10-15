import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { ChatProvider } from './context/ChatContext';
import { UserProvider } from './context/UserContext';
import { ImageCacheProvider } from './context/ImageCacheContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ImageCacheProvider>
        <UserProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </UserProvider>
      </ImageCacheProvider>
    </HelmetProvider>
  </StrictMode>
);
