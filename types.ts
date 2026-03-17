export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  is_open: boolean;
  email?: string;
  latitude?: number;
  longitude?: number;
  opening_time?: string | null;
  closing_time?: string | null;
  is_admin?: boolean;
}

export interface Medicine {
  id: string;
  trade_name: string;
  scientific_name: string;
  barcode?: string;
}

export interface InventoryItem {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  price: number;
  quantity: number;
}

// Joined result interface for the UI
export interface SearchResult {
  id: string; // Inventory ID
  price: number;
  quantity: number;
  medicines: {
    trade_name: string;
    scientific_name: string;
    barcode?: string;
  } | null;
  pharmacies: {
    name: string;
    address: string;
    phone: string;
    is_open: boolean;
    latitude?: number;
    longitude?: number;
    opening_time?: string | null;
    closing_time?: string | null;
  } | null;
}

export interface User {
  id: string;
  pharmacyId: string;
  email: string;
  name: string;
  address: string;
  isAdmin?: boolean;
}

export interface DashboardInventoryItem {
  id: string;
  price: number;
  quantity: number;
  medicine_id: string;
  trade_name: string;
  scientific_name: string;
  barcode?: string;
}