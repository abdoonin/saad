import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We need a small delay to ensure the DOM element is ready
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScan(decodedText);
          },
          (errorMessage) => {
            // ignore continuous scanning errors
          }
        );

        return () => {
          scanner.clear().catch(console.error);
        };
      } catch (err) {
        console.error("Scanner initialization error:", err);
        setError("تعذر تشغيل الكاميرا. يرجى التأكد من منح الصلاحيات.");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Camera size={20} className="text-primary-600" />
            مسح الباركود
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={24} />
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <>
              <div id="reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300"></div>
              <p className="text-center text-sm text-gray-500 mt-4 font-medium">
                قم بتوجيه الكاميرا نحو باركود الدواء ليتم قراءته تلقائياً
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
