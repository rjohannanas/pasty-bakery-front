'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { toast } from 'sonner';
import type { OptimizationResult } from '@/lib/api';
import { Download, FileText, Table2 } from 'lucide-react';

interface ExportButtonProps {
  data: OptimizationResult;
}

export function ExportButton({ data }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCSVExport = async () => {
    try {
      setIsLoading(true);
      exportToCSV(data);
      toast.success('Production plan exported as CSV');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('[v0] CSV export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFExport = async () => {
    try {
      setIsLoading(true);
      await exportToPDF('dashboard-export', `production-plan-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Production plan exported as PDF');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('[v0] PDF export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        className="gap-2 bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="w-4 h-4" />
        Export Report
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-40 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px]">
            <button
              onClick={handleCSVExport}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground disabled:opacity-50"
            >
              <Table2 className="w-4 h-4" />
              Export as CSV
            </button>
            <button
              onClick={handlePDFExport}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground border-t border-border disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
