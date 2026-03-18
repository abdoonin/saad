import React, { useRef, useState } from 'react';
import { Search, Camera, Loader2, X } from 'lucide-react';
import { extractMedicineNameFromImage } from '../services/ocrService';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  loading: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  value, 
  onChange, 
  onSearch, 
  loading,
  onKeyDown
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const cancelRef = useRef(false);

  const handleCancelImageProcessing = () => {
    cancelRef.current = true;
    setIsProcessingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    cancelRef.current = false;
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (cancelRef.current) {
            reject(new Error('Cancelled'));
            return;
          }
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (cancelRef.current) return;

      const extractedText = await extractMedicineNameFromImage(base64String, file.type);
      
      if (cancelRef.current) return;

      if (extractedText) {
        onChange(extractedText);
      } else {
        alert('لم يتم العثور على اسم دواء في الصورة.');
      }
    } catch (error: any) {
      if (error.message === 'Cancelled') return;
      console.error(error);
      alert('حدث خطأ أثناء معالجة الصورة.');
    } finally {
      if (!cancelRef.current) {
        setIsProcessingImage(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full pr-10 sm:pr-12 pl-28 sm:pl-44 py-3 sm:py-4 bg-white border border-gray-200 rounded-2xl text-base sm:text-lg shadow-sm placeholder-gray-400 
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
          placeholder={isProcessingImage ? "جاري قراءة الصورة..." : "ابحث باسم الدواء..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isProcessingImage}
        />
        <div className="absolute inset-y-1.5 left-1.5 flex gap-1.5 sm:gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          {isProcessingImage ? (
            <button
              onClick={handleCancelImageProcessing}
              className="h-full px-2.5 sm:px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
              title="إلغاء قراءة الصورة"
            >
              <Loader2 className="animate-spin" size={18} />
              <X size={18} />
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="h-full px-2.5 sm:px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="البحث باستخدام صورة الروشتة أو الدواء"
            >
              <Camera size={18} />
            </button>
          )}
          <button
            onClick={onSearch}
            disabled={loading || !value.trim() || isProcessingImage}
            className="h-full px-4 sm:px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm text-sm sm:text-base"
          >
            {loading ? '...' : 'بحث'}
          </button>
        </div>
      </div>
    </div>
  );
};