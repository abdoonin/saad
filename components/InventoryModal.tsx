import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Camera, Barcode } from 'lucide-react';
import { DashboardInventoryItem } from '../types';
import { BarcodeScanner } from './BarcodeScanner';
import { getMedicineByBarcode } from '../utils/barcodeDb';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<DashboardInventoryItem, 'id' | 'medicine_id'>) => Promise<void>;
  initialData?: DashboardInventoryItem;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [barcode, setBarcode] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isScanning, setIsScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBarcode('');
      setTradeName(initialData.trade_name);
      setScientificName(initialData.scientific_name);
      setPrice(initialData.price.toString());
      setQuantity(initialData.quantity.toString());
      setErrors({});
      setBarcodeNotFound(false);
    } else {
      setBarcode('');
      setTradeName('');
      setScientificName('');
      setPrice('');
      setQuantity('');
      setErrors({});
      setBarcodeNotFound(false);
    }
  }, [initialData, isOpen]);

  // Focus barcode input when opening for new item
  useEffect(() => {
    if (isOpen && !initialData) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

  const handleBarcodeChange = async (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setBarcodeNotFound(false);
    if (!scannedBarcode || scannedBarcode.length < 5) return; // Wait for a reasonable barcode length

    setIsFetchingBarcode(true);
    try {
      const medicine = await getMedicineByBarcode(scannedBarcode);
      if (medicine) {
        setTradeName(medicine.trade_name);
        setScientificName(medicine.scientific_name);
        setPrice(medicine.price.toString());
        setErrors({});
        setBarcodeNotFound(false);
      } else {
        setBarcodeNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching barcode:", error);
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  const handleBarcodeScan = (scannedBarcode: string) => {
    setIsScanning(false);
    handleBarcodeChange(scannedBarcode);
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!tradeName.trim()) {
      newErrors.tradeName = 'الاسم التجاري مطلوب';
      isValid = false;
    }

    if (!scientificName.trim()) {
      newErrors.scientificName = 'الاسم العلمي مطلوب';
      isValid = false;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'السعر يجب أن يكون رقماً موجباً أكبر من الصفر';
      isValid = false;
    }

    const qtyNum = parseFloat(quantity);
    if (!quantity || isNaN(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
      newErrors.quantity = 'الكمية يجب أن تكون رقماً صحيحاً (بدون كسور) وغير سالب';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave({
        trade_name: tradeName,
        scientific_name: scientificName,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        barcode: barcode.trim() || undefined
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
            <h3 className="text-xl font-bold text-gray-800">
              {initialData ? 'تعديل الدواء' : 'إضافة دواء جديد'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              {!initialData && (
                <div className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100 mb-6">
                  <label className="block text-sm font-bold text-primary-800 mb-2 flex items-center gap-2">
                    <Barcode size={16} />
                    مسح الباركود (اختياري)
                  </label>
                  <div className="flex gap-2 relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcode}
                      onChange={(e) => handleBarcodeChange(e.target.value)}
                      className="block w-full px-4 py-3 bg-white border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none transition-all pr-10"
                      placeholder="مرر القارئ هنا أو أدخل الرقم..."
                    />
                    {isFetchingBarcode && (
                      <div className="absolute left-16 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsScanning(true)}
                      className="flex items-center justify-center gap-2 bg-primary-100 hover:bg-primary-200 text-primary-700 px-4 py-3 rounded-xl font-bold transition-colors shrink-0"
                      title="استخدام كاميرا الجهاز"
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                  <p className="text-xs text-primary-600 mt-2">
                    سيتم تعبئة بيانات الدواء تلقائياً إذا كان الباركود مسجلاً في النظام.
                  </p>
                  {barcodeNotFound && (
                    <div className="mt-3 bg-white/60 text-amber-700 p-3 rounded-xl border border-amber-200 text-sm font-medium flex gap-2 items-start">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p>
                        هذا الباركود غير مسجل مسبقاً. قم بإدخال بيانات الدواء يدوياً هذه المرة، وسيقوم النظام بتذكرها في المرات القادمة!
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم التجاري</label>
                <input
                  type="text"
                  disabled={!!initialData} // Disable name edit if updating inventory only
                  value={tradeName}
                  onChange={(e) => {
                    setTradeName(e.target.value);
                    if (errors.tradeName) setErrors({...errors, tradeName: ''});
                  }}
                  className={`block w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-60 transition-all ${
                    errors.tradeName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
                  }`}
                  placeholder="مثال: Panadol Extra"
                />
                {errors.tradeName && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                    <AlertCircle size={12} />
                    {errors.tradeName}
                  </p>
                )}
              </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الاسم العلمي</label>
              <input
                type="text"
                disabled={!!initialData}
                value={scientificName}
                onChange={(e) => {
                  setScientificName(e.target.value);
                  if (errors.scientificName) setErrors({...errors, scientificName: ''});
                }}
                className={`block w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-60 transition-all ${
                  errors.scientificName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
                }`}
                placeholder="مثال: Paracetamol"
              />
              {errors.scientificName && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                  <AlertCircle size={12} />
                  {errors.scientificName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">السعر (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) setErrors({...errors, price: ''});
                  }}
                  className={`block w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all ${
                    errors.price ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                    <AlertCircle size={12} />
                    {errors.price}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الكمية</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    if (errors.quantity) setErrors({...errors, quantity: ''});
                  }}
                  className={`block w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all ${
                    errors.quantity ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
                  }`}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                    <AlertCircle size={12} />
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 pb-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={18} />
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    {isScanning && (
      <BarcodeScanner 
        onScan={handleBarcodeScan} 
        onClose={() => setIsScanning(false)} 
      />
    )}
    </>
  );
};