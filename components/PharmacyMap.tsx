import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ExternalLink } from 'lucide-react';
import L from 'leaflet';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface PharmacyMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export const PharmacyMap: React.FC<PharmacyMapProps> = ({ latitude, longitude, name, address }) => {
  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-primary-100 z-0 relative shadow-sm group">
      <MapContainer 
        center={[latitude, longitude]} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-right font-sans" dir="rtl">
              <strong className="block text-primary-700">{name}</strong>
              <span className="text-sm text-gray-600">{address}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Overlay button for Google Maps */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white text-primary-700 px-3 py-2 rounded-lg shadow-md font-bold text-sm hover:bg-primary-50 transition-colors border border-primary-100"
        >
          <ExternalLink size={16} />
          <span>فتح في خرائط جوجل</span>
        </a>
      </div>
    </div>
  );
};
