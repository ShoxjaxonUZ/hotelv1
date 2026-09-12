export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  active_guests_total?: number;
  total_capacity?: number;
  total_cash: number;
  total_card: number;
  total_advance: number;
  total_debt: number;
  total_bookings: number;
}

export interface Room {
  id: number;
  branch_id: number;
  room_number: number;
  type: string;
  price_per_day: number;
  max_capacity: number;
  status: string;
  is_occupied?: boolean;
  is_full?: boolean;
  active_guests_count?: number;
  current_guest?: string | null;
  active_guests?: string[];
  current_booking?: Booking | null;
  total_history_bookings?: number;
}

export interface Booking {
  id: number;
  branch_id: number;
  room_id: number;
  guest_name: string;
  cash_payment: number;
  card_payment: number;
  advance_payment: number;
  debt: number;
  check_in_date: string;
  check_out_date: string;
  status: 'active' | 'completed' | 'cancelled';
  phone?: string;
  notes?: string;
  slot_number?: number;
  created_at?: string;
  updated_at?: string;
  branch_name?: string;
  room_number?: number;
  room_type?: string;
}

export interface RoomDetailResponse {
  branch: Branch;
  room: Room;
  bookings: Booking[];
  totals: {
    total_cash: number;
    total_card: number;
    total_advance: number;
    total_debt: number;
    total_count: number;
    active_count: number;
    capacity: number;
  };
}

export interface ReportSummary {
  total_guests: number;
  total_cash: number;
  total_card: number;
  total_advance: number;
  total_debt: number;
  grand_total: number;
}

export interface ReportRecord extends Booking {
  branch_name: string;
  room_number: number;
  room_type: string;
}

export interface DailyReportResponse {
  filter: {
    type: 'daily';
    date: string;
    branchId: string;
  };
  summary: ReportSummary;
  records: ReportRecord[];
}

export interface MonthlyReportResponse {
  filter: {
    type?: 'monthly';
    year: string;
    month: string;
    branchId: string;
  };
  summary: ReportSummary;
  records: ReportRecord[];
}
