import { supabase } from '../lib/supabase';
import { SearchResult } from '../types';

/**
 * Logs a search query for analytics purposes.
 */
export const logSearch = async (query: string, lat?: number, lng?: number) => {
  if (!query.trim()) return;
  try {
    const { error } = await supabase.from('search_logs').insert({
      query: query.trim().toLowerCase(),
      lat,
      lng
    });
    if (error && error.code !== 'PGRST205') {
      console.error("Error logging search:", error);
    }
  } catch (err) {
    // Ignore network errors or other unexpected issues for analytics logging
  }
};

/**
 * Searches for medicines in the inventory matching the trade name or scientific name.
 * Uses a partial case-insensitive match (ILIKE).
 */
export const searchMedicines = async (queryTerm: string, lat?: number, lng?: number): Promise<SearchResult[]> => {
  const term = queryTerm.trim();
  
  // Log the search asynchronously
  logSearch(term, lat, lng);

  // Perform the actual query
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      price,
      quantity,
      medicines!inner (
        trade_name,
        scientific_name
      ),
      pharmacies!inner (
        name,
        address,
        phone,
        is_open,
        latitude,
        longitude,
        opening_time,
        closing_time
      )
    `)
    // Search in both trade_name and scientific_name of the joined medicines table
    .or(`trade_name.ilike.%${term}%,scientific_name.ilike.%${term}%`, { foreignTable: 'medicines' });

  if (error) {
    throw error;
  }

  return data as unknown as SearchResult[];
};

/**
 * Searches for alternative medicines based on the scientific name of the query term.
 */
export const searchAlternatives = async (queryTerm: string): Promise<SearchResult[]> => {
  const term = queryTerm.trim();

  // 1. Find the scientific name(s) of the searched medicine
  const { data: medData, error: medError } = await supabase
    .from('medicines')
    .select('scientific_name')
    .ilike('trade_name', `%${term}%`)
    .limit(5);
    
  if (medError || !medData || medData.length === 0) {
    return [];
  }
  
  // Extract unique scientific names
  const scientificNames = Array.from(new Set(medData.map(m => m.scientific_name).filter(Boolean)));
  
  if (scientificNames.length === 0) {
    return [];
  }
  
  // 2. Search inventory for these scientific names
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      price,
      quantity,
      medicines!inner (
        trade_name,
        scientific_name
      ),
      pharmacies!inner (
        name,
        address,
        phone,
        is_open,
        latitude,
        longitude,
        opening_time,
        closing_time
      )
    `)
    .in('medicines.scientific_name', scientificNames)
    // Exclude the exact trade name the user searched for to only show true alternatives
    .not('medicines.trade_name', 'ilike', `%${term}%`);

  if (error) {
    console.error("Error fetching alternatives:", error);
    return [];
  }

  return data as unknown as SearchResult[];
};
