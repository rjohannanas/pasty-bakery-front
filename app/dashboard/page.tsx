'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ResultsTable } from '@/components/dashboard/results-table';
import { ResourceChart } from '@/components/dashboard/resource-chart';
import { ProfitChart } from '@/components/dashboard/profit-chart';
import { ExportButton } from '@/components/dashboard/export-button';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { currentOptimization, setCurrentOptimization } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentOptimization) return;
    (async () => {
      try {
        setIsLoading(true);
        const all = await apiClient.getResults();
        const latest = Array.isArray(all) ? all.find((r) => r.status === 'done') : null;
        if (latest) {
          const full = await apiClient.getResults(latest.id);
          setCurrentOptimization(full);
        }
      } catch (error) {
        console.error('[v0] Error loading latest result:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentOptimization, setCurrentOptimization]);

  const profit = currentOptimization?.total_profit ?? 0;
  const varieties = currentOptimization?.results?.filter((r) => (r.variety_flag ?? 0) > 0).length ?? 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-muted-foreground">Cargando resultado más reciente...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Producción</h1>
          {currentOptimization && <ExportButton data={currentOptimization} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Ganancia esperada"
            value={`$${profit.toFixed(2)}`}
            icon={BarChart3}
            color="bg-primary"
          />
          <KPICard title="Variedades producidas" value={varieties.toString()} icon={BarChart3} color="bg-accent" />
          <KPICard
            title="Estado"
            value="Completado"
            icon={BarChart3}
            color="bg-green-600"
          />
        </div>

        {currentOptimization && (
          <>
            <div id="dashboard-export" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResourceChart data={currentOptimization} />
                <ProfitChart data={currentOptimization} />
              </div>

              <ResultsTable data={currentOptimization} />
            </div>
          </>
        )}

        {!currentOptimization && (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">Sin resultados de optimización</p>
            <Button
              onClick={() => router.push('/optimize')}
              className="bg-primary hover:bg-primary/90"
            >
              Correr Optimización
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
