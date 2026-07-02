'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { MainLayout } from '@/components/layout/main-layout';
import { AddItemModal } from '@/components/config/add-item-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface ConfigItem {
  id: string;
  name: string;
  type: 'product' | 'ingredient' | 'machine';
}

export default function ConfigPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [products, setProducts] = useState<ConfigItem[]>([
    { id: '1', name: 'Croissant', type: 'product' },
    { id: '2', name: 'Donut', type: 'product' },
    { id: '3', name: 'Bread', type: 'product' },
  ]);
  const [ingredients, setIngredients] = useState<ConfigItem[]>([
    { id: '1', name: 'Flour', type: 'ingredient' },
    { id: '2', name: 'Sugar', type: 'ingredient' },
    { id: '3', name: 'Butter', type: 'ingredient' },
  ]);
  const [machines, setMachines] = useState<ConfigItem[]>([
    { id: '1', name: 'Oven', type: 'machine' },
    { id: '2', name: 'Mixer', type: 'machine' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'ingredient' | 'machine'>('product');

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleAddItem = (name: string) => {
    const id = Date.now().toString();
    const newItem: ConfigItem = { id, name, type: modalType };
    
    if (modalType === 'product') {
      setProducts([...products, newItem]);
    } else if (modalType === 'ingredient') {
      setIngredients([...ingredients, newItem]);
    } else {
      setMachines([...machines, newItem]);
    }
    
    toast.success(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} added successfully`);
  };

  const openModal = (type: 'product' | 'ingredient' | 'machine') => {
    setModalType(type);
    setModalOpen(true);
  };

  if (!user) return null;

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
            onDelete={(id) => setProducts(products.filter((p) => p.id !== id))}
          />

          <ConfigSection
            title="Ingredients"
            icon="🌾"
            items={ingredients}
            onAdd={() => openModal('ingredient')}
            onEdit={() => toast.info('Edit ingredient feature coming soon')}
            onDelete={(id) => setIngredients(ingredients.filter((i) => i.id !== id))}
          />

          <ConfigSection
            title="Machines"
            icon="⚙️"
            items={machines}
            onAdd={() => openModal('machine')}
            onEdit={() => toast.info('Edit machine feature coming soon')}
            onDelete={(id) => setMachines(machines.filter((m) => m.id !== id))}
          />
        </div>

        <AddItemModal
          isOpen={modalOpen}
          title={`Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
          type={modalType}
          onClose={() => setModalOpen(false)}
          onAdd={handleAddItem}
        />

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Consumption Matrices</h2>
          <p className="text-muted-foreground mb-4">
            Define the consumption matrices (Q, T, CM) for each product
          </p>
          <Button variant="outline" disabled>
            Configure Matrices
          </Button>
        </div>
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
