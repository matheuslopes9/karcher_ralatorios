'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  FileText,
  FileOutput,
  Users,
  LogOut,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileOutput, label: 'Relatórios', href: '/reports' },
  { icon: FileText, label: 'Dados Coletados', href: '/results' },
];

const settingsItems = [
  { icon: Users, label: 'Usuários', href: '/settings/users', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await api.post('/api/auth/logout', { refresh_token: refreshToken });
    } catch {}
    finally {
      logout();
      toast.success('Até logo!');
      router.push('/login');
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <div className="spinner w-10 h-10 mx-auto" />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const currentLabel =
    menuItems.find((i) => pathname.startsWith(i.href))?.label ||
    settingsItems.find((i) => pathname.startsWith(i.href))?.label ||
    'Dashboard';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '14px',
          },
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex flex-col h-screen w-60 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--karcher-yellow)' }}
          >
            <Layers className="w-4 h-4" style={{ color: '#0A0A0F' }} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>KÄRCHER</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Analytics</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Menu
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Configurações
            </p>
            {settingsItems.map((item) => {
              if (item.roles && !item.roles.includes(user?.role || '')) return null;
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--karcher-yellow)', color: '#0A0A0F' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-danger w-full text-xs py-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-6"
          style={{
            paddingTop: '2.25rem',
            paddingBottom: '1rem',
            background: 'rgba(10,10,15,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {currentLabel}
          </h2>
        </header>

        {/* Page */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
