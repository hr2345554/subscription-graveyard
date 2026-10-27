import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// 🌟 TanStack Query Imports
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🌟 QueryClient initialize karo (Caching aur settings ke sath)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Window switch karne par bar bar API call na ho
      staleTime: 5 * 60 * 1000,    // 5 minute tak data fresh maane
      retry: 1,                    // Agar API fail ho toh 1 baar retry kare
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 🌟 Poori App ko QueryClientProvider mein wrap kar diya */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);