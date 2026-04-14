'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Eye, Download } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadResults();
  }, [page]);

  const loadResults = async () => {
    try {
      const response = await api.get(`/api/results?page=${page}&limit=50`);
      setResults(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Export */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            className="input-field w-64"
          />
          <select className="input-field">
            <option value="">Todos os status</option>
            <option value="true">Completados</option>
            <option value="false">Incompletos</option>
          </select>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              results.map((result: any) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{result.id?.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {result.created_at ? new Date(result.created_at).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      result.is_completed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.is_completed ? '✅ Completado' : '⏳ Incompleto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {result.duration_secs ? `${Math.floor(result.duration_secs / 60)}m ${result.duration_secs % 60}s` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mostrando {results.length} de {total} resultados
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 50 >= total}
            className="btn-secondary disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
