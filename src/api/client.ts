const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // YAHAN CHANGE KIYA HAI: localStorage ki jagah sessionStorage
  const token = sessionStorage.getItem('sub_graveyard_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
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