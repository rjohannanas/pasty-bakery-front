'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Optimization, Product } from '@/lib/api';

interface ResourceChartProps {
  data: Optimization;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Uso de Recursos vs. Capacidad</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ResourceBarChart({ title, unit, chartData }: { title: string; unit: string; chartData: { name: string; used: number; capacity: number }[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-3">
        {title} ({unit})
      </h3>
      <ResponsiveContainer width="100%" height={260}>
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
          <Bar dataKey="used" name="Usado" fill="var(--color-primary)" />
          <Bar dataKey="capacity" name="Capacidad" fill="var(--color-muted-foreground)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResourceChart({ data }: ResourceChartProps) {
  const scenario = data.scenario;

  if (!scenario) {
    return <EmptyState message="Esta corrida no incluye la configuración del escenario en el resultado." />;
  }

  const productsById = new Map<number, Product>((scenario.products ?? []).map((p) => [p.id, p]));
  const results = data.results ?? [];

  const productFor = (row: (typeof results)[number]) =>
    row.product_id != null ? productsById.get(row.product_id) : undefined;

  // Minutos usados por máquina = Σ (lotes activos x minutos por unidad) de cada producto que la usa.
  const usedMinutesByMachine = new Map<number, number>();
  for (const row of results) {
    for (const pm of productFor(row)?.machines ?? []) {
      const current = usedMinutesByMachine.get(pm.machine_id) ?? 0;
      usedMinutesByMachine.set(pm.machine_id, current + (row.batch_active ?? 0) * pm.minutes_per_unit);
    }
  }

  // Cantidad usada por insumo = Σ (cantidad a producir x cantidad por unidad) de cada producto que lo usa.
  const usedByIngredient = new Map<number, number>();
  for (const row of results) {
    for (const pi of productFor(row)?.ingredients ?? []) {
      const current = usedByIngredient.get(pi.ingredient_id) ?? 0;
      usedByIngredient.set(pi.ingredient_id, current + row.quantity_to_produce * pi.quantity);
    }
  }

  // Consumo por recurso operativo = Σ (lotes activos x consumo por lote) de cada producto que lo usa.
  const usedByOpres = new Map<number, number>();
  for (const row of results) {
    for (const por of productFor(row)?.operational_resources ?? []) {
      const current = usedByOpres.get(por.operational_resource_id) ?? 0;
      usedByOpres.set(por.operational_resource_id, current + (row.batch_active ?? 0) * por.consumption_per_batch);
    }
  }

  const machineData = (scenario.machines ?? []).map((machine) => ({
    name: machine.name,
    used: Math.round(((usedMinutesByMachine.get(machine.id) ?? 0) / 60) * 100) / 100,
    capacity: Math.round((machine.capacity_minutes / 60) * 100) / 100,
  }));

  const ingredientData = (scenario.ingredients ?? []).map((ingredient) => ({
    name: `${ingredient.name} (${ingredient.unit})`,
    used: Math.round((usedByIngredient.get(ingredient.id) ?? 0) * 100) / 100,
    capacity: Math.round(ingredient.stock_available * 100) / 100,
  }));

  const opresData = (scenario.operational_resources ?? []).map((opres) => ({
    name: opres.name,
    used: Math.round((usedByOpres.get(opres.id) ?? 0) * 100) / 100,
    capacity: Math.round(opres.available * 100) / 100,
  }));

  if (machineData.length === 0 && ingredientData.length === 0 && opresData.length === 0) {
    return <EmptyState message="El escenario de esta corrida no tiene máquinas, insumos ni recursos operativos configurados." />;
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Uso de Recursos vs. Capacidad</h2>
      {machineData.length > 0 && <ResourceBarChart title="Máquinas" unit="horas" chartData={machineData} />}
      {ingredientData.length > 0 && <ResourceBarChart title="Insumos" unit="stock" chartData={ingredientData} />}
      {opresData.length > 0 && <ResourceBarChart title="Recursos operativos" unit="disponible" chartData={opresData} />}
    </div>
  );
}
