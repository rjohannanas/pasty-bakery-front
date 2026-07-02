'use client';

import React from 'react';
import type { OptimizationResult } from '@/lib/api';

interface ResultsTableProps {
  data: OptimizationResult;
}

export function ResultsTable({ data }: ResultsTableProps) {
  const productionData = Object.entries(data.quantity_to_produce).map(([product, quantity]) => ({
    product,
    quantity: quantity as number,
    batches: data.batch_active[product] ?? 0,
    active: data.variety_flag[product] ?? false,
  }));

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Production Plan</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-6 py-3 text-left font-semibold text-foreground">Product</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Quantity</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Batches</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Active</th>
            </tr>
          </thead>
          <tbody>
            {productionData.map((row) => (
              <tr key={row.product} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-3 text-foreground">{row.product}</td>
                <td className="px-6 py-3 text-foreground font-semibold">{row.quantity}</td>
                <td className="px-6 py-3 text-foreground">{row.batches}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      row.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {row.active ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
