'use client';

import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import type { OptimizationResult } from '@/lib/api';

interface ProfitChartProps {
  data: OptimizationResult;
}

export function ProfitChart({ data }: ProfitChartProps) {
  const chartData = Object.entries(data.quantity_to_produce).map(([product, quantity]) => ({
    name: product,
    value: quantity as number,
  }));

  const COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)'];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Production Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="var(--color-primary)"
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: `1px solid var(--color-border)`,
              color: 'var(--color-foreground)',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
