'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2, Shield } from 'lucide-react';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await api.get('/api/auth/sessions');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await api.put('/api/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Falha ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/api/auth/sessions/${sessionId}`);
      toast.success('Sessão revogada');
      loadSessions();
    } catch (error) {
      toast.error('Falha ao revogar sessão');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Revogar todas as outras sessões?')) return;
    
    try {
      await api.delete('/api/auth/sessions/all');
      toast.success('Todas as sessões foram revogadas');
      loadSessions();
    } catch (error) {
      toast.error('Falha ao revogar sessões');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Trocar Senha */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Trocar Senha</h3>
        </div>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres: maiúscula, minúscula, número e especial
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* Sessões Ativas */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sessões Ativas</h3>
          <button onClick={handleRevokeAllSessions} className="text-sm text-red-600 hover:text-red-700">
            Revogar todas
          </button>
        </div>
        
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma sessão ativa</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {session.user_agent || 'Dispositivo desconhecido'}
                  </p>
                  <p className="text-xs text-gray-500">
                    IP: {session.ip_address || 'N/A'} • 
                    {' '}Criada em: {new Date(session.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
