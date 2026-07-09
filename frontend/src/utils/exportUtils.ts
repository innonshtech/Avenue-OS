import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
}

/**
 * Utility to export an array of data to a CSV file.
 */
export const exportToCSV = (data: any[], filename: string, columns: ExportColumn[]) => {
  if (!data || !data.length) {
    alert('No data to export.');
    return;
  }

  const headerRow = columns.map(col => `"${col.header}"`).join(',');
  
  const rows = data.map(item => {
    return columns.map(col => {
      // Handle nested keys like 'project.name'
      let val = col.key.split('.').reduce((o, i) => (o ? o[i] : ''), item);
      if (val === null || val === undefined) val = '';
      
      // Escape quotes
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Utility to export an array of data to a branded PDF file using jsPDF and jspdf-autotable.
 */
export const exportToPDF = (
  title: string,
  filename: string,
  columns: ExportColumn[],
  data: any[]
) => {
  if (!data || !data.length) {
    alert('No data to export.');
    return;
  }

  const doc = new jsPDF();
  
  // ==========================================
  // BRANDING: The Avenue Company
  // ==========================================
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Dark blue / Indigo
  doc.text('The Avenue Company', 14, 20);
  
  // Document Title
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100); // Gray
  doc.text(title, 14, 30);
  
  // Metadata / Date
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.setFontSize(10);
  doc.text(`Generated on: ${dateStr}`, 14, 38);

  // Prepare table data
  const tableColumn = columns.map(col => col.header);
  const tableRows = data.map(item => {
    return columns.map(col => {
      // Handle nested keys
      let val = col.key.split('.').reduce((o, i) => (o ? o[i] : ''), item);
      if (val === null || val === undefined) val = '';
      return String(val);
    });
  });

  // Render Table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Tailwind Indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Tailwind Gray-50
    },
    margin: { top: 40 }
  });

  // Footer with Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10,
      { align: 'right' }
    );
  }

  doc.save(`${filename}.pdf`);
};

/**
 * Utility to export project reports to a PDF file including task breakdown by category.
 */
export const exportProjectReportsToPDF = (
  title: string,
  filename: string,
  projectData: any[]
) => {
  if (!projectData || !projectData.length) {
    alert('No data to export.');
    return;
  }

  const doc = new jsPDF();
  
  // BRANDING
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138);
  doc.text('The Avenue Company', 14, 20);
  
  // Title
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(title, 14, 30);
  
  // Metadata
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(10);
  doc.text(`Generated on: ${dateStr}`, 14, 38);

  let currentY = 45;

  projectData.forEach((project, pIndex) => {
    // Add page if near bottom
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text(`Project: ${project.name}`, 14, currentY);
    currentY += 8;

    // Project summary table
    autoTable(doc, {
      head: [['Status', 'Completion', 'Total Tasks', 'Completed', 'Overdue']],
      body: [[
        project.status,
        `${project.completionPercentage?.toFixed(1)}%`,
        String(project.totalTasks),
        String(project.completedTasks),
        String(project.overdueTasks)
      ]],
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    if (project.tasks && project.tasks.length > 0) {
      const grouped = project.tasks.reduce((acc: any, task: any) => {
        const cat = task.taskCategory || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(task);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([category, tasks]: [string, any]) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Category: ${category.replace(/_/g, ' ')}`, 14, currentY);
        currentY += 5;

        const taskRows = tasks.map((task: any) => [
          task.title,
          task.status.replace(/_/g, ' '),
          task.assignee?.name || 'Unassigned',
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'
        ]);

        autoTable(doc, {
          head: [['Task', 'Status', 'Assignee', 'Due Date']],
          body: taskRows,
          startY: currentY,
          theme: 'grid',
          headStyles: { fillColor: [243, 244, 246], textColor: [50, 50, 50], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3 },
          margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      });
    }

    currentY += 10; // Extra spacing between projects
  });

  // Footer with Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
};
