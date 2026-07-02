'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';

interface MatrixItem {
  id: string;
  name: string;
  value?: number;
}

interface MatrixEditorProps {
  title: string;
  rows: MatrixItem[];
  columns: MatrixItem[];
  matrixType: 'Q' | 'T' | 'CM';
  onSave: (productId: string, itemId: string, value: number) => Promise<void>;
}

export function MatrixEditor({ title, rows, columns, matrixType, onSave }: MatrixEditorProps) {
  const [editing, setEditing] = useState<Record<string, Record<string, number>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const getUnit = () => {
    if (matrixType === 'Q') return 'kg';
    if (matrixType === 'T') return 'min';
    return 'units';
  };

  const handleCellChange = (rowId: string, colId: string, value: number) => {
    if (!editing[rowId]) {
      editing[rowId] = {};
    }
    editing[rowId][colId] = Math.max(0, value);
  };

  const handleSaveCell = async (rowId: string, itemId: string) => {
    if (!editing[rowId] || editing[rowId][itemId] === undefined) return;

    setIsSaving(true);
    try {
      await onSave(rowId, itemId, editing[rowId][itemId]);
      toast.success('Cell saved successfully');
    } catch (error) {
      console.error('[v0] Error saving cell:', error);
      toast.error('Failed to save cell');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(editing).length > 0;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Unit: <strong>{getUnit()}</strong>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-border bg-muted p-2 text-left text-sm font-semibold text-foreground">
                {matrixType === 'Q' ? 'Product' : matrixType === 'T' ? 'Product' : 'Product'}
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="border border-border bg-muted p-2 text-center text-sm font-semibold text-foreground"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="border border-border bg-muted/50 p-2 text-sm font-medium text-foreground">
                  {row.name}
                </td>
                {columns.map((col) => (
                  <td key={`${row.id}-${col.id}`} className="border border-border p-2">
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={row.value || 0}
                        onChange={(e) =>
                          handleCellChange(row.id, col.id, parseFloat(e.target.value) || 0)
                        }
                        onBlur={() => handleSaveCell(row.id, col.id)}
                        className="w-full px-2 py-1 border border-input rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="0"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasChanges && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setEditing({})}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
