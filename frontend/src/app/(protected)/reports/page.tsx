'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  FileSpreadsheet,
  FileText,
  File,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DayStat { date: string; count: number; }
interface FieldStat { field: string; count: number; }
interface ReportRow {
  created_at: string;
  is_completed: boolean;
  fields: Record<string, string>;
}

interface Summary {
  from: string;
  to: string;
  total_results: number;
  completed_count: number;
  incomplete_count: number;
  completion_rate: number;
  per_day: DayStat[];
  top_fields: FieldStat[];
  rows: ReportRow[];
}

const PERIODS = [
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
  { label: 'Personalizado', value: 'custom' },
];

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome', email: 'E-mail', telefone: 'Telefone', cpf: 'CPF', cnpj: 'CNPJ',
  codigo_servico: 'Cód. Serviço', numero_serie: 'Nº Série', modelo: 'Modelo',
  tipo_produto: 'Tipo Produto', problema: 'Problema', descricao: 'Descrição',
  data_compra: 'Data Compra', nota_fiscal: 'NF', cidade: 'Cidade', estado: 'UF',
};
const fieldLabel = (k: string) =>
  FIELD_LABELS[k] ?? k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PREVIEW_COLS = ['nome', 'email', 'telefone', 'codigo_servico', 'numero_serie', 'modelo'];
const TABLE_PAGE_SIZE = 10;

function buildParams(period: string, from: string, to: string) {
  const p = new URLSearchParams({ period });
  if (period === 'custom') { p.set('from', from); p.set('to', to); }
  return p.toString();
}

// ── Custom date range picker ─────────────────────────────────────────────────
function DateRangePicker({
  from, to, onApply,
}: {
  from: string; to: string; onApply: (from: string, to: string) => void;
}) {
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  // default: last 7 days if empty
  useEffect(() => {
    if (!localFrom) {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setLocalFrom(d.toISOString().slice(0, 10));
    }
    if (!localTo) {
      setLocalTo(new Date().toISOString().slice(0, 10));
    }
  }, []);

  return (
    <div
      className="flex items-end gap-3 p-4 rounded-xl"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Data inicial
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            value={localFrom}
            max={localTo || undefined}
            onChange={e => setLocalFrom(e.target.value)}
            className="input-field pl-8 text-sm"
            style={{ colorScheme: 'dark', minWidth: '150px' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Data final
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            value={localTo}
            min={localFrom || undefined}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setLocalTo(e.target.value)}
            className="input-field pl-8 text-sm"
            style={{ colorScheme: 'dark', minWidth: '150px' }}
          />
        </div>
      </div>

      <button
        onClick={() => { if (localFrom && localTo) onApply(localFrom, localTo); }}
        disabled={!localFrom || !localTo}
        className="btn-primary text-sm py-2 px-4"
      >
        Aplicar
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('7d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);

  const load = useCallback(async () => {
    if (period === 'custom' && (!from || !to)) return;
    setLoading(true);
    setTablePage(1);
    try {
      const res = await api.get(`/api/reports/summary?${buildParams(period, from, to)}`);
      setSummary(res.data);
    } catch {
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, [period, from, to]);

  useEffect(() => { load(); }, [load]);

  const handleApplyCustom = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(format);
    try {
      const params = buildParams(period, from, to);
      const res = await api.get(`/api/export/${format}?${params}`, { responseType: 'blob' });
      const mimeMap: Record<string, string> = {
        csv: 'text/csv',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
      };
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeMap[format] }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `karcher-relatorio.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exportado como ${format.toUpperCase()}`);
    } catch {
      toast.error(`Falha ao exportar ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const maxDay = Math.max(...(summary?.per_day?.map(d => d.count) || [1]), 1);
  const maxField = Math.max(...(summary?.top_fields?.map(f => f.count) || [1]), 1);

  const visibleCols = summary?.rows
    ? (() => {
        const present = new Set<string>();
        summary.rows.forEach(r => Object.keys(r.fields || {}).forEach(k => present.add(k)));
        const ordered = PREVIEW_COLS.filter(k => present.has(k));
        present.forEach(k => { if (!ordered.includes(k)) ordered.push(k); });
        return ordered.slice(0, 5);
      })()
    : [];

  const totalTablePages = summary ? Math.ceil(summary.rows.length / TABLE_PAGE_SIZE) : 0;
  const pagedRows = summary?.rows.slice((tablePage - 1) * TABLE_PAGE_SIZE, tablePage * TABLE_PAGE_SIZE) ?? [];

  const periodLabel = summary
    ? `${new Date(summary.from).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} — ${new Date(summary.to).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    : '';

  const canExport = !exporting && !loading && !!summary?.total_results;

  return (
    <div className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Period selector */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.value ? 'btn-primary' : 'btn-secondary'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <DateRangePicker from={from} to={to} onApply={handleApplyCustom} />
          )}
        </div>

        {/* Export + refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={load} className="btn-secondary p-2" title="Atualizar">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={!canExport}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Exportar CSV"
          >
            {exporting === 'csv' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={!canExport}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Exportar Excel"
          >
            {exporting === 'xlsx' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!canExport}
            className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Exportar PDF"
          >
            {exporting === 'pdf' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <File className="w-3.5 h-3.5" />}
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerando relatório...</p>
          </div>
        </div>
      ) : !summary ? null : (
        <>
          {periodLabel && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Período: <span style={{ color: 'var(--text-secondary)' }}>{periodLabel}</span>
            </p>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card">
              <p className="metric-label">Total de Respostas</p>
              <p className="metric-value">{summary.total_results.toLocaleString('pt-BR')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>no período</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Completados</p>
              <p className="metric-value" style={{ color: 'var(--success)' }}>
                {summary.completed_count.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {summary.total_results > 0 ? `${summary.completion_rate.toFixed(1)}% do total` : '—'}
              </p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Incompletos</p>
              <p className="metric-value" style={{ color: 'var(--error)' }}>
                {summary.incomplete_count.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {summary.total_results > 0 ? `${(100 - summary.completion_rate).toFixed(1)}% do total` : '—'}
              </p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Taxa de Conclusão</p>
              <p className="metric-value">{summary.completion_rate.toFixed(1)}%</p>
              <div className="progress-bar mt-2">
                <div className="progress-bar-fill" style={{ width: `${summary.completion_rate}%` }} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Volume por dia */}
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4" style={{ color: 'var(--karcher-yellow)' }} />
                <p className="section-title">Volume por Dia</p>
              </div>
              <p className="section-subtitle mb-4">{summary.per_day?.length || 0} dias com dados</p>
              {summary.per_day?.length > 0 ? (
                <div className="flex items-end gap-1 h-36">
                  {summary.per_day.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center group relative min-w-0">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max((d.count / maxDay) * 128, 3)}px`,
                          background: d.count === maxDay ? 'var(--karcher-yellow)' : 'rgba(255,209,0,0.35)',
                        }}
                      />
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="rounded px-2 py-1 text-xs whitespace-nowrap" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                          {new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: {d.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados no período</p>
                </div>
              )}
            </div>

            {/* Top campos */}
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--karcher-yellow)' }} />
                <p className="section-title">Campos Mais Respondidos</p>
              </div>
              <p className="section-subtitle mb-4">Cobertura por variável coletada</p>
              {summary.top_fields?.length > 0 ? (
                <div className="space-y-2.5">
                  {summary.top_fields.slice(0, 7).map((f) => (
                    <div key={f.field} className="flex items-center gap-3">
                      <span className="text-xs w-28 truncate" style={{ color: 'var(--text-secondary)' }}>
                        {fieldLabel(f.field)}
                      </span>
                      <div className="flex-1">
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${(f.count / maxField) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold w-8 text-right" style={{ color: 'var(--text-primary)' }}>{f.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail table */}
          {summary.rows?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-title">Detalhamento das Respostas</p>
                  <p className="section-subtitle">
                    {summary.rows.length.toLocaleString('pt-BR')} registros
                  </p>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Status</th>
                      {visibleCols.map(c => <th key={c}>{fieldLabel(c)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row, i) => (
                      <tr key={i}>
                        <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {row.created_at || '—'}
                        </td>
                        <td>
                          {row.is_completed ? (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--success)' }}>
                              <CheckCircle className="w-3 h-3" /> Completo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--error)' }}>
                              <XCircle className="w-3 h-3" /> Incompleto
                            </span>
                          )}
                        </td>
                        {visibleCols.map(c => (
                          <td key={c} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {row.fields?.[c] || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table pagination */}
              {totalTablePages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Página {tablePage} de {totalTablePages} · {summary.rows.length.toLocaleString('pt-BR')} registros
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>
                    <button
                      onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))}
                      disabled={tablePage >= totalTablePages}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      Próximo <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {summary.total_results === 0 && (
            <div className="flex items-center justify-center py-20 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum dado no período selecionado.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
