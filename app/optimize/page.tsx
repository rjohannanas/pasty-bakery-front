'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient, ApiError, createWebSocketConnection, type Stock, type Resource, type JobStatus, type ManagedWebSocket } from '@/lib/api';
import { logEvent } from '@/lib/logger';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

const STATUS_PROGRESS: Record<JobStatus, number> = {
  pending: 15,
  processing: 60,
  done: 100,
  error: 100,
  cancelled: 100,
};

export default function OptimizePage() {
  const router = useRouter();
  const { setCurrentOptimization, optimizationStatus, setOptimizationStatus } = useAppStore();
  const wsRef = useRef<ManagedWebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const [stock, setStock] = useState<Stock | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [stockValues, setStockValues] = useState<Record<number, number>>({});
  const [machineValues, setMachineValues] = useState<Record<number, number>>({});
  const [opresValues, setOpresValues] = useState<Record<number, number>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [maxProduction, setMaxProduction] = useState(200);
  const [minVariety, setMinVariety] = useState(7);
  const [useIntegerVars, setUseIntegerVars] = useState(true);
  const [useBinaryVars, setUseBinaryVars] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | 'idle'>('idle');

  const loadDefaults = useCallback(async () => {
    setIsLoadingData(true);
    logEvent('info', 'optimize', 'Loading active scenario stock and capacity');
    try {
      const [stockData, resourceData] = await Promise.all([
        apiClient.getDefaultStock(),
        apiClient.getDefaultResource(),
      ]);
      logEvent('info', 'optimize', 'Active scenario stock and capacity loaded', {
        scenario_id: stockData.scenario_id,
        ingredients: stockData.ingredients?.length ?? 0,
        machines: resourceData.machines?.length ?? 0,
        operational_resources: resourceData.operational_resources?.length ?? 0,
      });
      setStock(stockData);
      setResource(resourceData);
      setStockValues(Object.fromEntries((stockData.ingredients ?? []).map((si) => [si.ingredient_id, si.quantity_available])));
      setMachineValues(Object.fromEntries((resourceData.machines ?? []).map((rm) => [rm.machine_id, rm.capacity_minutes])));
      setOpresValues(Object.fromEntries((resourceData.operational_resources ?? []).map((or) => [or.id, or.available])));
    } catch (error) {
      logEvent('error', 'optimize', 'Error loading active scenario stock and capacity', { error });
      toast.error('No se pudo cargar el stock/recursos');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadDefaults();
  }, [loadDefaults]);

  const finishJob = useCallback(
    async (jobId: string, status: JobStatus) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      logEvent('info', 'optimize', 'Finishing optimization job', { job_id: jobId, status });
      if (status === 'done') {
        try {
          const jobInfo = await apiClient.getOptimizationStatus(jobId);
          const full = await apiClient.getResults(jobInfo.id);
          logEvent('info', 'optimize', 'Optimization result loaded', {
            job_id: jobId,
            optimization_id: jobInfo.id,
            total_profit: full.total_profit,
            result_rows: full.results?.length ?? 0,
          });
          setCurrentOptimization(full);
          setOptimizationStatus('completed');
          toast.success('¡Optimización completada!');
          setTimeout(() => router.push('/dashboard'), 1200);
        } catch (error) {
          logEvent('error', 'optimize', 'Error fetching final optimization result', { job_id: jobId, error });
          toast.error('Terminó pero no se pudo cargar el resultado');
          setOptimizationStatus('failed');
        }
      } else {
        setOptimizationStatus('failed');
        toast.error(`Optimización ${status}`);
      }
    },
    [router, setCurrentOptimization, setOptimizationStatus]
  );

  useEffect(() => {
    wsRef.current = createWebSocketConnection(
      (data: any) => {
        if (!data?.job_id || !data?.status) {
          logEvent('warn', 'optimize', 'Ignoring WebSocket message without job_id/status', { data });
          return;
        }
        const status = data.status as JobStatus;
        logEvent('info', 'optimize', 'Optimization status received by WebSocket', {
          job_id: data.job_id,
          status,
        });
        setJobStatus(status);
        if (status === 'done' || status === 'error' || status === 'cancelled') {
          finishJob(data.job_id, status);
        }
      },
      (error) => {
        logEvent('error', 'optimize', 'Optimization WebSocket error', { error });
      }
    );

    return () => {
      wsRef.current?.close();
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [finishJob]);

  const handleOptimize = async () => {
    if (!stock || !resource) {
      logEvent('warn', 'optimize', 'Optimize requested without loaded stock/resource');
      return;
    }
    setIsLoading(true);
    finishedRef.current = false;
    setOptimizationStatus('running');
    setJobStatus('pending');

    try {
      logEvent('info', 'optimize', 'Persisting scenario values before optimization', {
        scenario_id: stock.scenario_id,
        ingredient_updates: Object.keys(stockValues).length,
        machine_updates: Object.keys(machineValues).length,
        operational_resource_updates: Object.keys(opresValues).length,
        max_production: maxProduction,
        min_variety: minVariety,
      });
      // Guardar los valores editados del día antes de lanzar la optimización.
      await Promise.all([
        ...Object.entries(stockValues).map(([ingredientId, qty]) =>
          apiClient.upsertStockIngredient(stock.id, Number(ingredientId), qty)
        ),
        ...Object.entries(machineValues).map(([machineId, minutes]) =>
          apiClient.upsertResourceMachine(resource.id, Number(machineId), minutes)
        ),
        ...Object.entries(opresValues).map(([opresId, available]) =>
          apiClient.updateResourceOperationalResource(resource.id, Number(opresId), { available })
        ),
      ]);
      logEvent('info', 'optimize', 'Scenario values persisted before optimization', {
        scenario_id: stock.scenario_id,
      });

      const job = await apiClient.runOptimization({
        scenario_id: stock.scenario_id,
        max_production: maxProduction,
        ...(useBinaryVars ? { min_variety: minVariety } : {}),
        use_integer_vars: useIntegerVars,
        use_binary_vars: useBinaryVars,
      });
      logEvent('info', 'optimize', 'Optimization job queued', {
        scenario_id: stock.scenario_id,
        job_id: job.job_id,
        status: job.status,
      });

      // El WS ya escucha updates; el poll es respaldo si se pierde el mensaje.
      pollRef.current = setInterval(async () => {
        try {
          const statusData = await apiClient.getOptimizationStatus(job.job_id);
          logEvent('debug', 'optimize', 'Optimization status received by polling', {
            job_id: job.job_id,
            status: statusData.status,
            optimization_id: statusData.id,
          });
          setJobStatus(statusData.status);
          if (['done', 'error', 'cancelled'].includes(statusData.status)) {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            finishJob(job.job_id, statusData.status);
          }
        } catch (err) {
          logEvent('error', 'optimize', 'Optimization polling error', { job_id: job.job_id, error: err });
        }
      }, 2000);
    } catch (error) {
      setOptimizationStatus('failed');
      setJobStatus('error');
      logEvent('error', 'optimize', 'Optimization start failed', { error });
      toast.error(error instanceof ApiError ? error.message : 'No se pudo iniciar la optimización.');
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

  if (isLoadingData) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-muted-foreground">Cargando stock y recursos...</div>
      </MainLayout>
    );
  }

  const progress = jobStatus === 'idle' ? 0 : STATUS_PROGRESS[jobStatus];

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Correr Optimización</h1>
          <p className="text-muted-foreground mt-1">Ajustar el stock y los recursos del día y ejecutar el modelo</p>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Stock del día</h2>
              {(stock?.ingredients ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No hay ingredientes cargados en el stock. Ir a Configuración.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                {(stock?.ingredients ?? []).map((si) => (
                  <div key={si.ingredient_id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {si.ingredient?.name ?? `Ingrediente #${si.ingredient_id}`} ({si.ingredient?.unit})
                    </label>
                    <input
                      type="number"
                      value={stockValues[si.ingredient_id] ?? 0}
                      onChange={(e) =>
                        setStockValues({ ...stockValues, [si.ingredient_id]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Máquinas disponibles (minutos)</h2>
              {(resource?.machines ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No hay máquinas cargadas en el recurso. Ir a Configuración.</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                {(resource?.machines ?? []).map((rm) => (
                  <div key={rm.machine_id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {rm.machine?.name ?? `Máquina #${rm.machine_id}`} (min)
                    </label>
                    <input
                      type="number"
                      value={machineValues[rm.machine_id] ?? 0}
                      onChange={(e) =>
                        setMachineValues({ ...machineValues, [rm.machine_id]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {(resource?.operational_resources ?? []).length > 0 && (
              <div className="border-t border-border pt-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Recursos operativos disponibles</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(resource?.operational_resources ?? []).map((or) => (
                    <div key={or.id} className="space-y-2">
                      <label className="text-sm font-medium text-foreground capitalize">{or.name}</label>
                      <input
                        type="number"
                        value={opresValues[or.id] ?? 0}
                        onChange={(e) => setOpresValues({ ...opresValues, [or.id]: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Parámetros de optimización</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Producción máxima (M)</label>
                  <input
                    type="number"
                    value={maxProduction}
                    onChange={(e) => setMaxProduction(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span>Variedad mínima requerida</span>
                    {!useBinaryVars && (
                      <span className="text-xs text-muted-foreground font-normal">(Deshabilitado sin var. binarias)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={minVariety}
                    disabled={!useBinaryVars}
                    onChange={(e) => setMinVariety(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-foreground select-none">
                    <input
                      type="checkbox"
                      checked={useIntegerVars}
                      onChange={(e) => setUseIntegerVars(e.target.checked)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary/50 accent-primary"
                    />
                    <span>Ejecutar con var. Enteras</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-foreground select-none">
                    <input
                      type="checkbox"
                      checked={useBinaryVars}
                      onChange={(e) => setUseBinaryVars(e.target.checked)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary/50 accent-primary"
                    />
                    <span>Ejecutar con var. Binarias</span>
                  </label>
                </div>
              </div>
            </div>

            {(optimizationStatus === 'running' || jobStatus !== 'idle') && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground capitalize">
                      {jobStatus === 'idle' ? 'Listo' : jobStatus}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {jobStatus === 'pending' && 'Esperando en la cola...'}
                      {jobStatus === 'processing' && 'Procesando...'}
                      {jobStatus === 'done' && '¡Optimización completada!'}
                      {(jobStatus === 'error' || jobStatus === 'cancelled') && 'La optimización falló'}
                    </p>
                  </div>
                </div>
                {jobStatus === 'processing' && (
                  <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleOptimize}
              disabled={isLoading || optimizationStatus === 'running' || !stock || !resource}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Correr Optimización'
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
