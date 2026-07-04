'use client';

import React from 'react';
import type { Optimization } from '@/lib/api';

interface ResultsTableProps {
  data: Optimization;
}

export function ResultsTable({ data }: ResultsTableProps) {
  const productionData = (data.results ?? []).map((row) => ({
    id: row.id,
    product: row.product_name ?? row.product?.name ?? `Producto #${row.product_id ?? row.id}`,
    quantity: row.quantity_to_produce,
    batches: row.batch_active,
    profit: row.expected_profit,
    active: (row.variety_flag ?? 0) > 0,
  }));

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Plan de Producción</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-6 py-3 text-left font-semibold text-foreground">Producto</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Cantidad</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Lotes</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Ganancia</th>
              <th className="px-6 py-3 text-left font-semibold text-foreground">Activo</th>
            </tr>
          </thead>
          <tbody>
            {productionData.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-3 text-foreground">{row.product}</td>
                <td className="px-6 py-3 text-foreground font-semibold">{row.quantity}</td>
                <td className="px-6 py-3 text-foreground">{row.batches}</td>
                <td className="px-6 py-3 text-foreground">${row.profit?.toFixed(2) ?? '0.00'}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      row.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {row.active ? 'Sí' : 'No'}
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
