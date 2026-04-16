'use client';

/**
 * Reusable QR Scanner component.
 *
 * Supports two input modes:
 *   1. Camera scanning via BarcodeDetector API (Chrome/Edge; falls back to manual entry)
 *   2. Manual paste/type + Enter — works everywhere, including with USB barcode guns
 *      (which act as keyboard and send Enter automatically).
 *
 * Usage:
 *   <QRScanner
 *     onScan={(parsed, raw) => { ... }}
 *     buttonLabel="Scan QR"
 *   />
 *
 * Note: The BarcodeDetector API is a modern standard but not universally supported.
 * If unavailable, the modal still works perfectly with a USB barcode scanner or manual entry.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCode, X, Camera, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseQRCode, ParsedQRCode } from '@/lib/qrParser';

interface QRScannerProps {
  onScan: (parsed: ParsedQRCode, raw: string) => void;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

// TypeScript declaration for the experimental BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement | ImageBitmap) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export default function QRScanner({
  onScan,
  buttonLabel = 'Scan QR',
  buttonVariant = 'outline',
  buttonSize = 'default',
  className = '',
  disabled = false,
}: QRScannerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectRafRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = useCallback(() => {
    if (detectRafRef.current) {
      cancelAnimationFrame(detectRafRef.current);
      detectRafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const handleDetected = useCallback(
    (raw: string) => {
      const parsed = parseQRCode(raw);
      onScan(parsed, raw);
      stopCamera();
      setOpen(false);
      setManualInput('');
    },
    [onScan, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!hasBarcodeDetector) {
      setCameraError('Camera scanning not supported on this browser. Use a USB scanner or paste below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      const detector = new window.BarcodeDetector!({ formats: ['qr_code', 'code_128', 'code_39'] });

      const loop = async () => {
        if (!videoRef.current || !scanning) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0 && codes[0].rawValue) {
            handleDetected(codes[0].rawValue);
            return;
          }
        } catch {
          // ignore frame errors
        }
        detectRafRef.current = requestAnimationFrame(loop);
      };
      detectRafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(msg);
    }
  }, [hasBarcodeDetector, handleDetected, scanning]);

  // Manage camera lifecycle based on open+mode
  useEffect(() => {
    if (open && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // Focus manual input when opened in manual mode
  useEffect(() => {
    if (open && mode === 'manual' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, mode]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    handleDetected(trimmed);
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setManualInput('');
    setCameraError(null);
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <QrCode className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b">
              <button
                type="button"
                className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                  mode === 'manual'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMode('manual')}
              >
                <Keyboard className="h-4 w-4" />
                Paste / Scanner Gun
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                  mode === 'camera'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMode('camera')}
              >
                <Camera className="h-4 w-4" />
                Camera
              </button>
            </div>

            <div className="p-4">
              {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <label className="text-sm text-gray-700 block">
                    Scan with your USB barcode scanner or paste/type the QR text below and press Enter.
                  </label>
                  <Input
                    ref={inputRef}
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g., 21/250.00-RBTR0024-Nos--400.00-GE-RMImport-103852_1_226_03032026"
                    autoComplete="off"
                    className="font-mono text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!manualInput.trim()}>
                      Apply
                    </Button>
                  </div>
                </form>
              )}

              {mode === 'camera' && (
                <div className="space-y-3">
                  {cameraError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-2">
                      {cameraError}
                    </div>
                  )}
                  <div className="relative bg-black rounded overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {scanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3/4 h-3/4 border-2 border-blue-400 rounded-lg opacity-60" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Point the camera at the QR code. Auto-captures on detection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
