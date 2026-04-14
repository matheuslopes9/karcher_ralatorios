'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, Filter, TrendingUp, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field"
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Taxa de Conclusão</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : `${summary?.completion_rate?.toFixed(1) || 0}%`}
          </p>
          <p className="text-sm text-gray-500 mt-1">Média do período</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total de Resultados</h3>
            <BarChart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : summary?.total_results?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">No período selecionado</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Abandono Médio</h3>
            <Filter className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? '...' : `${((1 - (summary?.completion_rate || 0) / 100) * 100).toFixed(1)}%`}
          </p>
          <p className="text-sm text-gray-500 mt-1">Taxa de abandono</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume por período */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Volume por {period === 'daily' ? 'Dia' : period === 'weekly' ? 'Semana' : 'Mês'}
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Gráfico de barras - Recharts</p>
          </div>
        </div>

        {/* Distribuição de respostas */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Respostas por Campo
          </h3>
          <div className="space-y-3">
            {[
              { field: 'Nome', count: 234 },
              { field: 'Email', count: 198 },
              { field: 'Telefone', count: 156 },
              { field: 'Empresa', count: 123 },
            ].map((item) => (
              <div key={item.field} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.field}</span>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(item.count / 234) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abandono por etapa */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Abandono por Etapa do Bot
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Funil de conversão - Recharts</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Volume ao Longo do Tempo
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Gráfico de linha - Recharts</p>
          </div>
        </div>
      </div>

      {/* Comparativo de períodos */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparativo de Períodos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Período A (atual)</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {summary?.total_results || 0} resultados
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Taxa: {summary?.completion_rate?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">Período B (anterior)</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">-</p>
            <p className="text-sm text-gray-700 mt-1">Selecione para comparar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
