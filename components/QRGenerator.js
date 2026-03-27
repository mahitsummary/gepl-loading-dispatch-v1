'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, Download } from 'lucide-react';

const QRGenerator = ({ data, itemName = '' }) => {
  const [qrImage, setQrImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef(null);

  const generateQR = async () => {
    if (!data) {
      alert('No data to generate QR code');
      return;
    }

    setIsGenerating(true);
    try {
      const url = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrImage(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error generating QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!qrRef.current) return;

    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code Label - ${itemName}</title>
          <style>
            body { margin: 10mm; display: flex; flex-direction: column; align-items: center; }
            .label { width: 50mm; height: 25mm; border: 1px solid #ccc; padding: 2mm; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            img { width: 30mm; height: 30mm; }
            .text { font-size: 8pt; text-align: center; margin-top: 2mm; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${qrImage}" />
            <div class="text">${itemName}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    if (!qrImage) return;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `QR-${itemName || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={generateQR}
        disabled={isGenerating}
        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
      >
        {isGenerating ? 'Generating...' : 'Generate QR Code'}
      </button>

      {qrImage && (
        <div className="bg-secondary-50 p-6 rounded-lg border border-secondary-200">
          <div ref={qrRef} className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border border-secondary-200">
              <img src={qrImage} alt="QR Code" className="w-48 h-48" />
            </div>
            {itemName && (
              <p className="text-sm font-medium text-secondary-700 text-center">
                {itemName}
              </p>
            )}
            <p className="text-xs text-secondary-600 text-center max-w-xs">
              Data: {data}
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Printer size={18} />
              Print Label
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary-200 text-secondary-900 rounded-lg hover:bg-secondary-300 transition-colors font-medium"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
