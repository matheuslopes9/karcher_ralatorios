'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Eye, Download, Search, Filter } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadResults();
  }, [page]);

  const loadResults = async () => {
    try {
      const response = await api.get(`/api/results?page=${page}&limit=50`);
      setResults(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="input-field pl-8 w-52 text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pl-8 pr-8 text-sm appearance-none"
            >
              <option value="">Todos os status</option>
              <option value="true">Completados</option>
              <option value="false">Incompletos</option>
            </select>
          </div>
        </div>
        <button className="btn-primary text-sm py-2 px-4">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data/Hora</th>
              <th>Status</th>
              <th>Duração</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  <div className="spinner w-6 h-6 mx-auto mb-2" />
                  Carregando...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              results.map((result: any) => (
                <tr key={result.id}>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {result.id?.slice(0, 8)}...
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {result.created_at ? new Date(result.created_at).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td>
                    {result.is_completed ? (
                      <span className="badge-success">Completado</span>
                    ) : (
                      <span className="badge-warning">Incompleto</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {result.duration_secs
                      ? `${Math.floor(result.duration_secs / 60)}m ${result.duration_secs % 60}s`
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {results.length} de {total.toLocaleString('pt-BR')} resultados
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Anterior
          </button>
          <span
            className="flex items-center px-3 text-xs rounded-lg"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 50 >= total}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
