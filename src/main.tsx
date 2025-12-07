import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { PresenceProvider } from "./contexts/PresenceContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <PresenceProvider>
      <App />
    </PresenceProvider>
  </QueryClientProvider>
);
