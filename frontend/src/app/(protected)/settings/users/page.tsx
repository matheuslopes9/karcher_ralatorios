'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Plus, Edit2, Ban, CheckCircle, Search, X, Shuffle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, roleLabels, roleColors } from '@/lib/types';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador', desc: 'Acesso total exceto configurações master' },
  { value: 'VIEWER', label: 'Leitura', desc: 'Somente visualização' },
];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface CreateForm {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: '', username: '', email: '', password: '', role: 'VIEWER', is_active: true,
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data || []);
    } catch {
      toast.error('Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.put(`/api/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`Usuário ${user.is_active ? 'desativado' : 'ativado'}`);
      loadUsers();
    } catch {
      toast.error('Falha ao atualizar usuário');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.email || !form.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/users', form);
      toast.success('Usuário criado com sucesso!');
      setShowModal(false);
      setForm({ name: '', username: '', email: '', password: '', role: 'VIEWER', is_active: true });
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleGenPassword = () => {
    const pwd = generatePassword();
    setForm(f => ({ ...f, password: pwd }));
    setShowPassword(true);
    navigator.clipboard?.writeText(pwd).then(() => toast.success('Senha copiada!'));
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 w-64 text-sm"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Username</th>
              <th>E-mail</th>
              <th>Tipo de Conta</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="spinner w-6 h-6 mx-auto mb-2" />
                  <span style={{ color: 'var(--text-muted)' }}>Carregando...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  {/* Nome */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--karcher-yellow)', color: '#0A0A0F' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user.name}
                      </span>
                    </div>
                  </td>
                  {/* Username */}
                  <td className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                    @{user.username}
                  </td>
                  {/* Email */}
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </td>
                  {/* Role */}
                  <td>
                    <span className={roleColors[user.role] || 'badge-neutral'}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  {/* Status */}
                  <td>
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--success)' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--error)' }}>
                        <Ban className="w-3.5 h-3.5" /> Inativo
                      </span>
                    )}
                  </td>
                  {/* Ações */}
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: user.is_active ? 'var(--error)' : 'var(--success)' }}
                        title={user.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {user.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Criar Novo Usuário
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="João Silva"
                  required
                />
              </div>

              {/* Username + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="joao.silva"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="joao@empresa.com"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Senha
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="input-field text-sm pr-9 w-full"
                      placeholder="Senha forte..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenPassword}
                    className="btn-secondary text-xs px-3 flex items-center gap-1.5 flex-shrink-0"
                    title="Gerar senha aleatória"
                  >
                    <Shuffle className="w-3.5 h-3.5" style={{ color: 'var(--karcher-yellow)' }} />
                    Gerar
                  </button>
                </div>
              </div>

              {/* Tipo de Conta */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className="flex flex-col gap-0.5 rounded-xl p-3 cursor-pointer transition-all"
                      style={{
                        background: form.role === opt.value ? 'rgba(255,209,0,0.08)' : 'var(--bg-elevated)',
                        border: `1px solid ${form.role === opt.value ? 'var(--karcher-yellow)' : 'var(--border)'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={form.role === opt.value}
                        onChange={() => setForm(f => ({ ...f, role: opt.value }))}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium" style={{ color: form.role === opt.value ? 'var(--karcher-yellow)' : 'var(--text-primary)' }}>
                        {opt.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ativo */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className="w-9 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer"
                  style={{ background: form.is_active ? 'var(--karcher-yellow)' : 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                    style={{
                      background: form.is_active ? '#0A0A0F' : 'var(--text-muted)',
                      transform: form.is_active ? 'translateX(18px)' : 'translateX(2px)',
                    }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Usuário ativo
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                >
                  {creating ? <div className="spinner w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
