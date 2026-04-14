'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, Clock, CheckCircle, Activity, Zap } from 'lucide-react';

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
    } catch {
      // silently fail — show zeros
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const metrics = [
    {
      label: 'Total de Resultados',
      value: isLoading ? '—' : overview.total_results.toLocaleString('pt-BR'),
      icon: Activity,
      iconColor: 'var(--info)',
      iconBg: 'rgba(59,130,246,0.1)',
      footer: overview.vs_yesterday !== 0 && (
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: overview.vs_yesterday >= 0 ? 'var(--success)' : 'var(--error)' }}>
          {overview.vs_yesterday >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {overview.vs_yesterday >= 0 ? '+' : ''}{overview.vs_yesterday}% vs ontem
        </span>
      ),
    },
    {
      label: 'Completados',
      value: isLoading ? '—' : overview.completed_count.toLocaleString('pt-BR'),
      icon: CheckCircle,
      iconColor: 'var(--success)',
      iconBg: 'rgba(34,197,94,0.1)',
      footer: (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {overview.total_results > 0
            ? `${((overview.completed_count / overview.total_results) * 100).toFixed(1)}% do total`
            : '0% do total'}
        </span>
      ),
    },
    {
      label: 'Taxa de Conclusão',
      value: isLoading ? '—' : `${overview.completion_rate.toFixed(1)}%`,
      icon: Zap,
      iconColor: 'var(--karcher-yellow)',
      iconBg: 'rgba(255,209,0,0.1)',
      footer: (
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${overview.completion_rate}%` }} />
        </div>
      ),
    },
    {
      label: 'Tempo Médio',
      value: isLoading ? '—' : formatDuration(overview.avg_duration),
      icon: Clock,
      iconColor: 'var(--warning)',
      iconBg: 'rgba(245,158,11,0.1)',
      footer: (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>por interação</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="metric-card">
              <div className="flex items-start justify-between">
                <p className="metric-label">{m.label}</p>
                <div className="metric-icon" style={{ background: m.iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: m.iconColor }} />
                </div>
              </div>
              <p className="metric-value">{m.value}</p>
              {m.footer && <div>{m.footer}</div>}
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="section-title mb-1">Resultados por Dia</p>
          <p className="section-subtitle mb-4">Últimos 30 dias</p>
          <div
            className="h-56 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gráfico de barras — Recharts</p>
          </div>
        </div>

        <div className="card">
          <p className="section-title mb-1">Funil de Conversão</p>
          <p className="section-subtitle mb-4">Por etapa do bot</p>
          <div
            className="h-56 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Funil — Recharts</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <p className="section-title mb-1">Heatmap de Atividade</p>
        <p className="section-subtitle mb-4">Volume por hora e dia da semana</p>
        <div
          className="h-40 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Heatmap — em desenvolvimento</p>
        </div>
      </div>
    </div>
  );
}
