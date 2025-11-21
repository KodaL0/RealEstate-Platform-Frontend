import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { ChatProvider } from "./context/ChatContext";
import { ImageCacheProvider } from "./context/ImageCacheContext";
import { UserProvider } from "./context/UserContext";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
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
  </StrictMode>,
);
