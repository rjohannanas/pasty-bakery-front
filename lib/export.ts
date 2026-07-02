import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { OptimizationResult } from './api';

export function exportToCSV(data: OptimizationResult) {
  const headers = ['Product', 'Quantity to Produce', 'Batches Active', 'Active', 'Expected Profit'];
  
  const rows = Object.entries(data.quantity_to_produce).map(([product, quantity]) => [
    product,
    quantity,
    data.batch_active[product] ?? 0,
    data.variety_flag[product] ? 'Yes' : 'No',
    (data.expected_profit / Object.keys(data.quantity_to_produce).length).toFixed(2),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    '',
    `Total Expected Profit,${data.expected_profit}`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `production-plan-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function exportToPDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

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

    pdf.save(filename || `production-plan-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('[v0] PDF export error:', error);
    throw error;
  }
}
