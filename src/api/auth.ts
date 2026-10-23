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
  // YAHAN CHANGE KIYA HAI: localStorage -> sessionStorage
  sessionStorage.setItem('sub_graveyard_token', response.token);

  const user: AuthUser = {
    id: response._id,
    name: response.name,
    email: response.email,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };

  // YAHAN CHANGE KIYA HAI: localStorage -> sessionStorage
  sessionStorage.setItem('sub_graveyard_user', JSON.stringify(user));

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
  // YAHAN CHANGE KIYA HAI: localStorage -> sessionStorage
  sessionStorage.removeItem('sub_graveyard_token');
  sessionStorage.removeItem('sub_graveyard_user');
}

export async function forgotPassword(email: string) {
  return await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  return await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function deleteAccount() {
  return await apiRequest('/auth/delete-account', {
    method: 'DELETE',
  });
}