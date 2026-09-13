import { 
  Branch, 
  Booking, 
  RoomDetailResponse, 
  MonthlyReportResponse, 
  DailyReportResponse, 
  ReportRecord 
} from '../types';

// Render / External API base URL (configured via VITE_API_URL on Vercel)
const API_BASE = (((import.meta as any).env?.VITE_API_URL || '') as string).replace(/\/$/, '');

// Storage keys for Cloud / Serverless offline fallback
const STORAGE_KEYS = {
  BRANCHES: 'hotel_branches_v4',
  BOOKINGS: 'hotel_bookings_v4'
};

// Clear any legacy mock data from previous versions
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('hotel_branches_data');
    window.localStorage.removeItem('hotel_bookings_data');
  }
} catch {}

// Initial fallback seed (Clean 0 start)
function getInitialFallbackData() {
  const branches: Branch[] = [
    {
      id: 1,
      name: '1-Filial (Bodomzor)',
      address: "Toshkent sh., Bodomzor yo'li",
      phone: '+998 (71) 200-11-22',
      total_rooms: 8,
      occupied_rooms: 0,
      available_rooms: 8,
      active_guests_total: 0,
      total_capacity: 80,
      total_cash: 0,
      total_card: 0,
      total_advance: 0,
      total_debt: 0,
      total_bookings: 0
    },
    {
      id: 2,
      name: '2-Filial (Yunusobod)',
      address: "Toshkent sh., Yunusobod tumani, 12-mavze",
      phone: '+998 (71) 200-33-44',
      total_rooms: 8,
      occupied_rooms: 0,
      available_rooms: 8,
      active_guests_total: 0,
      total_capacity: 80,
      total_cash: 0,
      total_card: 0,
      total_advance: 0,
      total_debt: 0,
      total_bookings: 0
    }
  ];

  const bookings: Booking[] = [];

  return { branches, bookings };
}

function getLocalBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (raw) return JSON.parse(raw);
  } catch {}
  const { branches } = getInitialFallbackData();
  saveLocalBranches(branches);
  return branches;
}

function saveLocalBranches(branches: Branch[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  } catch {}
}

function getLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  const { bookings } = getInitialFallbackData();
  saveLocalBookings(bookings);
  return bookings;
}

function saveLocalBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch {}
}

export async function loginAdmin(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      return data;
    }
  } catch {}

  const rawUser = (username || '').trim();
  const u = rawUser.toLowerCase();
  const p = (password || '').trim();

  // Official Bodomzor-Hotel credentials
  if (u === 'bodomzor-hotel' || u === 'bodomzor' || u === 'bodomzorhotel') {
    if (p === 'Bodom1225' || p === 'bodom1225' || p === 'admin123') {
      return {
        user: {
          id: 1,
          username: 'Bodomzor-Hotel',
          name: 'Bodomzor Hotel Rahbariyati',
          role: 'admin'
        },
        token: 'bodomzor-token-' + Date.now()
      };
    } else {
      throw new Error("Parol noto'g'ri. Bodomzor Hotel parolini kiriting");
    }
  }

  // Fallback for admin / boss
  if (
    u === 'admin' ||
    u === 'xojayin' ||
    u === 'boss' ||
    u === 'rahbar' ||
    u === 'manager'
  ) {
    if (p === 'admin123' || p === 'Bodom1225' || p === 'bodom1225' || p === 'admin') {
      return {
        user: {
          id: 1,
          username: 'Bodomzor-Hotel',
          name: 'Bodomzor Hotel Bosh Rahbari',
          role: 'admin'
        },
        token: 'local-token-' + Date.now()
      };
    }
  }

  // Any other valid credentials
  if (rawUser && p === 'Bodom1225') {
    return {
      user: { id: 1, username: rawUser, name: `Bodomzor Hotel (${rawUser})`, role: 'admin' },
      token: 'local-token-' + Date.now()
    };
  }

  throw new Error("Noto'g'ri login yoki parol. Iltimos, ma'lumotlarni tekshiring.");
}

export function resetToCleanEmptyData(): void {
  const cleanBranches: Branch[] = [
    {
      id: 1,
      name: '1-Filial (Bodomzor)',
      address: "Toshkent sh., Bodomzor yo'li",
      phone: '+998 (71) 200-11-22',
      total_rooms: 8,
      occupied_rooms: 0,
      available_rooms: 8,
      active_guests_total: 0,
      total_capacity: 80,
      total_cash: 0,
      total_card: 0,
      total_advance: 0,
      total_debt: 0,
      total_bookings: 0
    },
    {
      id: 2,
      name: '2-Filial (Yunusobod)',
      address: "Toshkent sh., Yunusobod tumani, 12-mavze",
      phone: '+998 (71) 200-33-44',
      total_rooms: 8,
      occupied_rooms: 0,
      available_rooms: 8,
      active_guests_total: 0,
      total_capacity: 80,
      total_cash: 0,
      total_card: 0,
      total_advance: 0,
      total_debt: 0,
      total_bookings: 0
    }
  ];
  saveLocalBranches(cleanBranches);
  saveLocalBookings([]);
}

export function resetToSampleData(): void {
  resetToCleanEmptyData();
}

export async function fetchBranches(): Promise<Branch[]> {
  try {
    const res = await fetch(`${API_BASE}/api/branches`);
    const data = await res.json();
    if (res.ok && data.branches) {
      saveLocalBranches(data.branches);
      return data.branches;
    }
  } catch {}
  return getLocalBranches();
}

export async function createBranch(payload: { name: string; address?: string; phone?: string; rooms_count?: number }): Promise<Branch> {
  const roomsCount = Number(payload.rooms_count) || 8;
  try {
    const res = await fetch(`${API_BASE}/api/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, rooms_count: roomsCount })
    });
    const data = await res.json();
    if (res.ok && data.branch) {
      const current = getLocalBranches();
      saveLocalBranches([...current, data.branch]);
      return data.branch;
    }
  } catch {}

  // Fallback branch creation
  const localBranches = getLocalBranches();
  const newId = localBranches.length > 0 ? Math.max(...localBranches.map(b => b.id)) + 1 : 1;
  const newBranch: Branch = {
    id: newId,
    name: payload.name,
    address: payload.address || '',
    phone: payload.phone || '',
    total_rooms: roomsCount,
    occupied_rooms: 0,
    available_rooms: roomsCount,
    active_guests_total: 0,
    total_capacity: roomsCount * 10,
    total_cash: 0,
    total_card: 0,
    total_advance: 0,
    total_debt: 0,
    total_bookings: 0
  };
  saveLocalBranches([...localBranches, newBranch]);
  return newBranch;
}

export async function updateBranch(id: number, payload: { name: string; address?: string; phone?: string }): Promise<Branch> {
  try {
    const res = await fetch(`${API_BASE}/api/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.branch) {
      const current = getLocalBranches();
      const updated = current.map(b => b.id === id ? { ...b, ...data.branch } : b);
      saveLocalBranches(updated);
      return data.branch;
    }
  } catch {}

  const current = getLocalBranches();
  const updated = current.map(b => b.id === id ? { ...b, ...payload } : b);
  saveLocalBranches(updated);
  return updated.find(b => b.id === id)!;
}

export async function deleteBranch(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/branches/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const current = getLocalBranches().filter(b => b.id !== id);
      saveLocalBranches(current);
      const bookings = getLocalBookings().filter(b => b.branch_id !== id);
      saveLocalBookings(bookings);
      return;
    }
  } catch {}

  const current = getLocalBranches().filter(b => b.id !== id);
  saveLocalBranches(current);
  const bookings = getLocalBookings().filter(b => b.branch_id !== id);
  saveLocalBookings(bookings);
}

export async function fetchBranchRooms(branchId: number): Promise<{ branch: Branch; rooms: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/branches/${branchId}/rooms`);
    const data = await res.json();
    if (res.ok && data.rooms) {
      return data;
    }
  } catch {}

  // Fallback rooms
  const branches = getLocalBranches();
  const branch = branches.find(b => b.id === branchId) || branches[0];
  const bookings = getLocalBookings().filter(b => b.branch_id === branchId && b.status === 'active');

  const rooms = [];
  const roomCount = branch.total_rooms || 8;
  for (let r = 1; r <= roomCount; r++) {
    const roomBookings = bookings.filter(b => b.room_number === r);
    rooms.push({
      id: r,
      branch_id: branchId,
      room_number: r,
      type: 'Standart',
      price_per_day: 250000,
      max_capacity: 10,
      status: roomBookings.length >= 10 ? 'occupied' : 'available',
      active_guests_count: roomBookings.length,
      is_occupied: roomBookings.length > 0,
      active_guests: roomBookings.map(b => b.guest_name)
    });
  }
  return { branch, rooms };
}

export async function fetchRoomBookings(branchId: number, roomNumber: number): Promise<RoomDetailResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/branches/${branchId}/rooms/${roomNumber}/bookings`);
    const data = await res.json();
    if (res.ok && data.room) {
      return data;
    }
  } catch {}

  // Fallback room bookings
  const branches = getLocalBranches();
  const branch = branches.find(b => b.id === branchId) || branches[0];
  const allBookings = getLocalBookings();
  const roomBookings = allBookings.filter(b => b.branch_id === branchId && b.room_number === roomNumber);

  let total_cash = 0;
  let total_card = 0;
  let total_advance = 0;
  let total_debt = 0;

  roomBookings.forEach(b => {
    total_cash += Number(b.cash_payment || 0);
    total_card += Number(b.card_payment || 0);
    total_advance += Number(b.advance_payment || 0);
    total_debt += Number(b.debt || 0);
  });

  const active_count = roomBookings.filter(b => b.status === 'active').length;

  return {
    branch,
    room: {
      id: roomNumber,
      branch_id: branchId,
      room_number: roomNumber,
      type: 'Standart',
      price_per_day: 250000,
      max_capacity: 10,
      status: active_count >= 10 ? 'occupied' : 'available'
    },
    bookings: roomBookings,
    totals: {
      total_cash,
      total_card,
      total_advance,
      total_debt,
      total_count: roomBookings.length,
      active_count,
      capacity: 10
    }
  };
}

export async function createBooking(payload: Partial<Booking>): Promise<Booking> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.booking) {
      const current = getLocalBookings();
      saveLocalBookings([data.booking, ...current]);
      return data.booking;
    }
  } catch {}

  // Fallback create
  const allBookings = getLocalBookings();
  const newId = allBookings.length > 0 ? Math.max(...allBookings.map(b => b.id)) + 1 : 1;
  const newBooking: Booking = {
    id: newId,
    branch_id: Number(payload.branch_id) || 1,
    room_id: Number(payload.room_number) || 1,
    room_number: Number(payload.room_number) || 1,
    slot_number: Number(payload.slot_number) || 1,
    guest_name: payload.guest_name || '',
    cash_payment: Number(payload.cash_payment) || 0,
    card_payment: Number(payload.card_payment) || 0,
    advance_payment: Number(payload.advance_payment) || 0,
    debt: Number(payload.debt) || 0,
    check_in_date: payload.check_in_date || new Date().toISOString().slice(0, 10),
    check_out_date: payload.check_out_date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    status: payload.status || 'active',
    phone: payload.phone || '',
    notes: payload.notes || '',
    branch_name: `${payload.branch_id || 1}-Filial`,
    room_type: 'Standart',
    created_at: new Date().toISOString().slice(0, 10)
  };
  saveLocalBookings([newBooking, ...allBookings]);
  return newBooking;
}

export async function updateBooking(id: number, payload: Partial<Booking>): Promise<Booking> {
  try {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.booking) {
      const current = getLocalBookings().map(b => b.id === id ? { ...b, ...data.booking } : b);
      saveLocalBookings(current);
      return data.booking;
    }
  } catch {}

  // Fallback update
  const current = getLocalBookings();
  const updated = current.map(b => b.id === id ? { ...b, ...payload } : b);
  saveLocalBookings(updated);
  return updated.find(b => b.id === id)!;
}

export async function deleteBooking(id: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const current = getLocalBookings().filter(b => b.id !== id);
      saveLocalBookings(current);
      return;
    }
  } catch {}

  const current = getLocalBookings().filter(b => b.id !== id);
  saveLocalBookings(current);
}

export async function fetchDailyReport(branchId: string, date: string): Promise<DailyReportResponse> {
  try {
    const params = new URLSearchParams({ branchId, date });
    const res = await fetch(`${API_BASE}/api/reports/daily?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data.records) {
      return data;
    }
  } catch {}

  // Fallback report
  const allBookings = getLocalBookings();
  const filtered = allBookings.filter(b => {
    const matchBranch = branchId === 'all' || String(b.branch_id) === String(branchId);
    const matchDate = (b.check_in_date && b.check_in_date <= date) && (b.check_out_date && b.check_out_date >= date);
    return matchBranch && matchDate;
  });

  let total_cash = 0;
  let total_card = 0;
  let total_advance = 0;
  let total_debt = 0;
  filtered.forEach(r => {
    total_cash += Number(r.cash_payment || 0);
    total_card += Number(r.card_payment || 0);
    total_advance += Number(r.advance_payment || 0);
    total_debt += Number(r.debt || 0);
  });

  const records: ReportRecord[] = filtered.map(b => ({
    ...b,
    branch_name: b.branch_name || `${b.branch_id}-Filial`,
    room_number: b.room_number || 1,
    room_type: b.room_type || 'Standart'
  }));

  return {
    filter: { type: 'daily', branchId, date },
    summary: {
      total_guests: records.length,
      total_cash,
      total_card,
      total_advance,
      total_debt,
      grand_total: total_cash + total_card + total_advance
    },
    records
  };
}

export async function fetchMonthlyReport(branchId: string, month: string, year: string): Promise<MonthlyReportResponse> {
  try {
    const params = new URLSearchParams({ branchId, month, year });
    const res = await fetch(`${API_BASE}/api/reports/monthly?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data.records) {
      return data;
    }
  } catch {}

  // Fallback monthly report
  const targetPrefix = `${year}-${month.padStart(2, '0')}`;
  const allBookings = getLocalBookings();
  const filtered = allBookings.filter(b => {
    const matchBranch = branchId === 'all' || String(b.branch_id) === String(branchId);
    const matchMonth = (b.check_in_date && b.check_in_date.startsWith(targetPrefix)) || 
                       (b.created_at && b.created_at.startsWith(targetPrefix));
    return matchBranch && matchMonth;
  });

  let total_cash = 0;
  let total_card = 0;
  let total_advance = 0;
  let total_debt = 0;
  filtered.forEach(r => {
    total_cash += Number(r.cash_payment || 0);
    total_card += Number(r.card_payment || 0);
    total_advance += Number(r.advance_payment || 0);
    total_debt += Number(r.debt || 0);
  });

  const records: ReportRecord[] = filtered.map(b => ({
    ...b,
    branch_name: b.branch_name || `${b.branch_id}-Filial`,
    room_number: b.room_number || 1,
    room_type: b.room_type || 'Standart'
  }));

  return {
    filter: { type: 'monthly', branchId, month, year },
    summary: {
      total_guests: records.length,
      total_cash,
      total_card,
      total_advance,
      total_debt,
      grand_total: total_cash + total_card + total_advance
    },
    records
  };
}
