import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Locate, Navigation } from 'lucide-react';
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
              <Popup>
                <div className="text-right font-sans min-w-[200px]" dir="rtl">
                  <strong className="block text-primary-700 text-lg mb-1">{pharmacies.name}</strong>
                  <div className="text-sm text-gray-600 mb-2">{pharmacies.address}</div>
                  
                  <div className="bg-gray-50 p-2 rounded-lg mb-2 border border-gray-100">
                    <div className="font-bold text-gray-800">{medicines.trade_name}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-primary-600 font-bold">{price} د.ع</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {quantity > 0 ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs mt-2">
                    <span className={isOpen ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {isOpen ? 'مفتوح الآن' : 'مغلق'}
                    </span>
                    {userLocation && (
                      <span className="text-gray-500">
                        يبعد {
                          calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude) < 1 
                          ? `${Math.round(calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude) * 1000)} متر` 
                          : `${calculateDistance(userLocation.lat, userLocation.lng, pharmacies.latitude, pharmacies.longitude).toFixed(1)} كم`
                        }
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <a 
                      href={`tel:${pharmacies.phone}`}
                      className="flex-1 text-center py-1.5 bg-gray-100 text-[#109419] rounded hover:bg-gray-200 transition-colors text-xs font-bold"
                    >
                      اتصال
                    </a>
                    <a 
                      href={`https://wa.me/${pharmacies.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، هل دواء ${medicines.trade_name} متوفر لديكم؟`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-1.5 bg-[#25D366] text-[#fdfdfd] rounded hover:bg-[#128C7E] transition-colors text-xs font-bold"
                    >
                      واتساب
                    </a>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacies.latitude},${pharmacies.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary-600 text-[#ecedef] rounded hover:bg-primary-700 transition-colors text-xs font-bold"
                    >
                      <Navigation size={12} />
                      الاتجاهات
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
