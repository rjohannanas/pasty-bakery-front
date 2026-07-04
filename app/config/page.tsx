'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient, type Product, type Ingredient, type Machine, type Resource, type Stock } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { AddItemModal, type AddItemData } from '@/components/config/add-item-modal';
import { MatrixEditor } from '@/components/config/matrix-editor';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';

type ItemType = 'product' | 'ingredient' | 'machine' | 'operational_resource';

export default function ConfigPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [productDetails, setProductDetails] = useState<Record<number, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ItemType>('product');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalInitialData, setModalInitialData] = useState<AddItemData | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsData, ingredientsData, machinesData, stockData, resourceData] = await Promise.all([
        apiClient.getProducts().catch(() => []),
        apiClient.getIngredients().catch(() => []),
        apiClient.getMachines().catch(() => []),
        apiClient.getDefaultStock().catch(() => null),
        apiClient.getDefaultResource().catch(() => null),
      ]);
      setProducts(productsData);
      setIngredients(ingredientsData);
      setMachines(machinesData);
      // Seteo inicial de stock/resource ya, sin esperar el auto-link: si ese paso
      // falla (una sola liga rota) no debe tumbar el resto de la carga de la página.
      setStock(stockData);
      setResource(resourceData);

      // Todo ingrediente/máquina global tiene que estar linkeado al Stock/Recurso
      // del día (a 0 si es nuevo) para que aparezca en la pantalla de Optimizar.
      // Cada link se intenta por separado: si uno falla no debe tumbar los demás
      // ni el resto de la carga de la página (productDetails, etc).
      if (stockData) {
        const linkedIds = new Set((stockData.ingredients ?? []).map((si) => si.ingredient_id));
        const missing = ingredientsData.filter((i) => !linkedIds.has(i.id));
        if (missing.length > 0) {
          const results = await Promise.allSettled(
            missing.map((i) => apiClient.upsertStockIngredient(stockData.id, i.id, 0))
          );
          results.forEach((r, idx) => {
            if (r.status === 'rejected') {
              console.error(`[v0] No se pudo linkear el ingrediente "${missing[idx].name}" al stock:`, r.reason);
            }
          });
          if (results.some((r) => r.status === 'fulfilled')) {
            setStock(await apiClient.getDefaultStock());
          }
        }
      }
      if (resourceData) {
        const linkedIds = new Set((resourceData.machines ?? []).map((rm) => rm.machine_id));
        const missing = machinesData.filter((m) => !linkedIds.has(m.id));
        if (missing.length > 0) {
          const results = await Promise.allSettled(
            missing.map((m) => apiClient.upsertResourceMachine(resourceData.id, m.id, 0))
          );
          results.forEach((r, idx) => {
            if (r.status === 'rejected') {
              console.error(`[v0] No se pudo linkear la máquina "${missing[idx].name}" al recurso:`, r.reason);
            }
          });
          if (results.some((r) => r.status === 'fulfilled')) {
            setResource(await apiClient.getDefaultResource());
          }
        }
      }

      const details = await Promise.all(productsData.map((p) => apiClient.getProduct(p.id).catch(() => null)));
      setProductDetails(
        Object.fromEntries(details.filter((d): d is Product => d !== null).map((d) => [d.id, d]))
      );
    } catch (error) {
      console.error('[v0] Error fetching config data:', error);
      toast.error('No se pudo cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshProductDetail = async (productId: number) => {
    const detail = await apiClient.getProduct(productId);
    setProductDetails((prev) => ({ ...prev, [productId]: detail }));
  };

  const openModal = (type: ItemType) => {
    setModalType(type);
    setModalMode('add');
    setEditingId(null);
    setModalInitialData(undefined);
    setModalOpen(true);
  };

  const openEditModal = (type: ItemType, id: number) => {
    let initialData: AddItemData | undefined;
    if (type === 'product') {
      const p = products.find((x) => x.id === id);
      if (!p) return;
      initialData = { name: p.name, sale_price: p.sale_price, demand: p.demand, min_batch: p.min_batch, max_batch: p.max_batch };
    } else if (type === 'ingredient') {
      const i = ingredients.find((x) => x.id === id);
      if (!i) return;
      initialData = { name: i.name, unit: i.unit, unit_cost: i.unit_cost, stock_available: i.stock_available };
    } else if (type === 'machine') {
      const m = machines.find((x) => x.id === id);
      if (!m) return;
      initialData = { name: m.name, capacity_minutes: m.capacity_minutes };
    } else if (type === 'operational_resource') {
      const o = resource?.operational_resources?.find((x) => x.id === id);
      if (!o) return;
      initialData = { name: o.name, available: o.available, cost_per_unit: o.cost_per_unit };
    }
    setModalType(type);
    setModalMode('edit');
    setEditingId(id);
    setModalInitialData(initialData);
    setModalOpen(true);
  };

  const handleModalSubmit = (data: AddItemData) => {
    if (modalMode === 'edit' && editingId != null) {
      handleEditItem(data);
    } else {
      handleAddItem(data);
    }
  };

  const handleEditItem = async (data: AddItemData) => {
    if (editingId == null) return;
    try {
      if (modalType === 'product') {
        const updated = (await apiClient.updateProduct(editingId, {
          name: data.name,
          sale_price: data.sale_price ?? 0,
          demand: data.demand ?? 0,
          min_batch: data.min_batch,
          max_batch: data.max_batch,
        })) as Product;
        setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
        await refreshProductDetail(editingId);
      } else if (modalType === 'ingredient') {
        const updated = (await apiClient.updateIngredient(editingId, {
          name: data.name,
          unit: data.unit,
          unit_cost: data.unit_cost,
          stock_available: data.stock_available,
        })) as Ingredient;
        setIngredients((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...updated } : i)));
        setStock(await apiClient.getDefaultStock());
      } else if (modalType === 'machine') {
        const updated = (await apiClient.updateMachine(editingId, {
          name: data.name,
          capacity_minutes: data.capacity_minutes,
        })) as Machine;
        setMachines((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...updated } : m)));
        setResource(await apiClient.getDefaultResource());
      } else if (modalType === 'operational_resource' && resource) {
        await apiClient.updateResourceOperationalResource(resource.id, editingId, {
          name: data.name,
          available: data.available,
          cost_per_unit: data.cost_per_unit,
        });
        setResource(await apiClient.getDefaultResource());
      }
      toast.success('Actualizado correctamente');
    } catch (error) {
      console.error('[v0] Error editing item:', error);
      toast.error('No se pudo actualizar');
    }
  };

  const handleAddItem = async (data: AddItemData) => {
    try {
      if (modalType === 'product') {
        const created = await apiClient.createProduct({
          name: data.name,
          sale_price: data.sale_price ?? 0,
          demand: data.demand ?? 0,
          min_batch: data.min_batch,
          max_batch: data.max_batch,
        });
        setProducts((prev) => [...prev, created as Product]);
      } else if (modalType === 'ingredient') {
        const created = (await apiClient.createIngredient({
          name: data.name,
          unit: data.unit ?? '',
          unit_cost: data.unit_cost,
          stock_available: data.stock_available,
        })) as Ingredient;
        setIngredients((prev) => [...prev, created]);
        setStock(await apiClient.getDefaultStock());
      } else if (modalType === 'machine') {
        const created = (await apiClient.createMachine({
          name: data.name,
          capacity_minutes: data.capacity_minutes,
        })) as Machine;
        setMachines((prev) => [...prev, created]);
        setResource(await apiClient.getDefaultResource());
      } else if (modalType === 'operational_resource' && resource) {
        await apiClient.addResourceOperationalResource(resource.id, {
          name: data.name,
          available: data.available ?? 0,
          cost_per_unit: data.cost_per_unit ?? 0,
        });
        const refreshed = await apiClient.getDefaultResource();
        setResource(refreshed);
      }
      toast.success('Agregado correctamente');
    } catch (error) {
      console.error('[v0] Error adding item:', error);
      toast.error('No se pudo agregar');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await apiClient.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    try {
      await apiClient.deleteIngredient(id);
      setIngredients((prev) => prev.filter((i) => i.id !== id));
      setStock((prev) => (prev ? { ...prev, ingredients: prev.ingredients?.filter((si) => si.ingredient_id !== id) } : prev));
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleDeleteMachine = async (id: number) => {
    try {
      await apiClient.deleteMachine(id);
      setMachines((prev) => prev.filter((m) => m.id !== id));
      setResource((prev) => (prev ? { ...prev, machines: prev.machines?.filter((rm) => rm.machine_id !== id) } : prev));
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleDeleteOperationalResource = async (id: number) => {
    if (!resource) return;
    try {
      await apiClient.deleteResourceOperationalResource(resource.id, id);
      setResource((prev) =>
        prev ? { ...prev, operational_resources: prev.operational_resources?.filter((o) => o.id !== id) } : prev
      );
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  // Q: Producto x Ingrediente -> quantity. T: Producto x Máquina -> minutes_per_unit. CM: Producto x Recurso operativo -> consumption_per_batch.
  const buildInitialValues = (matrixType: 'Q' | 'T' | 'CM') => {
    const values: Record<string, Record<string, number>> = {};
    for (const product of products) {
      const detail = productDetails[product.id];
      if (!detail) continue;
      const row: Record<string, number> = {};
      if (matrixType === 'Q') {
        for (const pi of detail.ingredients ?? []) row[String(pi.ingredient_id)] = pi.quantity;
      } else if (matrixType === 'T') {
        for (const pm of detail.machines ?? []) row[String(pm.machine_id)] = pm.minutes_per_unit;
      } else {
        for (const por of detail.operational_resources ?? []) row[String(por.operational_resource_id)] = por.consumption_per_batch;
      }
      values[String(product.id)] = row;
    }
    return values;
  };

  const handleSaveMatrixCell = (matrixType: 'Q' | 'T' | 'CM') => async (rowId: string, colId: string, value: number) => {
    const productId = Number(rowId);
    const itemId = Number(colId);
    const detail = productDetails[productId];

    if (matrixType === 'Q') {
      const exists = detail?.ingredients?.some((pi) => pi.ingredient_id === itemId);
      if (exists) await apiClient.updateProductIngredient(productId, itemId, { quantity: value });
      else await apiClient.addProductIngredient(productId, { ingredient_id: itemId, quantity: value });
    } else if (matrixType === 'T') {
      const exists = detail?.machines?.some((pm) => pm.machine_id === itemId);
      if (exists) await apiClient.updateProductMachine(productId, itemId, { minutes_per_unit: value });
      else await apiClient.addProductMachine(productId, { machine_id: itemId, minutes_per_unit: value });
    } else {
      const exists = detail?.operational_resources?.some((por) => por.operational_resource_id === itemId);
      if (exists) await apiClient.updateProductResource(productId, itemId, { consumption_per_batch: value });
      else await apiClient.addProductResource(productId, { operational_resource_id: itemId, consumption_per_batch: value });
    }
    await refreshProductDetail(productId);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </MainLayout>
    );
  }

  const productRows = products.map((p) => ({ id: String(p.id), name: p.name }));
  const ingredientCols = ingredients.map((i) => ({ id: String(i.id), name: `${i.name} (${i.unit})` }));
  const machineCols = machines.map((m) => ({ id: String(m.id), name: m.name }));
  const opresCols = (resource?.operational_resources ?? []).map((o) => ({ id: String(o.id), name: o.name }));

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Datos maestros de productos, ingredientes, máquinas y recursos operativos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <ConfigSection
            title="Productos"
            icon="🍪"
            items={products.map((p) => ({ id: p.id, name: `${p.name} ($${p.sale_price})` }))}
            onAdd={() => openModal('product')}
            onEdit={(id) => openEditModal('product', id)}
            onDelete={handleDeleteProduct}
          />

          <ConfigSection
            title="Ingredientes"
            icon="🌾"
            items={ingredients.map((i) => ({ id: i.id, name: `${i.name} (${i.stock_available} ${i.unit})` }))}
            onAdd={() => openModal('ingredient')}
            onEdit={(id) => openEditModal('ingredient', id)}
            onDelete={handleDeleteIngredient}
          />

          <ConfigSection
            title="Máquinas"
            icon="⚙️"
            items={machines.map((m) => ({ id: m.id, name: `${m.name} (${m.capacity_minutes / 60} h)` }))}
            onAdd={() => openModal('machine')}
            onEdit={(id) => openEditModal('machine', id)}
            onDelete={handleDeleteMachine}
          />

          <ConfigSection
            title="Recursos operativos"
            icon="🔌"
            items={(resource?.operational_resources ?? []).map((o) => ({ id: o.id, name: `${o.name} (${o.available})` }))}
            onAdd={() => openModal('operational_resource')}
            onEdit={(id) => openEditModal('operational_resource', id)}
            onDelete={handleDeleteOperationalResource}
          />
        </div>

        <AddItemModal
          isOpen={modalOpen}
          title={`${modalMode === 'edit' ? 'Editar' : 'Agregar'} ${modalType.replace('_', ' ')}`}
          type={modalType}
          mode={modalMode}
          initialData={modalInitialData}
          onClose={() => setModalOpen(false)}
          onAdd={handleModalSubmit}
        />

        {products.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Matrices de Consumo</h2>

            {ingredients.length > 0 && (
              <MatrixEditor
                title="Matriz Q - Consumo de ingredientes (por unidad de producto)"
                rows={productRows}
                columns={ingredientCols}
                matrixType="Q"
                initialValues={buildInitialValues('Q')}
                onSave={handleSaveMatrixCell('Q')}
              />
            )}

            {machines.length > 0 && (
              <MatrixEditor
                title="Matriz T - Tiempo de máquina (por unidad de producto)"
                rows={productRows}
                columns={machineCols}
                matrixType="T"
                initialValues={buildInitialValues('T')}
                onSave={handleSaveMatrixCell('T')}
              />
            )}

            {opresCols.length > 0 && (
              <MatrixEditor
                title="Matriz CM - Consumo de recursos operativos (por lote)"
                rows={productRows}
                columns={opresCols}
                matrixType="CM"
                initialValues={buildInitialValues('CM')}
                onSave={handleSaveMatrixCell('CM')}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

interface ConfigItem {
  id: number;
  name: string;
}

interface ConfigSectionProps {
  title: string;
  icon: string;
  items: ConfigItem[];
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function ConfigSection({ title, icon, items, onAdd, onEdit, onDelete }: ConfigSectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <Button size="icon" variant="outline" onClick={onAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Sin elementos todavía</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => onEdit(item.id)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)} className="h-8 w-8 text-red-600 hover:text-red-700">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
