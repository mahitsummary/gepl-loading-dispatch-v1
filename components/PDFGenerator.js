'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Loader } from 'lucide-react';

const PDFGenerator = ({
  htmlContent,
  fileName = 'document.pdf',
  title = 'Document',
  onGenerate = null,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async (format = 'A4') => {
    setIsGenerating(true);

    try {
      const element = document.getElementById('pdf-content');
      if (!element) {
        throw new Error('PDF content element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = format === 'A4' ? 210 : 216;
      const pageHeight = format === 'A4' ? 297 : 279;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format,
      });

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);

      if (onGenerate) {
        onGenerate(pdf);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFWithImages = async () => {
    setIsGenerating(true);

    try {
      const element = document.getElementById('pdf-content');
      if (!element) {
        throw new Error('PDF content element not found');
      }

      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'A4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position + margin,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight - 2 * margin;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          position + margin,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight - 2 * margin;
      }

      pdf.save(fileName);

      if (onGenerate) {
        onGenerate(pdf);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('pdf-content');
    if (!element) {
      console.error('PDF content element not found');
      return;
    }

    const printWindow = window.open('', '', 'width=900,height=800');
    const sanitized = element.cloneNode(true);
    sanitized.querySelectorAll('script').forEach((s) => s.remove());
    printWindow.document.write('<!DOCTYPE html><html><head><title>Print</title></head><body></body></html>');
    printWindow.document.close();
    printWindow.document.body.appendChild(printWindow.document.adoptNode(sanitized));
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => generatePDF('A4')}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium text-sm"
        >
          {isGenerating ? (
            <>
              <Loader size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Download PDF
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          disabled={isGenerating}
          className="flex-1 px-4 py-2 bg-secondary-200 text-secondary-900 rounded-lg hover:bg-secondary-300 disabled:opacity-50 transition-colors font-medium text-sm"
        >
          Print
        </button>
      </div>

      {htmlContent && (
        <div
          id="pdf-content"
          className="hidden bg-white p-8 border border-secondary-200 rounded-lg"
          style={{ minHeight: '297mm', width: '210mm' }}
        >
          {htmlContent}
        </div>
      )}
    </div>
  );
};

export default PDFGenerator;
