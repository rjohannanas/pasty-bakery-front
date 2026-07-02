'use client';

import React, { useEffect, useState } from 'react';
import { createWebSocketConnection } from '@/lib/api';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface OptimizationStatusProps {
  isRunning: boolean;
}

export function OptimizationStatus({ isRunning }: OptimizationStatusProps) {
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setMessage('');
      setProgress(0);
      return;
    }

    let ws: WebSocket | null = null;
    const handleMessage = (data: unknown) => {
      const msg = data as Record<string, unknown>;
      if (msg.status) setMessage(msg.status as string);
      if (msg.progress) setProgress(msg.progress as number);
    };

    const handleError = () => {
      setMessage('WebSocket connection error');
    };

    try {
      ws = createWebSocketConnection(handleMessage, handleError);
    } catch (error) {
      console.error('[v0] WebSocket connection failed:', error);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="font-semibold text-foreground">Optimization in progress...</span>
      </div>
      
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      
      {progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
