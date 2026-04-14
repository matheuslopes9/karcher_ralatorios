'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AnswerField {
  key: string;
  value: string;
}

interface Result {
  id: string;
  result_id: string;
  created_at: string | null;
  is_completed: boolean;
  duration_secs: number;
  fields: AnswerField[];
}

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'Telefone',
  codigo_servico: 'Código de Serviço',
  numero_serie: 'Número de Série',
  modelo: 'Modelo',
  descricao: 'Descrição',
  cidade: 'Cidade',
  estado: 'Estado',
  cep: 'CEP',
  endereco: 'Endereço',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  data_compra: 'Data de Compra',
  nota_fiscal: 'Nota Fiscal',
  tipo_produto: 'Tipo de Produto',
  problema: 'Problema Relatado',
};

function formatLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function ResultCard({ result }: { result: Result }) {
  const [expanded, setExpanded] = useState(false);

  const date = result.created_at
    ? new Date(result.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  // Pick the most important fields to show as preview
  const previewKeys = ['nome', 'email', 'telefone', 'codigo_servico', 'numero_serie', 'modelo'];
  const previewFields = result.fields.filter(f => previewKeys.includes(f.key));
  const otherFields = result.fields.filter(f => !previewKeys.includes(f.key));

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Status */}
        <div className="flex-shrink-0">
          {result.is_completed ? (
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
          ) : (
            <XCircle className="w-4 h-4" style={{ color: 'var(--error)' }} />
          )}
        </div>

        {/* Date */}
        <span className="text-xs flex-shrink-0 w-32" style={{ color: 'var(--text-muted)' }}>
          {date}
        </span>

        {/* Preview fields */}
        <div className="flex-1 flex flex-wrap gap-x-5 gap-y-1 min-w-0">
          {previewFields.length > 0 ? (
            previewFields.map(f => (
              <span key={f.key} className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>{formatLabel(f.key)}:</span>
                {f.value}
              </span>
            ))
          ) : (
            result.fields.slice(0, 3).map(f => (
              <span key={f.key} className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>{formatLabel(f.key)}:</span>
                {f.value}
              </span>
            ))
          )}
          {result.fields.length === 0 && (
            <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Sem dados coletados</span>
          )}
        </div>

        {/* Expand toggle */}
        {result.fields.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-1 rounded-lg transition-colors flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {result.fields.length}
          </button>
        )}
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
        >
          {result.fields.map(f => (
            <div key={f.key} className="flex flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {formatLabel(f.key)}
              </span>
              <span className="text-sm break-words" style={{ color: 'var(--text-primary)' }}>
                {f.value || '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const limit = 15;

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('completed', statusFilter);

      const response = await api.get(`/api/results?${params.toString()}`);
      setResults(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleStatusChange = (v: string) => {
    setPage(1);
    setStatusFilter(v);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nome, e-mail..."
              className="input-field pl-8 w-56 text-sm"
            />
          </div>
          <button onClick={handleSearch} className="btn-secondary text-xs py-2 px-3">
            Buscar
          </button>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input-field pl-8 pr-8 text-sm appearance-none"
            >
              <option value="">Todos</option>
              <option value="true">Completados</option>
              <option value="false">Incompletos</option>
            </select>
          </div>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {total.toLocaleString('pt-BR')} resultado{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto mb-3" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div
          className="flex items-center justify-center py-20 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {search || statusFilter ? 'Nenhum resultado encontrado para os filtros aplicados.' : 'Nenhum resultado coletado ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column header */}
          <div className="flex items-center gap-4 px-4 py-1">
            <div className="w-4 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide w-32 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Data/Hora</span>
            <span className="text-xs font-semibold uppercase tracking-wide flex-1" style={{ color: 'var(--text-muted)' }}>Dados Coletados</span>
          </div>

          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              Próximo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
