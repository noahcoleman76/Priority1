import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AuthProvider } from "./features/auth/AuthContext";
import { AccentProvider } from "./features/settings/AccentContext";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AccentProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AccentProvider>
    </BrowserRouter>
  </StrictMode>
);
