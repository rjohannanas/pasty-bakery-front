'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, TrendingUp, MoreVertical, ChevronDown } from 'lucide-react';
import type { OptimizationResult } from '@/lib/api';

interface ResultWithLogs extends OptimizationResult {
  logs?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, setCurrentOptimization } = useAppStore();
  const [results, setResults] = useState<ResultWithLogs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    fetchHistory();
  }, [user, router]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getResults();
      const resultsArray = Array.isArray(data) ? data : [];
      setResults(resultsArray);
    } catch (error) {
      console.error('[v0] Fetch history error:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (resultId: string, jobId?: string) => {
    try {
      setLogsLoading(resultId);
      if (jobId) {
        const logs = await apiClient.getLogs(jobId);
        setResults(
          results.map((r) =>
            r.id === resultId ? { ...r, logs: typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2) } : r
          )
        );
      }
    } catch (error) {
      console.error('[v0] Fetch logs error:', error);
      toast.error('Failed to load logs');
    } finally {
      setLogsLoading(null);
    }
  };

  const handleViewResult = (result: OptimizationResult) => {
    setCurrentOptimization(result);
    router.push('/dashboard');
  };

  const handleExportCSV = (result: ResultWithLogs) => {
    try {
      const csv = [
        ['Optimization Report', ''],
        ['Date', new Date(result.timestamp).toLocaleString()],
        ['Status', result.status],
        ['Expected Profit', result.expected_profit],
        [''],
        ['Product', 'Quantity', 'Active', 'Variety'],
      ];

      Object.entries(result.quantity_to_produce).forEach(([product, quantity]) => {
        csv.push([
          product,
          String(quantity),
          String(result.batch_active[product] || 0),
          String(result.variety_flag[product] || false),
        ]);
      });

      const csvContent = csv.map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimization-${new Date(result.timestamp).getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported as CSV');
    } catch (error) {
      console.error('[v0] Export error:', error);
      toast.error('Failed to export report');
    }
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Optimization History</h1>
          <p className="text-muted-foreground mt-1">View and manage past optimization runs</p>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground text-lg">No optimization history yet</p>
            <Button
              onClick={() => router.push('/optimize')}
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              Run First Optimization
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((result) => (
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
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-lg font-semibold text-foreground">
                          Expected Profit: ${typeof result.expected_profit === 'number' ? result.expected_profit.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Varieties: </span>
                          <span className="font-semibold text-foreground">
                            {typeof result.variety_flag === 'object' ? Object.values(result.variety_flag).filter(Boolean).length : 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Products: </span>
                          <span className="font-semibold text-foreground">
                            {typeof result.quantity_to_produce === 'object' ? Object.keys(result.quantity_to_produce).length : 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          <span
                            className={`font-semibold ${
                              result.status === 'done' || result.status === 'completed'
                                ? 'text-green-600'
                                : (result.status as string) === 'error' || result.status === 'failed'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {(result.status.charAt(0).toUpperCase() + result.status.slice(1)).replace(/[_-]/g, ' ')}
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
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleExportCSV(result)}
                        variant="outline"
                        size="sm"
                      >
                        Export
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {result.id && (
                    <div className="pt-4 border-t border-border">
                      <Button
                        onClick={() =>
                          setExpandedLogs(expandedLogs === result.id ? null : result.id)
                        }
                        variant="ghost"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                        disabled={logsLoading === result.id}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedLogs === result.id ? 'rotate-180' : ''
                          }`}
                        />
                        <span>{expandedLogs === result.id ? 'Hide' : 'Show'} LINGO Logs</span>
                      </Button>

                      {expandedLogs === result.id && (
                        <div className="mt-2 p-3 bg-muted rounded font-mono text-xs overflow-auto max-h-96">
                          {result.logs ? (
                            <pre className="whitespace-pre-wrap break-words text-muted-foreground">
                              {result.logs}
                            </pre>
                          ) : (
                            <p className="text-muted-foreground">No logs available</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
