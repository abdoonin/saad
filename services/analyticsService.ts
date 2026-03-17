import { supabase } from '../lib/supabase';

export interface TopSearch {
  query: string;
  count: number;
}

/**
 * Fetches the most searched terms within a specific area (bounding box) 
 * from the last 30 days.
 */
export const getTopSearchesInArea = async (lat: number, lng: number, radiusDegrees: number = 0.2): Promise<TopSearch[]> => {
  const { data, error } = await supabase
    .from('search_logs')
    .select('query')
    .gte('lat', lat - radiusDegrees)
    .lte('lat', lat + radiusDegrees)
    .gte('lng', lng - radiusDegrees)
    .lte('lng', lng + radiusDegrees)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn("Analytics table 'search_logs' is missing. Please run the SQL script in Supabase.");
    } else {
      console.error("Error fetching analytics:", error);
    }
    return [];
  }

  if (!data) return [];

  // Aggregate in JavaScript
  const counts: Record<string, number> = {};
  data.forEach(log => {
    const q = log.query.trim();
    if (q) {
      counts[q] = (counts[q] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};
