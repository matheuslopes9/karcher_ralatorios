'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
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
      style={{
        background: 'linear-gradient(135deg, #020c16 0%, #060f1a 40%, #091827 70%, #0b2035 100%)',
      }}
    >
      {/* Radial glow center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(79,156,249,0.09) 0%, transparent 70%)',
        }}
      />

      {/* Subtle top-left orb */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79,156,249,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Subtle bottom-right orb */}
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(26,53,93,0.6) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(79,156,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(79,156,249,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div className="relative w-full max-w-sm px-4 z-10">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center mb-5 rounded-2xl p-4"
            style={{
              background: 'rgba(79,156,249,0.07)',
              border: '1px solid rgba(79,156,249,0.15)',
              boxShadow: '0 0 40px rgba(79,156,249,0.08)',
            }}
          >
            <Image
              src="/favicon.png"
              alt="UCTechnology Analytics"
              width={120}
              height={120}
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            UCTechnology Analytics
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Plataforma de monitoramento WhatsApp
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(160deg, rgba(14,30,48,0.95) 0%, rgba(11,28,46,0.98) 100%)',
            border: '1px solid var(--border)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,156,249,0.06)',
          }}
        >
          <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
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
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.25)',
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
              Acesso restrito · UCTechnology Analytics / Kärcher
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          UCTechnology Copyright © 2010 - {new Date().getFullYear()} Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
