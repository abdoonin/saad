import React, { useState } from 'react';
import { MapPin, Phone, CheckCircle, XCircle, Map, Navigation, MessageCircle } from 'lucide-react';
import { SearchResult } from '../types';
import { PharmacyMap } from './PharmacyMap';
import { calculateDistance } from '../utils/distance';
import { isPharmacyOpen } from '../utils/pharmacy';

interface ResultCardProps {
  data: SearchResult;
  userLocation?: { lat: number, lng: number } | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, userLocation }) => {
  const { medicines, pharmacies, price, quantity } = data;
  const [showMap, setShowMap] = useState(false);

  if (!medicines || !pharmacies) return null;

  const displayStatus = isPharmacyOpen(pharmacies);

  return (
    <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Medicine Info */}
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{medicines.trade_name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
              {price} د.ع
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">{medicines.scientific_name}</p>

          <div className="flex items-center gap-2 mb-4">
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {quantity > 0 ? 'متوفر' : 'غير متوفر'}
            </span>
            {quantity > 0 && (
              <span className="text-xs text-gray-400">الكمية: {quantity}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 my-4"></div>

      {/* Pharmacy Info */}
      <div className="flex flex-col justify-between gap-4 mt-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-800">{pharmacies.name}</h4>
            {displayStatus ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle size={10} /> مفتوح
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <XCircle size={10} /> مغلق
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={14} className="text-gray-400" />
            <span>{pharmacies.address}</span>
            {userLocation && pharmacies.latitude && pharmacies.longitude && (
              <span className="text-primary-600 font-medium text-xs bg-primary-50 px-2 py-0.5 rounded-full mr-2">
                يبعد {
                  calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude) < 1 
                  ? `${Math.round(calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude) * 1000)} متر` 
                  : `${calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude).toFixed(1)} كم`
                }
              </span>
            )}
          </div>
          {pharmacies.opening_time && pharmacies.closing_time && (
            <div className="text-xs text-gray-500 mt-1">
              ساعات العمل: {pharmacies.opening_time} - {pharmacies.closing_time}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <a 
            href={`tel:${pharmacies.phone}`}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200 transition-all text-sm shadow-sm"
          >
            <Phone size={14} />
            <span>اتصل</span>
          </a>
          <a 
            href={`https://wa.me/${pharmacies.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، هل دواء ${medicines.trade_name} متوفر لديكم؟`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#128C7E] transition-all text-sm shadow-sm"
          >
            <MessageCircle size={14} />
            <span>واتساب</span>
          </a>
          {pharmacies.latitude && pharmacies.longitude && (
            <>
              <button 
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg font-medium transition-all text-sm shadow-sm ${
                  showMap 
                    ? 'bg-primary-50 text-primary-700 border-primary-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200'
                }`}
              >
                <Map size={14} />
                <span>{showMap ? 'إخفاء' : 'خريطة'}</span>
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacies.latitude},${pharmacies.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all text-sm shadow-sm"
              >
                <Navigation size={14} />
                <span>اتجاهات</span>
              </a>
            </>
          )}
        </div>
      </div>

      {showMap && pharmacies.latitude && pharmacies.longitude && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <PharmacyMap 
            latitude={pharmacies.latitude} 
            longitude={pharmacies.longitude} 
            name={pharmacies.name}
            address={pharmacies.address}
          />
        </div>
      )}
    </div>
  );
};