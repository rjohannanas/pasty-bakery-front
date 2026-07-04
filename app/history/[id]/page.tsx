'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type Optimization } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ResultsTable } from '@/components/dashboard/results-table';
import { ResourceChart } from '@/components/dashboard/resource-chart';
import { ProfitChart } from '@/components/dashboard/profit-chart';
import { ExportButton } from '@/components/dashboard/export-button';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, ChevronDown } from 'lucide-react';

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<Optimization | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    const id = Number(params.id);
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getResults(id);
        setResult(data);
      } catch (error) {
        console.error('[v0] Error loading result detail:', error);
        toast.error('No se pudo cargar el detalle de la optimización');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.id]);

  const loadLogs = async () => {
    if (!result) return;
    if (logsExpanded) {
      setLogsExpanded(false);
      return;
    }
    setLogsExpanded(true);
    if (logs !== null) return;
    try {
      setLogsLoading(true);
      const entries = await apiClient.getLogs(result.job_id);
      const logText = (entries ?? [])
        .map((l) => {
          const header = `[${l.level}] ${l.message}${l.duration_ms != null ? ` (${l.duration_ms}ms)` : ''}`;
          const sections = [header];
          if (l.model_generated) sections.push(`--- Modelo generado ---\n${l.model_generated}`);
          if (l.lingo_output) sections.push(`--- Salida de LINGO ---\n${l.lingo_output}`);
          return sections.join('\n\n');
        })
        .join('\n\n' + '='.repeat(60) + '\n\n');
      setLogs(logText || 'No hay logs disponibles');
    } catch (error) {
      console.error('[v0] Error loading logs:', error);
      toast.error('No se pudieron cargar los logs de LINGO');
    } finally {
      setLogsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-muted-foreground">Cargando detalle...</div>
      </MainLayout>
    );
  }

  if (!result) {
    return (
      <MainLayout>
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground text-lg mb-4">No se encontró esa optimización</p>
          <Button onClick={() => router.push('/history')} className="bg-primary hover:bg-primary/90">
            Volver al historial
          </Button>
        </div>
      </MainLayout>
    );
  }

  const varieties = (result.results ?? []).filter((r) => (r.variety_flag ?? 0) > 0).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/history')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Optimización #{result.id}</h1>
              <p className="text-muted-foreground mt-1">
                {new Date(result.created_at).toLocaleString()} — estado: {result.status}
              </p>
            </div>
          </div>
          <ExportButton data={result} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Ganancia esperada"
            value={`$${result.total_profit?.toFixed(2) ?? '0.00'}`}
            icon={BarChart3}
            color="bg-primary"
          />
          <KPICard title="Variedades producidas" value={varieties.toString()} icon={BarChart3} color="bg-accent" />
          <KPICard
            title="Estado"
            value={result.status.charAt(0).toUpperCase() + result.status.slice(1)}
            icon={BarChart3}
            color="bg-green-600"
          />
        </div>

        <div id="dashboard-export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResourceChart data={result} />
            <ProfitChart data={result} />
          </div>
          <ResultsTable data={result} />
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <Button
            onClick={loadLogs}
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            disabled={logsLoading}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${logsExpanded ? 'rotate-180' : ''}`} />
            <span>{logsExpanded ? 'Ocultar' : 'Ver'} Logs de LINGO</span>
          </Button>

          {logsExpanded && (
            <div className="mt-2 p-3 bg-muted rounded font-mono text-xs overflow-auto max-h-96">
              {logsLoading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : logs ? (
                <pre className="whitespace-pre-wrap break-words text-muted-foreground">{logs}</pre>
              ) : (
                <p className="text-muted-foreground">No hay logs disponibles</p>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
