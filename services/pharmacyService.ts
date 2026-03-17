import { supabase } from '../lib/supabase';
import { DashboardInventoryItem, User, Pharmacy, Medicine } from '../types';

// --- AUTH ---

export const pharmacyLogin = async (email: string, password?: string): Promise<User> => {
  if (!password) {
    throw new Error('Password is required for login');
  }

  // البحث والمطابقة في جدول الصيدليات مباشرة (للتجربة المحلية)
  const { data: profileData, error: profileError } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (profileError || !profileData) {
    console.error('Login error:', profileError);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  return {
    id: profileData.id,
    pharmacyId: profileData.id,
    email: profileData.email,
    name: profileData.name,
    address: profileData.address || 'العنوان غير محدد',
    isAdmin: profileData.is_admin
  };
};

// --- PHARMACY PROFILE MANAGEMENT ---

export const getPharmacyDetails = async (id: string): Promise<Pharmacy> => {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Pharmacy;
};

export const updatePharmacyProfile = async (id: string, updates: Partial<Pharmacy>) => {
  // Attempt the update against Supabase
  const { data, error } = await supabase
    .from('pharmacies')
    .update(updates)
    .eq('id', id)
    .select();

  // Robust Error Handling & Optimistic Fallback
  if (error || !data || data.length === 0) {
    throw error || new Error('Failed to update profile');
  }

  return data[0];
};

// --- INVENTORY MANAGEMENT ---

export const getPharmacyInventory = async (pharmacyId: string): Promise<DashboardInventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      price,
      quantity,
      medicine_id,
      medicines (
        trade_name,
        scientific_name
      )
    `)
    .eq('pharmacy_id', pharmacyId);

  if (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }

  return data.map((item: any) => {
    const medicine = Array.isArray(item.medicines) ? item.medicines[0] : item.medicines;
    
    return {
      id: item.id,
      medicine_id: item.medicine_id,
      trade_name: medicine?.trade_name || 'Unknown',
      scientific_name: medicine?.scientific_name || 'Unknown',
      price: item.price,
      quantity: item.quantity
    };
  });
};

export const addInventoryItem = async (pharmacyId: string, item: Omit<DashboardInventoryItem, 'id' | 'medicine_id'>) => {
  try {
    let medicineId: string | null = null;

    // Try to find by Trade Name
    let { data: existingMedicines, error: searchError } = await supabase
      .from('medicines')
      .select('id')
      .ilike('trade_name', item.trade_name)
      .limit(1);
    
    if (searchError) throw searchError;

    medicineId = existingMedicines?.[0]?.id || null;

    // If not found, Create new Medicine
    if (!medicineId) {
      const { data: newMedicine, error: createError } = await supabase
        .from('medicines')
        .insert({
          trade_name: item.trade_name,
          scientific_name: item.scientific_name
        })
        .select('id')
        .single();
      
      if (createError) throw createError;
      medicineId = newMedicine.id;
    }

    // Create Inventory Entry
    const { data: newInventory, error: invError } = await supabase
      .from('inventory')
      .insert({
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        price: item.price,
        quantity: item.quantity
      })
      .select(`
        id,
        price,
        quantity,
        medicine_id,
        medicines (
          trade_name,
          scientific_name
        )
      `)
      .single();

    if (invError) throw invError;

    const medicineData = Array.isArray((newInventory as any).medicines) 
      ? (newInventory as any).medicines[0] 
      : (newInventory as any).medicines;

    const formattedItem: DashboardInventoryItem = {
      id: newInventory.id,
      medicine_id: newInventory.medicine_id,
      trade_name: medicineData?.trade_name || item.trade_name,
      scientific_name: medicineData?.scientific_name || item.scientific_name,
      price: newInventory.price,
      quantity: newInventory.quantity
    };
    
    return formattedItem;

  } catch (err) {
    console.error('Transaction failed in addInventoryItem:', err);
    throw err;
  }
};

export const updateInventoryItem = async (id: string, updates: Partial<DashboardInventoryItem>) => {
  const { error } = await supabase
    .from('inventory')
    .update({
      price: updates.price,
      quantity: updates.quantity
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase update inventory error:', error.message);
    throw error;
  }
};

export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase delete inventory error:', error.message);
    throw error;
  }
};

export const recordSale = async (pharmacyId: string, inventoryId: string, quantity: number, pricePerUnit: number) => {
  try {
    // 1. Get current quantity
    const { data: currentItem, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', inventoryId)
      .single();

    if (fetchError || !currentItem) throw new Error('Item not found');
    if (currentItem.quantity < quantity) throw new Error('الكمية المطلوبة غير متوفرة في المخزون');

    // 2. Update inventory (decrease quantity)
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: currentItem.quantity - quantity })
      .eq('id', inventoryId);

    if (updateError) throw updateError;

    // 3. Log the sale
    const { error: logError } = await supabase
      .from('sales_logs')
      .insert({
        pharmacy_id: pharmacyId,
        inventory_id: inventoryId,
        quantity: quantity,
        total_price: quantity * pricePerUnit
      });

    if (logError) {
      if (logError.code === 'PGRST205') {
        console.warn("Sales logs table 'sales_logs' is missing. Please run the SQL script in Supabase.");
      } else {
        console.error('Error logging sale:', logError);
      }
      // We don't throw here because the inventory was already updated successfully
    }

    return true;
  } catch (err) {
    console.error('Sale recording failed:', err);
    throw err;
  }
};

export const getSalesLogs = async (pharmacyId: string) => {
  const { data, error } = await supabase
    .from('sales_logs')
    .select(`
      id,
      quantity,
      total_price,
      created_at,
      inventory:inventory_id (
        medicines (
          trade_name,
          scientific_name
        )
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn("Sales logs table 'sales_logs' is missing. Please run the SQL script in Supabase.");
      return [];
    }
    console.error('Error fetching sales logs:', error);
    throw error;
  }

  return data.map((log: any) => {
    const medicine = Array.isArray(log.inventory?.medicines) 
      ? log.inventory.medicines[0] 
      : log.inventory?.medicines;
      
    return {
      id: log.id,
      trade_name: medicine?.trade_name || 'Unknown',
      scientific_name: medicine?.scientific_name || 'Unknown',
      quantity: log.quantity,
      total_price: log.total_price,
      created_at: log.created_at
    };
  });
};

export const bulkAddInventory = async (pharmacyId: string, items: Omit<DashboardInventoryItem, 'id' | 'medicine_id'>[]) => {
  try {
    const results: DashboardInventoryItem[] = [];
    // Process sequentially to avoid overwhelming the database and handle medicine creation
    for (const item of items) {
      try {
        const addedItem = await addInventoryItem(pharmacyId, item);
        results.push(addedItem);
      } catch (err) {
        console.error(`Failed to add item ${item.trade_name}:`, err);
        // Continue with other items even if one fails
      }
    }
    return results;
  } catch (err) {
    console.error('Bulk add failed:', err);
    throw err;
  }
};