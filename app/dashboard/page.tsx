'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
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
  const { user, currentOptimization } = useAppStore();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  const profit = currentOptimization?.expected_profit ?? 0;
  const varieties = currentOptimization?.variety_flag ? Object.values(currentOptimization.variety_flag).filter(Boolean).length : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Production Dashboard</h1>
          {currentOptimization && <ExportButton data={currentOptimization} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Expected Profit"
            value={`$${profit.toFixed(2)}`}
            icon={BarChart3}
            trend="+12%"
            color="bg-primary"
          />
          <KPICard
            title="Varieties Produced"
            value={varieties.toString()}
            icon={BarChart3}
            color="bg-accent"
          />
          <KPICard
            title="Optimization Status"
            value="Completed"
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

            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Resource Utilization</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Oven Capacity</span>
                    <span className="font-semibold text-foreground">78%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Mixer Capacity</span>
                    <span className="font-semibold text-foreground">65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Labor Hours</span>
                    <span className="font-semibold text-foreground">82%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>
              </div>
            </div>

              <ResultsTable data={currentOptimization} />
            </div>
          </>
        )}

        {!currentOptimization && (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">No optimization results yet</p>
            <Button
              onClick={() => router.push('/optimize')}
              className="bg-primary hover:bg-primary/90"
            >
              Run Optimization
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
