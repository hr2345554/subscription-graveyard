// Base URL (Vercel se aayega ya local fallback)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Smart logic: Agar URL ke end mein /api nahi hai, toh khud add kar dega
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // HttpOnly Cookie handle karegi, token ki zaroorat nahi hai

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Endpoint mein agar shuru mein '/' nahi hai, toh add kar dega
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${formattedEndpoint}`, {
    ...options,
    headers,
    credentials: 'include', // 🌟 SABSE ZAROORI (Cookie bhejne ke liye)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as { message?: string; error?: string }).message ||
        (data as { error?: string }).error ||
        `Request failed (${response.status})`
    );
  }

  return data as T;
};