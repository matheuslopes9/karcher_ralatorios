'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [overview, setOverview] = useState({
    total_results: 0,
    completed_count: 0,
    completion_rate: 0,
    avg_duration: 0,
    vs_yesterday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await api.get('/api/dashboard/overview');
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to load overview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Resultados */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Resultados</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '...' : overview.total_results.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {overview.vs_yesterday >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              overview.vs_yesterday >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {overview.vs_yesterday >= 0 ? '+' : ''}{overview.vs_yesterday}% vs ontem
            </span>
          </div>
        </div>

        {/* Completados */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completados</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '...' : overview.completed_count.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {isLoading ? '...' : `${((overview.completed_count / overview.total_results) * 100).toFixed(1)}% do total`}
            </p>
          </div>
        </div>

        {/* Taxa de Conclusão */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '...' : `${overview.completion_rate.toFixed(1)}%`}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${overview.completion_rate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tempo Médio</p>
              <p className="text-3xl font-bold text-gray-900">
                {isLoading ? '...' : formatDuration(overview.avg_duration)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">por interação</p>
          </div>
        </div>
      </div>

      {/* Gráficos (placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resultados por dia */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resultados por Dia (30 dias)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Gráfico será implementado com Recharts</p>
          </div>
        </div>

        {/* Funil de Conversão */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Funil de Conversão
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Funil será implementado com Recharts</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Heatmap de Atividade por Hora/Dia
        </h3>
        <div className="h-48 flex items-center justify-center text-gray-400">
          <p>Heatmap será implementado</p>
        </div>
      </div>
    </div>
  );
}
