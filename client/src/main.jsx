import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Clear cookies and call logout API if in development mode (fresh start every time)
if (import.meta.env.MODE === "development" && localStorage.getItem("DEV_CLEAR_COOKIES") !== "false") {
  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/;`);
  });
  
  // Call logout endpoint to ensure backend clears session
  fetch("http://localhost:5001/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => console.log("Logout API call completed"));
  
  console.log("🧹 Development mode: Cleared authentication cookies");
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
