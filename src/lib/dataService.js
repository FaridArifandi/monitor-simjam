import { supabase, isSupabaseConfigured } from './supabaseClient';
import { demoItems, demoBorrowings, demoOfficeUsers } from './demoData';

// ============================================================
// ITEMS
// ============================================================

let localItems = [...demoItems];
let localBorrowings = [...demoBorrowings];
let localOfficeUsers = [...demoOfficeUsers];


function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Fetch all items
export async function fetchItems() {
  if (!isSupabaseConfigured()) {
    return { data: localItems, error: null };
  }
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

// Fetch single item
export async function fetchItem(id) {
  if (!isSupabaseConfigured()) {
    const item = localItems.find((i) => i.id === id);
    return { data: item || null, error: item ? null : 'Item not found' };
  }
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

// Create item
export async function createItem(item) {
  if (!isSupabaseConfigured()) {
    const newItem = {
      ...item,
      id: generateId(),
      status: 'tersedia',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localItems = [newItem, ...localItems];
    return { data: newItem, error: null };
  }
  const { data, error } = await supabase
    .from('items')
    .insert([item])
    .select()
    .single();
  return { data, error };
}

// Update item
export async function updateItem(id, updates) {
  if (!isSupabaseConfigured()) {
    localItems = localItems.map((i) =>
      i.id === id
        ? { ...i, ...updates, updated_at: new Date().toISOString() }
        : i
    );
    const updated = localItems.find((i) => i.id === id);
    return { data: updated, error: null };
  }
  const { data, error } = await supabase
    .from('items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// Delete item
export async function deleteItem(id) {
  if (!isSupabaseConfigured()) {
    localItems = localItems.filter((i) => i.id !== id);
    return { error: null };
  }
  const { error } = await supabase.from('items').delete().eq('id', id);
  return { error };
}

// ============================================================
// BORROWINGS
// ============================================================

// Fetch all borrowings (with item info)
export async function fetchBorrowings() {
  if (!isSupabaseConfigured()) {
    const enriched = localBorrowings.map((b) => ({
      ...b,
      items: localItems.find((i) => i.id === b.item_id) || null,
    }));
    return { data: enriched, error: null };
  }
  const { data, error } = await supabase
    .from('borrowings')
    .select('*, items(*)')
    .order('created_at', { ascending: false });
  return { data, error };
}

// Fetch borrowings for a specific item
export async function fetchItemBorrowings(itemId) {
  if (!isSupabaseConfigured()) {
    const filtered = localBorrowings
      .filter((b) => b.item_id === itemId)
      .map((b) => ({
        ...b,
        items: localItems.find((i) => i.id === b.item_id) || null,
      }));
    return { data: filtered, error: null };
  }
  const { data, error } = await supabase
    .from('borrowings')
    .select('*, items(*)')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// Create borrowing
export async function createBorrowing(borrowing) {
  if (!isSupabaseConfigured()) {
    const newBorrowing = {
      ...borrowing,
      id: generateId(),
      status: 'dipinjam',
      borrow_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    localBorrowings = [newBorrowing, ...localBorrowings];
    // Update item status
    localItems = localItems.map((i) =>
      i.id === borrowing.item_id ? { ...i, status: 'dipinjam' } : i
    );
    return { data: newBorrowing, error: null };
  }

  const { data, error } = await supabase
    .from('borrowings')
    .insert([{ ...borrowing, status: 'dipinjam' }])
    .select()
    .single();

  if (!error) {
    await supabase
      .from('items')
      .update({ status: 'dipinjam' })
      .eq('id', borrowing.item_id);
  }

  return { data, error };
}

// Return item (update borrowing)
export async function returnBorrowing(borrowingId, returnData = {}) {
  if (!isSupabaseConfigured()) {
    let itemId = null;
    localBorrowings = localBorrowings.map((b) => {
      if (b.id === borrowingId) {
        itemId = b.item_id;
        return {
          ...b,
          ...returnData,
          status: 'dikembalikan',
          actual_return_date: new Date().toISOString(),
        };
      }
      return b;
    });
    if (itemId) {
      // Check if there are other active borrowings for the same item
      const otherActive = localBorrowings.some(
        (b) =>
          b.item_id === itemId &&
          b.id !== borrowingId &&
          b.status === 'dipinjam'
      );
      if (!otherActive) {
        localItems = localItems.map((i) =>
          i.id === itemId ? { ...i, status: 'tersedia' } : i
        );
      }
    }
    return { error: null };
  }

  // Get the borrowing to find the item_id
  const { data: borrowing } = await supabase
    .from('borrowings')
    .select('item_id')
    .eq('id', borrowingId)
    .single();

  const { error } = await supabase
    .from('borrowings')
    .update({
      ...returnData,
      status: 'dikembalikan',
      actual_return_date: new Date().toISOString(),
    })
    .eq('id', borrowingId);

  if (!error && borrowing) {
    await supabase
      .from('items')
      .update({ status: 'tersedia' })
      .eq('id', borrowing.item_id);
  }

  return { error };
}

// ============================================================
// FILE UPLOAD
// ============================================================

export async function uploadPhoto(file, folder = 'borrowings') {
  if (!isSupabaseConfigured()) {
    // Return a fake URL for demo mode
    return { url: URL.createObjectURL(file), error: null };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(fileName, file);

  if (error) return { url: null, error };

  const {
    data: { publicUrl },
  } = supabase.storage.from('photos').getPublicUrl(fileName);

  return { url: publicUrl, error: null };
}

// ============================================================
// OFFICE USERS (ANGGOTA)
// ============================================================

export async function fetchOfficeUsers() {
  if (!isSupabaseConfigured()) {
    return { data: localOfficeUsers, error: null };
  }
  const { data, error } = await supabase
    .from('office_users')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createOfficeUser(user) {
  if (!isSupabaseConfigured()) {
    const newUser = {
      ...user,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    localOfficeUsers = [newUser, ...localOfficeUsers];
    return { data: newUser, error: null };
  }
  const { data, error } = await supabase
    .from('office_users')
    .insert([user])
    .select()
    .single();
  return { data, error };
}

export async function updateOfficeUser(id, updates) {
  if (!isSupabaseConfigured()) {
    localOfficeUsers = localOfficeUsers.map((u) =>
      u.id === id ? { ...u, ...updates } : u
    );
    const updated = localOfficeUsers.find((u) => u.id === id);
    return { data: updated, error: null };
  }
  const { data, error } = await supabase
    .from('office_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteOfficeUser(id) {
  if (!isSupabaseConfigured()) {
    localOfficeUsers = localOfficeUsers.filter((u) => u.id !== id);
    return { error: null };
  }
  const { error } = await supabase.from('office_users').delete().eq('id', id);
  return { error };
}

