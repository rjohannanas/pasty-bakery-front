'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, TrendingUp } from 'lucide-react';
import type { Optimization } from '@/lib/api';

export default function HistoryPage() {
  const router = useRouter();
  const [results, setResults] = useState<Optimization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getResults();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[v0] Fetch history error:', error);
      toast.error('No se pudo cargar el historial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResult = (result: Optimization) => {
    router.push(`/history/${result.id}`);
  };

  const handleExportCSV = (result: Optimization) => {
    try {
      const escapeField = (value: unknown) => {
        const str = String(value ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csv = [
        ['Reporte de Optimización', ''].map(escapeField).join(','),
        ['Fecha', new Date(result.created_at).toLocaleString()].map(escapeField).join(','),
        ['Estado', result.status].map(escapeField).join(','),
        ['Ganancia esperada', String(result.total_profit)].map(escapeField).join(','),
        '',
        ['Producto', 'Cantidad', 'Lotes', 'Variedad'].map(escapeField).join(','),
      ];

      (result.results ?? []).forEach((row) => {
        csv.push(
          [
            row.product_name,
            String(row.quantity_to_produce),
            String(row.batch_active),
            (row.variety_flag ?? 0) > 0 ? 'Sí' : 'No',
          ]
            .map(escapeField)
            .join(',')
        );
      });

      const csvContent = csv.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimizacion-${result.id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Reporte exportado como CSV');
    } catch (error) {
      console.error('[v0] Export error:', error);
      toast.error('No se pudo exportar el reporte');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial de Optimizaciones</h1>
          <p className="text-muted-foreground mt-1">Ver y gestionar corridas anteriores</p>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">Cargando historial...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground text-lg">Todavía no hay historial</p>
            <Button onClick={() => router.push('/optimize')} className="mt-4 bg-primary hover:bg-primary/90">
              Correr primera optimización
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((result) => {
              const varieties = (result.results ?? []).filter((r) => (r.variety_flag ?? 0) > 0).length;
              const productCount = (result.results ?? []).length;
              return (
                <div
                  key={result.id}
                  className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(result.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-lg font-semibold text-foreground">
                            Ganancia esperada: ${result.total_profit?.toFixed(2) ?? '0.00'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Variedades: </span>
                            <span className="font-semibold text-foreground">{varieties}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Productos: </span>
                            <span className="font-semibold text-foreground">{productCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estado: </span>
                            <span
                              className={`font-semibold ${
                                result.status === 'done'
                                  ? 'text-green-600'
                                  : result.status === 'error'
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewResult(result)}
                          variant="outline"
                          className="border-primary/50 text-primary hover:bg-primary/10"
                        >
                          Ver Detalle
                        </Button>
                        <Button onClick={() => handleExportCSV(result)} variant="outline" size="sm">
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
