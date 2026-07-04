'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface AddItemData {
  name: string;
  sale_price?: number;
  demand?: number;
  min_batch?: number;
  max_batch?: number;
  unit?: string;
  unit_cost?: number;
  stock_available?: number;
  capacity_minutes?: number;
  available?: number;
  cost_per_unit?: number;
}

type ItemType = 'product' | 'ingredient' | 'machine' | 'operational_resource';

interface AddItemModalProps {
  isOpen: boolean;
  title: string;
  type: ItemType;
  mode?: 'add' | 'edit';
  initialData?: AddItemData;
  onClose: () => void;
  onAdd: (data: AddItemData) => void;
}

const emptyForm: AddItemData = {
  name: '',
  sale_price: 0,
  demand: 0,
  min_batch: 0,
  max_batch: 0,
  unit: '',
  unit_cost: 0,
  stock_available: 0,
  capacity_minutes: 0,
  available: 0,
  cost_per_unit: 0,
};

function validate(type: ItemType, form: AddItemData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.name?.trim()) errors.name = 'Requerido';

  if (type === 'product') {
    if (Number(form.sale_price) < 0) errors.sale_price = 'P no puede ser negativo';
    if (Number(form.demand) < 0) errors.demand = 'D no puede ser negativo';
    if (Number(form.min_batch) < 0) errors.min_batch = 'LI no puede ser negativo';
    if (Number(form.max_batch) < 0) errors.max_batch = 'LS no puede ser negativo';
    if (
      !errors.min_batch &&
      !errors.max_batch &&
      Number(form.min_batch) > Number(form.max_batch)
    ) {
      errors.max_batch = 'LS debe ser mayor o igual a LI';
    }
  }

  if (type === 'ingredient') {
    if (!form.unit?.trim()) errors.unit = 'Requerido';
    if (Number(form.unit_cost) < 0) errors.unit_cost = 'No puede ser negativo';
    if (Number(form.stock_available) < 0) errors.stock_available = 'No puede ser negativo';
  }

  if (type === 'machine') {
    if (Number(form.capacity_minutes) < 0) errors.capacity_minutes = 'No puede ser negativo';
  }

  if (type === 'operational_resource') {
    if (Number(form.available) < 0) errors.available = 'No puede ser negativo';
    if (Number(form.cost_per_unit) < 0) errors.cost_per_unit = 'No puede ser negativo';
  }

  return errors;
}

export function AddItemModal({ isOpen, title, type, mode = 'add', initialData, onClose, onAdd }: AddItemModalProps) {
  const [form, setForm] = useState<AddItemData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...emptyForm, ...initialData } : emptyForm);
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(type, form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onAdd(form);
    onClose();
  };

  if (!isOpen) return null;

  const isEditingOperationalResourceName = mode === 'edit' && type === 'operational_resource';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={`Nombre del ${type}`}
              disabled={isEditingOperationalResourceName}
              className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              autoFocus
            />
            {isEditingOperationalResourceName && (
              <p className="text-xs text-muted-foreground mt-1">El nombre no se puede editar una vez creado.</p>
            )}
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {type === 'product' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Precio de venta (P)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sale_price}
                  onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.sale_price && <p className="text-xs text-red-600 mt-1">{errors.sale_price}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Demanda estimada (D)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.demand}
                  onChange={(e) => setForm({ ...form, demand: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.demand && <p className="text-xs text-red-600 mt-1">{errors.demand}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Lote mínimo (LI)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_batch}
                    onChange={(e) => setForm({ ...form, min_batch: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.min_batch && <p className="text-xs text-red-600 mt-1">{errors.min_batch}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Lote máximo (LS)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.max_batch}
                    onChange={(e) => setForm({ ...form, max_batch: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.max_batch && <p className="text-xs text-red-600 mt-1">{errors.max_batch}</p>}
                </div>
              </div>
            </>
          )}

          {type === 'ingredient' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Unidad (kg, litros, unidades...)</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Costo por unidad</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.unit_cost && <p className="text-xs text-red-600 mt-1">{errors.unit_cost}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Stock disponible</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.stock_available}
                  onChange={(e) => setForm({ ...form, stock_available: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.stock_available && <p className="text-xs text-red-600 mt-1">{errors.stock_available}</p>}
              </div>
            </>
          )}

          {type === 'machine' && (
            <div>
              <label className="text-sm font-medium text-foreground">Minutos disponibles</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.capacity_minutes}
                onChange={(e) => setForm({ ...form, capacity_minutes: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {type === 'operational_resource' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Disponible por día</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.available}
                  onChange={(e) => setForm({ ...form, available: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.available && <p className="text-xs text-red-600 mt-1">{errors.available}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Costo por unidad</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost_per_unit}
                  onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.cost_per_unit && <p className="text-xs text-red-600 mt-1">{errors.cost_per_unit}</p>}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {mode === 'edit' ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
