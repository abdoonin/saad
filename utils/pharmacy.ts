import { SearchResult } from '../types';

export const isPharmacyOpen = (pharmacy: SearchResult['pharmacies']): boolean => {
  if (!pharmacy) return false;
  
  // 1. Manual override: If pharmacist explicitly closed it (for prayer/emergency)
  if (pharmacy.is_open === false) {
    return false;
  }
  
  // 2. If no automatic hours are set, it's open (since is_open is true here)
  if (!pharmacy.opening_time || !pharmacy.closing_time) {
    return true;
  }
  
  // 3. Check automatic hours
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + currentMinute / 60;

  const [openHour, openMinute] = pharmacy.opening_time.split(':').map(Number);
  const [closeHour, closeMinute] = pharmacy.closing_time.split(':').map(Number);
  
  const openTime = openHour + openMinute / 60;
  const closeTime = closeHour + closeMinute / 60;

  if (closeTime < openTime) {
    // Crosses midnight
    return currentTime >= openTime || currentTime <= closeTime;
  }
  return currentTime >= openTime && currentTime <= closeTime;
};
