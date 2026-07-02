'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { OptimizationStatus } from '@/components/optimize/optimization-status';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OptimizePage() {
  const router = useRouter();
  const { user, setCurrentOptimization, optimizationStatus, setOptimizationStatus } = useAppStore();
  const [stock, setStock] = useState<Record<string, number>>({
    harina: 50,
    azucar: 30,
    mantequilla: 20,
  });
  const [resources, setResources] = useState<Record<string, number>>({
    horno: 8,
    amasadora: 8,
    labor: 16,
  });
  const [targetProduction, setTargetProduction] = useState(100);
  const [minVariety, setMinVariety] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleOptimize = async () => {
    setIsLoading(true);
    setOptimizationStatus('running');
    toast.loading('Running optimization...');

    try {
      const result = await apiClient.runOptimization({
        daily_stock: stock,
        available_resources: resources,
        target_production: targetProduction,
        min_variety: minVariety,
      });

      setCurrentOptimization(result);
      setOptimizationStatus('completed');
      toast.success('Optimization completed successfully!');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      setOptimizationStatus('failed');
      console.error('[v0] Optimization error:', error);
      toast.error('Optimization failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Run Optimization</h1>
          <p className="text-muted-foreground mt-1">Configure daily parameters and run the optimization algorithm</p>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Daily Stock</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(stock).map(([ingredient, value]) => (
                  <div key={ingredient} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {ingredient} (kg)
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setStock({ ...stock, [ingredient]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Available Resources</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(resources).map(([resource, value]) => (
                  <div key={resource} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {resource} (hours)
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setResources({ ...resources, [resource]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Optimization Parameters</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Target Production Volume</label>
                  <input
                    type="number"
                    value={targetProduction}
                    onChange={(e) => setTargetProduction(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Minimum Variety Required</label>
                  <input
                    type="number"
                    value={minVariety}
                    onChange={(e) => setMinVariety(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                  />
                </div>
              </div>
            </div>

            {optimizationStatus === 'running' && <OptimizationStatus isRunning={true} />}

            <Button
              onClick={handleOptimize}
              disabled={isLoading || optimizationStatus === 'running'}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                'Run Optimization'
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
