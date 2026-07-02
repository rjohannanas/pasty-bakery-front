'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient, createWebSocketConnection } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { OptimizationStatus } from '@/components/optimize/optimization-status';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

export default function OptimizePage() {
  const router = useRouter();
  const { user, setCurrentOptimization, optimizationStatus, setOptimizationStatus } = useAppStore();
  const wsRef = useRef<WebSocket | null>(null);
  const jobIdRef = useRef<string | null>(null);

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
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [jobProgress, setJobProgress] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    // Setup WebSocket for job status updates
    wsRef.current = createWebSocketConnection(
      (data: any) => {
        console.log('[v0] WebSocket message:', data);
        
        if (data?.job_id) {
          jobIdRef.current = data.job_id;
        }

        if (data?.status) {
          const status = data.status as string;
          setJobStatus(status);
          setJobProgress(data.progress || 0);

          if (status === 'pending') {
            toast.loading('Optimization queued...');
          } else if (status === 'processing') {
            toast.loading(`Processing... ${Math.round(data.progress || 0)}%`);
          } else if (status === 'done') {
            toast.success('Optimization completed successfully!');
            if (data.result) {
              setCurrentOptimization(data.result);
            }
            setOptimizationStatus('completed');
            setTimeout(() => router.push('/dashboard'), 1500);
          } else if (status === 'error' || status === 'cancelled') {
            toast.error(`Optimization ${status}: ${data.error || 'Unknown error'}`);
            setOptimizationStatus('failed');
          }
        }
      },
      (error) => {
        console.error('[v0] WebSocket error:', error);
        toast.error('Connection error');
      }
    );

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [router, setCurrentOptimization, setOptimizationStatus]);

  const handleOptimize = async () => {
    setIsLoading(true);
    setOptimizationStatus('running');
    setJobStatus('pending');
    setJobProgress(0);

    try {
      const result = await apiClient.runOptimization({
        daily_stock: stock,
        available_resources: resources,
        target_production: targetProduction,
        min_variety: minVariety,
      });

      jobIdRef.current = result.id;
      
      // Send job ID to WebSocket to subscribe to updates
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'subscribe', job_id: result.id }));
      }

      // Also poll for status in case WebSocket doesn't update
      const pollStatus = setInterval(async () => {
        try {
          const statusData = await apiClient.getOptimizationStatus(result.id);
          const status = (statusData as any)?.status as string;
          setJobStatus(status);
          
          if (status === 'done' || status === 'error' || status === 'cancelled') {
            clearInterval(pollStatus);
            if (status === 'done') {
              if ((statusData as any)?.result) {
                setCurrentOptimization((statusData as any).result);
              }
              setOptimizationStatus('completed');
              toast.success('Optimization completed!');
              setTimeout(() => router.push('/dashboard'), 1500);
            } else {
              setOptimizationStatus('failed');
              toast.error(`Optimization ${status}`);
            }
          }
        } catch (err) {
          console.error('[v0] Poll status error:', err);
        }
      }, 2000);

      return () => clearInterval(pollStatus);
    } catch (error) {
      setOptimizationStatus('failed');
      setJobStatus('error');
      console.error('[v0] Optimization error:', error);
      toast.error('Optimization failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (jobStatus) {
      case 'pending':
        return <Clock className="w-5 h-5 animate-pulse text-amber-500" />;
      case 'processing':
        return <Zap className="w-5 h-5 animate-pulse text-blue-500" />;
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
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

            {(optimizationStatus === 'running' || jobStatus !== 'idle') && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground capitalize">
                      {jobStatus === 'idle' ? 'Ready' : jobStatus}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {jobStatus === 'pending' && 'Waiting in queue...'}
                      {jobStatus === 'processing' && `Processing... ${Math.round(jobProgress)}%`}
                      {jobStatus === 'done' && 'Optimization completed!'}
                      {(jobStatus === 'error' || jobStatus === 'cancelled') && 'Optimization failed'}
                    </p>
                  </div>
                </div>
                {jobStatus === 'processing' && (
                  <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.round(jobProgress)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleOptimize}
              disabled={isLoading || optimizationStatus === 'running'}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
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
