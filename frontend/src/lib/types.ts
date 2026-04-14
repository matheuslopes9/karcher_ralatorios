export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_master: boolean;
  avatar_url?: string;
  last_login?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface CreateUserInput {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  VIEWER: 'Leitura',
};

export const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'badge-warning',
  ADMIN: 'badge-info',
  VIEWER: 'badge-neutral',
};
