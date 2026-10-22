
import { apiRequest } from './client';

interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  currency: string;
  createdAt?: string;
}

function saveAuth(response: AuthResponse): AuthUser {
  localStorage.setItem('sub_graveyard_token', response.token);

  const user: AuthUser = {
    id: response._id,
    name: response.name,
    email: response.email,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem('sub_graveyard_user', JSON.stringify(user));

  return user;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return saveAuth(response);
}

export async function signup(
  email: string,
  password: string,
  name?: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: name?.trim() || email.split('@')[0],
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  return saveAuth(response);
}

export function logout(): void {
  localStorage.removeItem('sub_graveyard_token');
  localStorage.removeItem('sub_graveyard_user');
}
