'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { OptimizationResult } from '@/lib/api';

interface ResourceChartProps {
  data: OptimizationResult;
}

export function ResourceChart({ data }: ResourceChartProps) {
  const chartData = [
    {
      name: 'Oven',
      available: 100,
      used: 78,
    },
    {
      name: 'Mixer',
      available: 100,
      used: 65,
    },
    {
      name: 'Labor',
      available: 100,
      used: 82,
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Resource Usage vs. Capacity</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: `1px solid var(--color-border)`,
              color: 'var(--color-foreground)',
            }}
          />
          <Legend />
          <Bar dataKey="available" fill="var(--color-muted)" />
          <Bar dataKey="used" fill="var(--color-primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
