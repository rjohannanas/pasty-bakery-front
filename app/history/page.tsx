'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, TrendingUp, MoreVertical } from 'lucide-react';
import type { OptimizationResult } from '@/lib/api';

export default function HistoryPage() {
  const router = useRouter();
  const { user, setCurrentOptimization } = useAppStore();
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[v0] Fetch history error:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResult = (result: OptimizationResult) => {
    setCurrentOptimization(result);
    router.push('/dashboard');
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
                className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
              >
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
                        Expected Profit: ${result.expected_profit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Varieties: </span>
                        <span className="font-semibold text-foreground">
                          {Object.values(result.variety_flag).filter(Boolean).length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Products: </span>
                        <span className="font-semibold text-foreground">
                          {Object.keys(result.quantity_to_produce).length}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status: </span>
                        <span
                          className={`font-semibold ${
                            result.status === 'completed'
                              ? 'text-green-600'
                              : result.status === 'failed'
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
                      View Details
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
