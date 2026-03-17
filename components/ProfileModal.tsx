import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Building2, MapPin, Phone, Map, Clock } from 'lucide-react';
import { Pharmacy } from '../types';
import { LocationPicker } from './LocationPicker';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Pharmacy>) => Promise<void>;
  initialData: Pharmacy | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAddress(initialData.address);
      setPhone(initialData.phone || '');
      setLatitude(initialData.latitude);
      setLongitude(initialData.longitude);
      setOpeningTime(initialData.opening_time || '');
      setClosingTime(initialData.closing_time || '');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !address.trim()) {
      setError('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      await onSave({ 
        name, 
        address, 
        phone, 
        latitude, 
        longitude,
        opening_time: openingTime || null,
        closing_time: closingTime || null
      });
      onClose();
    } catch (err) {
      setError('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h3 className="text-xl font-bold text-gray-800">تعديل بيانات الصيدلية</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">اسم الصيدلية</label>
              <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  placeholder="اسم الصيدلية"
                  />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
               <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  placeholder="المدينة - الحي - الشارع"
                  />
               </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
               <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  placeholder="05xxxxxxxx"
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">وقت الفتح (تلقائي)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="block w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">وقت الإغلاق (تلقائي)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="block w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الموقع على الخريطة</label>
              <p className="text-xs text-gray-500 mb-2">انقر على الخريطة لتحديد موقع الصيدلية بدقة</p>
              <LocationPicker 
                latitude={latitude} 
                longitude={longitude} 
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }} 
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

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
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};