import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import type { Optimization } from './api';

function escapeCsvField(value: unknown): string {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportToCSV(data: Optimization) {
  const headers = ['Producto', 'Cantidad a producir', 'Lotes activos', 'Activo', 'Ganancia esperada'];

  const rows = (data.results ?? []).map((row) => [
    row.product_name ?? row.product?.name ?? `Producto #${row.product_id ?? row.id}`,
    row.quantity_to_produce,
    row.batch_active,
    (row.variety_flag ?? 0) > 0 ? 'Sí' : 'No',
    row.expected_profit.toFixed(2),
  ]);

  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(',')),
    '',
    `Ganancia total esperada,${data.total_profit}`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plan-produccion-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function exportToPDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Force light theme for PDF export so text is visible on white background
    element.classList.add('light');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    element.classList.remove('light');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(filename || `plan-produccion-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('[v0] PDF export error:', error);
    throw error;
  }
}
