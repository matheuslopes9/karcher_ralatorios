'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Play, Copy, Trash2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/api/reports');
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (reportId: string) => {
    try {
      await api.post(`/api/reports/${reportId}/generate`);
      toast.success('Relatório gerado com sucesso!');
      loadReports();
    } catch (error) {
      toast.error('Falha ao gerar relatório');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) return;
    
    try {
      await api.delete(`/api/reports/${reportId}`);
      toast.success('Relatório excluído com sucesso');
      loadReports();
    } catch (error) {
      toast.error('Falha ao excluir relatório');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Relatórios Salvos</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Relatório
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado por</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última geração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formato</th>
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
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nenhum relatório criado. Clique em "Novo Relatório" para começar.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    {report.description && (
                      <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {report.created_by_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {report.last_generated
                      ? new Date(report.last_generated).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                      {report.format_default}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerate(report.id)}
                        className="text-green-600 hover:text-green-700"
                        title="Gerar agora"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-700"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de criação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Criar Novo Relatório
            </h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Relatório
                </label>
                <input type="text" className="input-field" placeholder="Ex: Relatório Semanal" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea className="input-field" rows={3} placeholder="Descrição opcional..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período Início
                  </label>
                  <input type="date" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período Fim
                  </label>
                  <input type="date" className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato Padrão
                </label>
                <div className="flex gap-4">
                  {['xlsx', 'csv', 'pdf', 'json', 'xml'].map((format) => (
                    <label key={format} className="flex items-center gap-2">
                      <input type="radio" name="format" value={format} defaultChecked={format === 'xlsx'} />
                      <span className="text-sm uppercase">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
