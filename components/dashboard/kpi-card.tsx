'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function KPICard({ title, value, icon: Icon, trend, color = 'bg-primary' }: KPICardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`${color} rounded-lg p-3 text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
