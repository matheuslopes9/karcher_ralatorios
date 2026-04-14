import { create } from 'zustand';
import { User } from './types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      // Cookie para o middleware Next.js conseguir ler server-side
      document.cookie = `access_token=${accessToken}; path=/; max-age=900; SameSite=Lax`;
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      // Remove cookie
      document.cookie = 'access_token=; path=/; max-age=0';
    }
    set({ user: null, isAuthenticated: false });
  },
  
  updateUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },
}));

// Inicializar estado do auth
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('user');
  const token = localStorage.getItem('access_token');
  
  if (storedUser && token) {
    useAuthStore.setState({
      user: JSON.parse(storedUser),
      isAuthenticated: true,
      isLoading: false,
    });
  } else {
    useAuthStore.setState({ isLoading: false });
  }
}
