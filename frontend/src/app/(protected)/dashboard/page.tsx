'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, CheckCircle, Activity, Zap, RefreshCw } from 'lucide-react';

interface Overview {
  total_results: number;
  completed_count: number;
  completion_rate: number;
  avg_duration: number;
  vs_yesterday: number;
}

interface DayStat { date: string; count: number; }
interface FieldStat { field: string; count: number; }

interface Analytics {
  total_results: number;
  completion_rate: number;
  avg_duration: number;
  per_day: DayStat[];
  top_answers: FieldStat[];
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview>({
    total_results: 0, completed_count: 0, completion_rate: 0, avg_duration: 0, vs_yesterday: 0,
  });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => { load(); }, [period]);

  const load = async () => {
    setLoading(true);
    try {
      const [ovRes, anRes] = await Promise.all([
        api.get('/api/dashboard/overview'),
        api.get(`/api/analytics/summary?period=${period}`),
      ]);
      setOverview(ovRes.data);
      setAnalytics(anRes.data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const maxDay = Math.max(...(analytics?.per_day?.map(d => d.count) || [1]), 1);
  const maxField = Math.max(...(analytics?.top_answers?.map(f => f.count) || [1]), 1);

  return (
    <div className="space-y-5">

      {/* Header com período e refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['daily','weekly','monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {p === 'daily' ? 'Hoje' : p === 'weekly' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Atualizado {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button onClick={load} className="btn-secondary p-2" title="Atualizar">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <p className="metric-label">Total de Respostas</p>
            <div className="metric-icon"><Activity className="w-5 h-5" style={{ color: 'var(--info)' }} /></div>
          </div>
          <p className="metric-value">{loading ? '—' : overview.total_results.toLocaleString('pt-BR')}</p>
          {overview.vs_yesterday !== 0 && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: overview.vs_yesterday >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {overview.vs_yesterday >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {overview.vs_yesterday >= 0 ? '+' : ''}{overview.vs_yesterday.toFixed(1)}% vs ontem
            </span>
          )}
        </div>

        {/* Completados */}
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <p className="metric-label">Completados</p>
            <div className="metric-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
            </div>
          </div>
          <p className="metric-value">{loading ? '—' : overview.completed_count.toLocaleString('pt-BR')}</p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {overview.total_results > 0 ? `${((overview.completed_count / overview.total_results) * 100).toFixed(1)}% do total` : '—'}
          </span>
        </div>

        {/* Taxa */}
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <p className="metric-label">Taxa de Conclusão</p>
            <div className="metric-icon"><Zap className="w-5 h-5" style={{ color: 'var(--karcher-yellow)' }} /></div>
          </div>
          <p className="metric-value">{loading ? '—' : `${overview.completion_rate.toFixed(1)}%`}</p>
          <div className="progress-bar mt-1">
            <div className="progress-bar-fill" style={{ width: `${overview.completion_rate}%` }} />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Volume por dia */}
        <div className="card">
          <p className="section-title mb-1">Volume por Dia</p>
          <p className="section-subtitle mb-4">
            {period === 'daily' ? 'Últimas 24h' : period === 'weekly' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
            {analytics && ` · ${analytics.total_results} respostas`}
          </p>
          {!loading && analytics?.per_day && analytics.per_day.length > 0 ? (
            <div className="flex items-end gap-1 h-40">
              {analytics.per_day.slice(-30).map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max((d.count / maxDay) * 140, 4)}px`,
                      background: d.count === maxDay ? 'var(--karcher-yellow)' : 'rgba(255,209,0,0.35)',
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                    <div className="rounded px-2 py-1 text-xs whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      {new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: {d.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Carregando...' : 'Sem dados no período'}
              </p>
            </div>
          )}
        </div>

        {/* Top campos respondidos */}
        <div className="card">
          <p className="section-title mb-1">Campos Mais Respondidos</p>
          <p className="section-subtitle mb-4">Variáveis coletadas pelo bot</p>
          {!loading && analytics?.top_answers && analytics.top_answers.length > 0 ? (
            <div className="space-y-3">
              {analytics.top_answers.slice(0, 8).map((f) => (
                <div key={f.field} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-28 truncate capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {f.field}
                  </span>
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${(f.count / maxField) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold w-8 text-right" style={{ color: 'var(--text-primary)' }}>
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Carregando...' : 'Sem dados ainda'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Funil completados x incompletos */}
      <div className="card">
        <p className="section-title mb-1">Funil de Conversão</p>
        <p className="section-subtitle mb-5">Total geral desde o início da coleta</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Iniciados */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Iniciaram</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {overview.total_results.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>100%</p>
          </div>
          {/* Completados */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--success)' }}>Completaram</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>
              {overview.completed_count.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--success)' }}>
              {overview.total_results > 0 ? `${overview.completion_rate.toFixed(1)}%` : '—'}
            </p>
          </div>
          {/* Abandonaram */}
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--error)' }}>Abandonaram</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--error)' }}>
              {(overview.total_results - overview.completed_count).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
              {overview.total_results > 0 ? `${(100 - overview.completion_rate).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
