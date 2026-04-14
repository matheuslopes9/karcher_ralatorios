'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { access_token, refresh_token, user } = response.data;
      login(user, access_token, refresh_token);
      window.location.href = '/dashboard';
    } catch (error: any) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.error;

      if (status === 401) {
        setErrorMsg('Usuário ou senha incorretos. Verifique suas credenciais.');
      } else if (status === 403) {
        setErrorMsg(serverMsg || 'Usuário desativado. Entre em contato com o administrador.');
      } else if (status === 429) {
        setErrorMsg('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else if (!error.response) {
        setErrorMsg('Não foi possível conectar ao servidor. Tente novamente em instantes.');
      } else {
        setErrorMsg(serverMsg || 'Erro inesperado. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
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

      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Yellow glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(255, 209, 0, 0.04)' }}
      />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <Image
              src="/logo.png"
              alt="Kärcher"
              width={180}
              height={72}
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Plataforma de monitoramento
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Entrar na sua conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                  className="input-field pl-9"
                  placeholder="Digite seu usuário"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  className="input-field pl-9 pr-10"
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#FCA5A5',
                }}
              >
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-sm font-bold tracking-wide"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4" />
                    Entrando...
                  </span>
                ) : (
                  'ENTRAR'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Acesso restrito · UC Technology / Kärcher
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          © 2025 Kärcher Analytics. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
