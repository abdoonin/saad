import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Locate, Navigation, Phone, MessageCircle } from 'lucide-react';
import L from 'leaflet';
import { SearchResult } from '../types';
import { isPharmacyOpen } from '../utils/pharmacy';
import { calculateDistance } from '../utils/distance';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ResultsMapProps {
  results: SearchResult[];
  userLocation?: { lat: number, lng: number } | null;
}

// Component to automatically fit map bounds to show all markers
const MapBounds: React.FC<{ results: SearchResult[], userLocation?: { lat: number, lng: number } | null }> = ({ results, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);
    
    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lng]);
    }
    
    results.forEach(result => {
      if (result.pharmacies?.latitude && result.pharmacies?.longitude) {
        bounds.extend([result.pharmacies.latitude, result.pharmacies.longitude]);
      }
    });

    if (bounds.isValid()) {
      // Fit bounds with padding to ensure markers aren't cut off at the edges
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, results, userLocation]);

  return null;
};

export const ResultsMap: React.FC<ResultsMapProps> = ({ results, userLocation }) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Filter out results without coordinates
  const mapResults = results.filter(r => r.pharmacies && r.pharmacies.latitude && r.pharmacies.longitude);
  
  if (mapResults.length === 0 && !userLocation) {
    return (
      <div className="h-96 w-full rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
        لا توجد إحداثيات متاحة لعرض الخريطة
      </div>
    );
  }

  // Calculate center: use user location if available, otherwise first result
  const centerLat = userLocation ? userLocation.lat : mapResults[0]?.pharmacies?.latitude || 33.3152;
  const centerLng = userLocation ? userLocation.lng : mapResults[0]?.pharmacies?.longitude || 44.3661;
  const zoomLevel = userLocation ? 13 : 12;

  const handleLocateMe = () => {
    if (mapInstance && userLocation) {
      mapInstance.flyTo([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 1.5
      });
    }
  };

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden border-2 border-primary-100 z-0 relative shadow-md">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={zoomLevel} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
        ref={setMapInstance}
      >
        <MapBounds results={mapResults} userLocation={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-right font-sans font-bold text-red-600" dir="rtl">
                موقعك الحالي
              </div>
            </Popup>
          </Marker>
        )}

        {mapResults.map((result) => {
          const { pharmacies, medicines, price, quantity } = result;
          if (!pharmacies || !pharmacies.latitude || !pharmacies.longitude || !medicines) return null;
          
          const isOpen = isPharmacyOpen(pharmacies);
          
          return (
            <Marker 
              key={result.id} 
              position={[pharmacies.latitude, pharmacies.longitude]}
            >
              <Popup className="rounded-2xl border-none">
                <div className="text-right font-sans min-w-[250px] p-4" dir="rtl">
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <h3 className="text-[#137b70] font-extrabold text-lg leading-tight mb-1">{pharmacies.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{pharmacies.address}</p>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 shadow-sm">
                    <div className="font-extrabold text-gray-800 text-base mb-3 leading-snug">{medicines.trade_name}</div>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 mb-0.5 font-bold">السعر</span>
                        <span className="text-[#137b70] font-black text-lg leading-none">{price} <span className="text-xs font-bold text-gray-400">د.ع</span></span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${quantity > 0 ? 'bg-[#cff5e1] text-[#137b70] border-[#b4e6c9] border' : 'bg-red-100 text-red-700 border-red-200 border'}`}>
                        {quantity > 0 ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isOpen ? 'bg-[#15af4c]' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-bold ${isOpen ? 'text-[#15af4c]' : 'text-red-500'}`}>
                        {isOpen ? 'مفتوح الآن' : 'مغلق'}
                      </span>
                    </div>
                    {userLocation && (
                      <span className="text-gray-500 font-bold bg-gray-50 text-[10px] px-2 py-0.5 rounded-md border border-gray-100">
                        يبعد {
                          calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude) < 1 
                          ? `${Math.round(calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude) * 1000)} م` 
                          : `${calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude).toFixed(1)} كم`
                        }
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <a 
                      href={`tel:${pharmacies.phone}`}
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-bold text-xs border border-gray-200"
                    >
                      <Phone size={14} className="text-blue-600" />
                      <span>اتصال</span>
                    </a>
                    <a 
                      href={`https://wa.me/${pharmacies.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، هل دواء ${medicines.trade_name} متوفر لديكم؟`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-all font-bold text-xs shadow-sm"
                    >
                      <MessageCircle size={14} className="text-white" />
                      <span>واتساب</span>
                    </a>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacies.latitude},${pharmacies.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-[#e8f0fe] text-[#1a73e8] rounded-lg hover:bg-[#d2e3fc] transition-all font-bold text-xs border border-[#d2e3fc]"
                    >
                      <Navigation size={14} className="text-[#1a73e8]" />
                      <span>الاتجاهات</span>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Locate Me Button Overlay */}
      {userLocation && (
        <div className="absolute bottom-6 left-4 z-[1000]">
          <button 
            onClick={handleLocateMe}
            className="flex items-center gap-2 bg-white text-primary-700 px-4 py-3 rounded-full shadow-lg font-bold text-sm hover:bg-primary-50 transition-all border border-primary-100 hover:scale-105"
            title="العودة لموقعي"
          >
            <Locate size={18} className="text-red-500" />
            <span>موقعي</span>
          </button>
        </div>
      )}
    </div>
  );
};
