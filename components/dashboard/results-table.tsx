'use client';

import React from 'react';
import type { Optimization } from '@/lib/api';

export const formatPermissibleRange = (
  val: number | null | undefined,
  type: 'increase' | 'decrease'
): string => {
  if (val === null || val === undefined) {
    return '∞';
  }
  const prefix = type === 'increase' ? '+' : '-';
  return `${prefix}$${val.toFixed(2)}`;
};

interface ResultsTableProps {
  data: Optimization;
}

export function ResultsTable({ data }: ResultsTableProps) {
  const productionData = (data.results ?? []).map((row) => ({
    id: row.id,
    product_name: row.product_name ?? row.product?.name ?? `Producto #${row.product_id ?? row.id}`,
    quantity_to_produce: row.quantity_to_produce,
    batch_active: row.batch_active,
    allowable_increase: row.allowable_increase ?? null,
    allowable_decrease: row.allowable_decrease ?? null,
    expected_profit: row.expected_profit,
  }));

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Resumen de Plan Óptimo (Análisis de Sensibilidad)</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm divide-y divide-border">
          <thead>
            <tr className="bg-muted">
              <th className="px-6 py-3 text-left font-semibold text-foreground">Productos</th>
              <th className="px-6 py-3 text-right font-semibold text-foreground">Cantidad</th>
              <th className="px-6 py-3 text-right font-semibold text-foreground">Lotes</th>
              <th className="px-6 py-3 text-right font-semibold text-foreground">Aumento Permisible</th>
              <th className="px-6 py-3 text-right font-semibold text-foreground">Disminución Permisible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {productionData.map((row) => (
              <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-3 font-medium text-foreground">{row.product_name}</td>
                <td className="px-6 py-3 text-right text-foreground font-semibold">
                  {Number.isInteger(row.quantity_to_produce)
                    ? row.quantity_to_produce
                    : row.quantity_to_produce.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right text-foreground">{row.batch_active}</td>
                <td className="px-6 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatPermissibleRange(row.allowable_increase, 'increase')}
                </td>
                <td className="px-6 py-3 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                  {formatPermissibleRange(row.allowable_decrease, 'decrease')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
