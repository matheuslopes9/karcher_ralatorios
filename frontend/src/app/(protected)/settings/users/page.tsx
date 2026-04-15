'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Plus, Edit2, Trash2, Ban, CheckCircle, Search, X, Shuffle, Eye, EyeOff } from 'lucide-react';
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

interface UserForm {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
}

const emptyForm: UserForm = { name: '', username: '', email: '', password: '', role: 'VIEWER', is_active: true };

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<UserForm>(emptyForm);
  const [showCreatePwd, setShowCreatePwd] = useState(false);

  // Edit modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserForm>>({});
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // ── Create ──────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.username || !createForm.email || !createForm.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/users', createForm);
      toast.success('Usuário criado com sucesso!');
      setShowCreate(false);
      setCreateForm(emptyForm);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleGenPassword = (target: 'create') => {
    const pwd = generatePassword();
    if (target === 'create') {
      setCreateForm(f => ({ ...f, password: pwd }));
      setShowCreatePwd(true);
    }
    navigator.clipboard?.writeText(pwd).then(() => toast.success('Senha copiada!'));
  };

  // ── Edit ────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, is_active: user.is_active });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.put(`/api/users/${editingUser.id}`, editForm);
      toast.success('Usuário atualizado!');
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ────────────────────────────────
  const handleToggleActive = async (user: User) => {
    try {
      await api.put(`/api/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`Usuário ${user.is_active ? 'desativado' : 'ativado'}`);
      loadUsers();
    } catch {
      toast.error('Falha ao atualizar usuário');
    }
  };

  // ── Delete ───────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.delete(`/api/users/${deletingUser.id}`);
      toast.success('Usuário excluído');
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao excluir usuário');
    } finally {
      setDeleting(false);
    }
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
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2 px-4">
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
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--uc-accent)', color: '#fff' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                    @{user.username}
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </td>
                  <td>
                    <span className={roleColors[user.role] || 'badge-neutral'}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
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
                  <td>
                    <div className="flex items-center gap-1">
                      {/* Editar */}
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10"
                        style={{ color: 'var(--uc-accent)' }}
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Ativar / Desativar */}
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: user.is_active ? 'var(--warning)' : 'var(--success)' }}
                        title={user.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {user.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      {/* Excluir — apenas SUPER_ADMIN */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--error)' }}
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Criar Usuário ───────────────────── */}
      {showCreate && (
        <Modal title="Criar Novo Usuário" onClose={() => { setShowCreate(false); setCreateForm(emptyForm); }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Nome Completo">
              <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className="input-field text-sm" placeholder="João Silva" required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Username">
                <input type="text" value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                  className="input-field text-sm" placeholder="joao.silva" required />
              </Field>
              <Field label="E-mail">
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field text-sm" placeholder="joao@empresa.com" required />
              </Field>
            </div>

            <Field label="Senha">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showCreatePwd ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="input-field text-sm pr-9 w-full"
                    placeholder="Senha forte..."
                    required
                  />
                  <button type="button" onClick={() => setShowCreatePwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showCreatePwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button type="button" onClick={() => handleGenPassword('create')}
                  className="btn-secondary text-xs px-3 flex items-center gap-1.5 flex-shrink-0" title="Gerar senha">
                  <Shuffle className="w-3.5 h-3.5" style={{ color: 'var(--uc-accent)' }} />
                  Gerar
                </button>
              </div>
            </Field>

            <RoleSelector value={createForm.role} onChange={v => setCreateForm(f => ({ ...f, role: v }))} />
            <ToggleActive value={createForm.is_active} onChange={v => setCreateForm(f => ({ ...f, is_active: v }))} />

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setCreateForm(emptyForm); }} className="btn-secondary text-sm py-2 px-4">Cancelar</button>
              <button type="submit" disabled={creating} className="btn-primary text-sm py-2 px-4">
                {creating ? <div className="spinner w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                Criar Usuário
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Editar Usuário ─────────────────── */}
      {editingUser && (
        <Modal title={`Editar: ${editingUser.name}`} onClose={() => setEditingUser(null)}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Field label="Nome Completo">
              <input type="text" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="input-field text-sm" placeholder="Nome completo" required />
            </Field>

            <Field label="E-mail">
              <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                className="input-field text-sm" placeholder="email@empresa.com" required />
            </Field>

            <RoleSelector value={editForm.role || 'VIEWER'} onChange={v => setEditForm(f => ({ ...f, role: v }))} />
            <ToggleActive value={editForm.is_active ?? true} onChange={v => setEditForm(f => ({ ...f, is_active: v }))} />

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary text-sm py-2 px-4">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-4">
                {saving ? <div className="spinner w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Confirmar Exclusão ─────────────── */}
      {deletingUser && (
        <Modal title="Excluir Usuário" onClose={() => setDeletingUser(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Tem certeza que deseja excluir o usuário{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{deletingUser.name}</span>?
              Essa ação não pode ser desfeita.
            </p>
            <div
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span>O usuário e todos seus dados de acesso serão removidos.</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setDeletingUser(null)} className="btn-secondary text-sm py-2 px-4">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger text-sm py-2 px-4">
                {deleting ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

function RoleSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tipo de Conta</label>
      <div className="grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map(opt => (
          <label key={opt.value} className="flex flex-col gap-0.5 rounded-xl p-3 cursor-pointer transition-all" style={{
            background: value === opt.value ? 'rgba(59,130,246,0.10)' : 'var(--bg-elevated)',
            border: `1px solid ${value === opt.value ? 'var(--uc-accent)' : 'var(--border)'}`,
          }}>
            <input type="radio" name="role" value={opt.value} checked={value === opt.value}
              onChange={() => onChange(opt.value)} className="sr-only" />
            <span className="text-sm font-medium" style={{ color: value === opt.value ? 'var(--uc-accent)' : 'var(--text-primary)' }}>
              {opt.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ToggleActive({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => onChange(!value)}>
      <div className="w-9 h-5 rounded-full transition-colors flex-shrink-0 relative"
        style={{ background: value ? 'var(--uc-accent)' : 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{ background: value ? '#fff' : 'var(--text-muted)', transform: value ? 'translateX(18px)' : 'translateX(2px)' }} />
      </div>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Usuário ativo</span>
    </label>
  );
}
