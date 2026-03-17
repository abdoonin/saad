import { supabase } from '../lib/supabase';
import { Pharmacy, Medicine } from '../types';

export const getAllPharmacies = async (): Promise<Pharmacy[]> => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Pharmacy[];
};

export const deletePharmacy = async (id: string) => {
  const { error } = await supabase
    .from('pharmacies')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const togglePharmacyAdmin = async (id: string, isAdmin: boolean) => {
  const { error } = await supabase
    .from('pharmacies')
    .update({ is_admin: isAdmin })
    .eq('id', id);

  if (error) throw error;
};

export const getGlobalStats = async () => {
  const [pharmacies, medicines, inventory, searches] = await Promise.all([
    supabase.from('pharmacies').select('id', { count: 'exact', head: true }),
    supabase.from('medicines').select('id', { count: 'exact', head: true }),
    supabase.from('inventory').select('id', { count: 'exact', head: true }),
    supabase.from('search_logs').select('id', { count: 'exact', head: true })
  ]);

  return {
    pharmaciesCount: pharmacies.count || 0,
    medicinesCount: medicines.count || 0,
    inventoryCount: inventory.count || 0,
    searchesCount: searches.count || 0
  };
};

export const getAllMedicines = async (): Promise<Medicine[]> => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .order('trade_name', { ascending: true });

  if (error) throw error;
  return data as Medicine[];
};

export const deleteMedicine = async (id: string) => {
  const { error } = await supabase
    .from('medicines')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const createPharmacy = async (pharmacy: Omit<Pharmacy, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('pharmacies')
    .insert([pharmacy])
    .select()
    .single();

  if (error) throw error;
  return data as Pharmacy;
};
