import { post } from "../apiClient/apiClient";

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  avatar?: {
    url: string;
    alt?: string;
  };
  banner?: {
    url: string;
    alt?: string;
  };
};

export type LoginBody = {
  email: string;
  password: string;
};

export type AuthResponse = {
  data: {
    name: string;
    email: string;
    avatar?: string | null;
    banner?: string | null;
    accessToken: string;
  };
  meta?: any;
};

export async function registerUser(body: RegisterBody) {
  return post<AuthResponse>("/auth/register", body);
}

export async function loginUser(body: LoginBody) {
  return post<AuthResponse>("/auth/login", body);
}
