export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'VIEWER';
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
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'VIEWER';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'VIEWER';
  is_active?: boolean;
}

export const roleLabels: Record<User['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  ANALYST: 'Analista',
  VIEWER: 'Visualizador',
};

export const roleColors: Record<User['role'], string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  ANALYST: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};
