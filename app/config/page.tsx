'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layout/main-layout';
import { AddItemModal } from '@/components/config/add-item-modal';
import { MatrixEditor } from '@/components/config/matrix-editor';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface ConfigItem {
  id: string;
  name: string;
  type: 'product' | 'ingredient' | 'machine';
  value?: number;
}

export default function ConfigPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [products, setProducts] = useState<ConfigItem[]>([]);
  const [ingredients, setIngredients] = useState<ConfigItem[]>([]);
  const [machines, setMachines] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'ingredient' | 'machine'>('product');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsData, ingredientsData, machinesData] = await Promise.all([
        apiClient.getProducts().catch(() => []),
        apiClient.getIngredients().catch(() => []),
        apiClient.getMachines().catch(() => []),
      ]);

      setProducts(
        (Array.isArray(productsData) ? productsData : []).map((p: any) => ({
          id: p.id,
          name: p.name,
          type: 'product',
        }))
      );
      setIngredients(
        (Array.isArray(ingredientsData) ? ingredientsData : []).map((i: any) => ({
          id: i.id,
          name: i.name,
          type: 'ingredient',
        }))
      );
      setMachines(
        (Array.isArray(machinesData) ? machinesData : []).map((m: any) => ({
          id: m.id,
          name: m.name,
          type: 'machine',
        }))
      );
    } catch (error) {
      console.error('[v0] Error fetching config data:', error);
      toast.error('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (name: string) => {
    try {
      let response: any;
      if (modalType === 'product') {
        response = await apiClient.createProduct({ name });
      } else if (modalType === 'ingredient') {
        response = await apiClient.createIngredient({ name });
      } else {
        response = await apiClient.createMachine({ name });
      }

      const newItem: ConfigItem = { id: response?.id || Date.now().toString(), name: response?.name || name, type: modalType };
      
      if (modalType === 'product') {
        setProducts([...products, newItem]);
      } else if (modalType === 'ingredient') {
        setIngredients([...ingredients, newItem]);
      } else {
        setMachines([...machines, newItem]);
      }
      
      toast.success(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} added successfully`);
      setModalOpen(false);
    } catch (error) {
      console.error('[v0] Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const openModal = (type: 'product' | 'ingredient' | 'machine') => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleDeleteItem = async (id: string, type: 'product' | 'ingredient' | 'machine') => {
    try {
      if (type === 'product') {
        await apiClient.deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
      } else if (type === 'ingredient') {
        await apiClient.deleteIngredient(id);
        setIngredients(ingredients.filter((i) => i.id !== id));
      } else {
        await apiClient.deleteMachine(id);
        setMachines(machines.filter((m) => m.id !== id));
      }
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('[v0] Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleSaveMatrix = async (productId: string, itemId: string, value: number) => {
    try {
      // This will be called from MatrixEditor for each cell
      // Implementation depends on which matrix type (Q, T, CM)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
    } catch (error) {
      console.error('[v0] Error saving matrix:', error);
      throw error;
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage master data for products, ingredients, and machines</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ConfigSection
            title="Products"
            icon="🍪"
            items={products}
            onAdd={() => openModal('product')}
            onEdit={() => toast.info('Edit product feature coming soon')}
            onDelete={(id) => handleDeleteItem(id, 'product')}
          />

          <ConfigSection
            title="Ingredients"
            icon="🌾"
            items={ingredients}
            onAdd={() => openModal('ingredient')}
            onEdit={() => toast.info('Edit ingredient feature coming soon')}
            onDelete={(id) => handleDeleteItem(id, 'ingredient')}
          />

          <ConfigSection
            title="Machines"
            icon="⚙️"
            items={machines}
            onAdd={() => openModal('machine')}
            onEdit={() => toast.info('Edit machine feature coming soon')}
            onDelete={(id) => handleDeleteItem(id, 'machine')}
          />
        </div>

        <AddItemModal
          isOpen={modalOpen}
          title={`Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
          type={modalType}
          onClose={() => setModalOpen(false)}
          onAdd={handleAddItem}
        />

        {products.length > 0 && ingredients.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Consumption Matrices</h2>
            
            <MatrixEditor
              title="Q Matrix - Ingredient Consumption (per product unit)"
              rows={products}
              columns={ingredients}
              matrixType="Q"
              onSave={handleSaveMatrix}
            />
            
            {machines.length > 0 && (
              <MatrixEditor
                title="T Matrix - Machine Time (per product unit)"
                rows={products}
                columns={machines}
                matrixType="T"
                onSave={handleSaveMatrix}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

interface ConfigSectionProps {
  title: string;
  icon: string;
  items: ConfigItem[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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
          <p className="text-sm text-muted-foreground py-4">No items yet</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
            >
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(item.id)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(item.id)}
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                >
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
