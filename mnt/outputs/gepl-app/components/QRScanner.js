'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

const QRScanner = ({ onScan, onError = null }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isScanning) return;

    const startScanning = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          scannerRef.current = setInterval(captureFrame, 500);
        }
      } catch (err) {
        const errorMsg = 'Camera access denied or not available';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        clearInterval(scannerRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [isScanning, onError]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    const video = videoRef.current;

    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    const imageData = canvasRef.current.toDataURL('image/png');
    decodeQR(imageData);
  };

  const decodeQR = async (imageSrc) => {
    try {
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector();
        const barcodes = await barcodeDetector.detect(
          new Image({ src: imageSrc })
        );

        if (barcodes && barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          setError('');
          setIsScanning(false);
          onScan(qrData);
        }
      }
    } catch (err) {
      console.log('Barcode detection not available, using fallback');
    }
  };

  const handleManualInput = (e) => {
    const value = e.target.value.trim();
    if (value) {
      onScan(value);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <button
          onClick={() => {
            setIsScanning(true);
            setError('');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Camera size={18} />
          Start QR Scanner
        </button>
      ) : (
        <button
          onClick={() => setIsScanning(false)}
          className="w-full px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors font-medium"
        >
          Stop Scanner
        </button>
      )}

      {isScanning && (
        <div className="bg-secondary-900 rounded-lg overflow-hidden border-4 border-primary-600">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 border-2 border-primary-400 m-12 pointer-events-none">
            <div className="text-center text-white text-sm mt-4">
              Point camera at QR code
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="flex gap-2 items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={18} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-secondary-700">
          Or paste QR data manually:
        </label>
        <input
          type="text"
          placeholder="Paste QR data here..."
          onBlur={handleManualInput}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleManualInput(e);
            }
          }}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>
    </div>
  );
};

export default QRScanner;
