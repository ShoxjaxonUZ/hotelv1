import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Search, FileText, Edit2, Trash2, CheckCircle, 
  BedDouble, Phone, Calendar, Check, X, CreditCard, Users, AlertCircle, Sparkles
} from 'lucide-react';
import { Branch, Room, Booking } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportRoomBookingsToPDF } from '../utils/pdfExport';

interface RoomDetailTableProps {
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
  onBack: () => void;
  onAddBooking: () => void;
  onAddBookingForSlot?: (slotNumber: number) => void;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (booking: Booking) => void;
  onUpdateStatus: (booking: Booking, status: 'active' | 'completed' | 'cancelled') => void;
  onOpenDailyReports?: () => void;
  onOpenMonthlyReports?: () => void;
}

export const RoomDetailTable: React.FC<RoomDetailTableProps> = ({
  branch,
  room,
  bookings,
  totals,
  onBack,
  onAddBooking,
  onAddBookingForSlot,
  onEditBooking,
  onDeleteBooking,
  onUpdateStatus,
  onOpenDailyReports,
  onOpenMonthlyReports
}) => {
  const [viewMode, setViewMode] = useState<'ten_slots' | 'all_records'>('ten_slots');
  const [searchTerm, setSearchTerm] = useState('');

  const maxCapacity = 10;
  const activeBookings = bookings.filter(b => b.status === 'active');
  const activeCount = activeBookings.length;
  const isFull = activeCount >= maxCapacity;
  const remainingSpots = Math.max(0, maxCapacity - activeCount);

  // Build EXACTLY 10 permanent slots (1 to 10)
  const slotItems: Array<{ slotNumber: number; booking?: Booking }> = [];
  const assignedMap = new Map<number, Booking>();
  const unassigned: Booking[] = [];

  activeBookings.forEach(b => {
    if (b.slot_number && b.slot_number >= 1 && b.slot_number <= 10 && !assignedMap.has(b.slot_number)) {
      assignedMap.set(b.slot_number, b);
    } else {
      unassigned.push(b);
    }
  });

  let unassignedIdx = 0;
  for (let i = 1; i <= 10; i++) {
    if (assignedMap.has(i)) {
      slotItems.push({ slotNumber: i, booking: assignedMap.get(i) });
    } else if (unassignedIdx < unassigned.length) {
      slotItems.push({ slotNumber: i, booking: unassigned[unassignedIdx++] });
    } else {
      slotItems.push({ slotNumber: i, booking: undefined });
    }
  }

  // Filter for historical / all records view
  const filteredAllBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.phone && b.phone.includes(searchTerm));
    return matchesSearch;
  });

  const handleExportPDF = () => {
    exportRoomBookingsToPDF(branch.name, room.room_number, room.type, bookings, totals);
  };

  const handleSlotAdd = (slotNum: number) => {
    if (onAddBookingForSlot) {
      onAddBookingForSlot(slotNum);
    } else {
      onAddBooking();
    }
  };

  const grandRevenue = totals.total_cash + (totals.total_card || 0) + totals.total_advance;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Xonalar ro'yxatiga qaytish"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Filiallar</span>
                <span>/</span>
                <span>{branch.name}</span>
                <span>/</span>
                <span className="text-indigo-400 font-semibold">Xona #{room.room_number}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk'] flex flex-wrap items-center gap-2 sm:gap-3">
                <span>Xona #{room.room_number} (10 Kishilik Doimiy Jadval)</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 font-normal">
                  Maksimal sig'im: 10 kishi
                </span>
              </h1>
            </div>
          </div>

          {/* Action Buttons: Kunlik PDF, Oylik PDF, Xona PDF, Yangi Mijoz */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {onOpenDailyReports && (
              <button
                onClick={onOpenDailyReports}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kunlik hisobot PDF"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kunlik hisobot (PDF)</span>
              </button>
            )}

            {onOpenMonthlyReports && (
              <button
                onClick={onOpenMonthlyReports}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Oylik hisobot PDF"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Oylik hisobot (PDF)</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ushbu xona jadvalini PDF formatida yuklab olish"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Xona PDF</span>
            </button>

            <button
              onClick={onAddBooking}
              disabled={isFull}
              className={`px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                isFull
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-900/30'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Mijoz kiritish</span>
            </button>
          </div>
        </div>

        {/* 10-person capacity bar indicator */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">Xona sig'imi:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold ${
              isFull ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {activeCount} / 10 band
            </span>
            <span className="text-slate-400">
              ({remainingSpots} ta bo'sh o'rin mavjud)
            </span>
          </div>

          <div className="flex items-center gap-1 w-full sm:w-56 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                title={`${idx + 1}-o'rin: ${idx < activeCount ? 'Band' : "Bo'sh"}`}
                className={`h-2.5 flex-1 rounded-sm transition-all ${
                  idx < activeCount ? 'bg-indigo-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards for this room */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {/* Naqt */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Naqt to'lov
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {formatCurrency(totals.total_cash)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Kassaga naqt tushgan</div>
        </div>

        {/* Karta */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Karta to'lov
          </div>
          <div className="text-base sm:text-lg font-bold text-indigo-400 font-mono">
            {formatCurrency(totals.total_card || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Plastik karta orqali</div>
        </div>

        {/* Oldindan to'lov */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Oldindan to'lov
          </div>
          <div className="text-base sm:text-lg font-bold text-sky-300 font-mono">
            {formatCurrency(totals.total_advance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Avans to'lovlari</div>
        </div>

        {/* Qarz */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Qarz (Qoldiq)
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono ${totals.total_debt > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {formatCurrency(totals.total_debt)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">To'lanmagan qoldiq</div>
        </div>

        {/* Jami Kassa Tushumi */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1">
            Jami Tushum
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono">
            {formatCurrency(grandRevenue)}
          </div>
          <div className="text-[10px] text-indigo-400/80 mt-1">Naqt + Karta + Avans</div>
        </div>
      </div>

      {/* View Switcher: 10 Doimiy Qator vs Barcha Yozuvlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle between Permanent 10 slots and History */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('ten_slots')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'ten_slots'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            <span>10 Kishilik Doimiy Jadval (1-10)</span>
          </button>
          <button
            onClick={() => setViewMode('all_records')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'all_records'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Barcha Yozuvlar ({bookings.length})</span>
          </button>
        </div>

        {/* Search for History */}
        {viewMode === 'all_records' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mijoz ismi yoki telefon..."
              className="w-full pl-10 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Main Table Container: Aniq 10 ta qatorli jadval (No 1 dan 10 gacha) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[850px]">
            <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3.5 px-3.5 w-12 text-center">No</th>
                <th scope="col" className="py-3.5 px-4 min-w-[200px]">F.I.Sh (Mijozning to'liq ismi)</th>
                <th scope="col" className="py-3.5 px-3 text-right">Naqt</th>
                <th scope="col" className="py-3.5 px-3 text-right">Karta</th>
                <th scope="col" className="py-3.5 px-3 text-right">Oldindan to'lov</th>
                <th scope="col" className="py-3.5 px-3 text-right">Qarz</th>
                <th scope="col" className="py-3.5 px-3 text-center">Kelgan kuni</th>
                <th scope="col" className="py-3.5 px-3 text-center">Ketish vaqti</th>
                <th scope="col" className="py-3.5 px-3 text-center">Holati</th>
                <th scope="col" className="py-3.5 px-3 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {viewMode === 'ten_slots' ? (
                /* EXACT 10 PERMANENT ROWS: 1 TO 10 */
                slotItems.map((slot) => {
                  const booking = slot.booking;
                  const isOccupied = !!booking;
                  const hasDebt = isOccupied && (booking.debt > 0);

                  return (
                    <tr 
                      key={`slot-${slot.slotNumber}`}
                      className={`transition-colors ${
                        isOccupied 
                          ? 'hover:bg-slate-800/50 bg-slate-900/60' 
                          : 'hover:bg-slate-800/20 bg-slate-950/30'
                      }`}
                    >
                      {/* No (1 dan 10 gacha raqam) */}
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          isOccupied 
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                            : 'bg-slate-800/70 text-slate-400 border border-slate-700/60'
                        }`}>
                          {slot.slotNumber}
                        </span>
                      </td>

                      {/* F.I.Sh (Mijozning to'liq ismi) */}
                      <td className="py-3.5 px-4">
                        {isOccupied ? (
                          <div>
                            <div className="font-semibold text-white hover:text-indigo-300 transition-colors">
                              {booking.guest_name}
                            </div>
                            {booking.phone && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{booking.phone}</span>
                              </div>
                            )}
                            {booking.notes && (
                              <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                                {booking.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 italic">
                            <BedDouble className="w-3.5 h-3.5 text-emerald-500/60 shrink-0" />
                            <span>Bo'sh o'rin ({slot.slotNumber}-joy)</span>
                          </div>
                        )}
                      </td>

                      {/* Naqt */}
                      <td className="py-3.5 px-3 text-right font-semibold font-mono">
                        {isOccupied ? (
                          <span className="text-emerald-400">{formatCurrency(booking.cash_payment)}</span>
                        ) : (
                          <span className="text-slate-600 font-normal">0 so'm</span>
                        )}
                      </td>

                      {/* Karta */}
                      <td className="py-3.5 px-3 text-right font-semibold font-mono">
                        {isOccupied ? (
                          <span className="text-indigo-400">{formatCurrency(booking.card_payment || 0)}</span>
                        ) : (
                          <span className="text-slate-600 font-normal">0 so'm</span>
                        )}
                      </td>

                      {/* Oldindan to'lov */}
                      <td className="py-3.5 px-3 text-right font-medium font-mono">
                        {isOccupied ? (
                          <span className="text-sky-300">{formatCurrency(booking.advance_payment)}</span>
                        ) : (
                          <span className="text-slate-600 font-normal">0 so'm</span>
                        )}
                      </td>

                      {/* Qarz */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {isOccupied ? (
                          hasDebt ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                              {formatCurrency(booking.debt)}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-normal">0 so'm</span>
                          )
                        ) : (
                          <span className="text-slate-600 font-normal">0 so'm</span>
                        )}
                      </td>

                      {/* Kelgan kuni */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium">
                        {isOccupied ? (
                          <div className="inline-flex items-center gap-1.5 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDate(booking.check_in_date)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Ketish vaqti */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium">
                        {isOccupied ? (
                          <div className="inline-flex items-center gap-1.5 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDate(booking.check_out_date)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Holati */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isOccupied ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/70 text-amber-400 border border-amber-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Bo'sh
                          </span>
                        )}
                      </td>

                      {/* Amallar */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isOccupied ? (
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Complete / Check out */}
                            <button
                              onClick={() => onUpdateStatus(booking, 'completed')}
                              title="Xonani bo'shatish (Yakunlash)"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditBooking(booking)}
                              title="Tahrirlash"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDeleteBooking(booking)}
                              title="O'chirish"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSlotAdd(slot.slotNumber)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Kiritish</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* ALL RECORDS / HISTORY VIEW */
                filteredAllBookings.length > 0 ? (
                  filteredAllBookings.map((booking, index) => {
                    const hasDebt = booking.debt > 0;
                    const isActive = booking.status === 'active';

                    return (
                      <tr 
                        key={booking.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3.5 px-3.5 text-center font-mono text-slate-400 font-bold">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {booking.guest_name}
                          </div>
                          {booking.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{booking.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-emerald-400 font-mono">
                          {formatCurrency(booking.cash_payment)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-indigo-400 font-mono">
                          {formatCurrency(booking.card_payment || 0)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-medium text-sky-300 font-mono">
                          {formatCurrency(booking.advance_payment)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          {hasDebt ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                              {formatCurrency(booking.debt)}
                            </span>
                          ) : (
                            <span className="text-slate-500">0 so'm</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap text-slate-300 font-medium">
                          {formatDate(booking.check_in_date)}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap text-slate-300 font-medium">
                          {formatDate(booking.check_out_date)}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/70 text-amber-400 border border-amber-800/80">
                              Faol
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/80">
                              Yakunlangan
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {isActive && (
                              <button
                                onClick={() => onUpdateStatus(booking, 'completed')}
                                title="Xonani bo'shatish"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditBooking(booking)}
                              title="Tahrirlash"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteBooking(booking)}
                              title="O'chirish"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      Yozuvlar topilmadi
                    </td>
                  </tr>
                )
              )}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot className="bg-slate-950/90 text-slate-300 font-semibold border-t-2 border-slate-800">
              <tr>
                <td className="py-3 px-3.5 text-center font-mono font-bold">JAMI</td>
                <td className="py-3 px-4 text-white font-bold">
                  {viewMode === 'ten_slots' 
                    ? `10 o'rindan ${activeCount} tasi band`
                    : `${filteredAllBookings.length} ta yozuv`}
                </td>
                <td className="py-3 px-3 text-right text-emerald-400 font-mono font-bold">
                  {formatCurrency(
                    viewMode === 'ten_slots'
                      ? slotItems.reduce((sum, s) => sum + (s.booking?.cash_payment || 0), 0)
                      : filteredAllBookings.reduce((sum, b) => sum + (b.cash_payment || 0), 0)
                  )}
                </td>
                <td className="py-3 px-3 text-right text-indigo-400 font-mono font-bold">
                  {formatCurrency(
                    viewMode === 'ten_slots'
                      ? slotItems.reduce((sum, s) => sum + (s.booking?.card_payment || 0), 0)
                      : filteredAllBookings.reduce((sum, b) => sum + (b.card_payment || 0), 0)
                  )}
                </td>
                <td className="py-3 px-3 text-right text-sky-300 font-mono font-bold">
                  {formatCurrency(
                    viewMode === 'ten_slots'
                      ? slotItems.reduce((sum, s) => sum + (s.booking?.advance_payment || 0), 0)
                      : filteredAllBookings.reduce((sum, b) => sum + (b.advance_payment || 0), 0)
                  )}
                </td>
                <td className="py-3 px-3 text-right text-rose-400 font-mono font-bold">
                  {formatCurrency(
                    viewMode === 'ten_slots'
                      ? slotItems.reduce((sum, s) => sum + (s.booking?.debt || 0), 0)
                      : filteredAllBookings.reduce((sum, b) => sum + (b.debt || 0), 0)
                  )}
                </td>
                <td colSpan={4} className="py-3 px-3 text-right text-xs text-slate-400">
                  Umumiy kassa tushumi: <span className="text-emerald-400 font-bold">{formatCurrency(
                    viewMode === 'ten_slots'
                      ? slotItems.reduce((sum, s) => sum + (s.booking?.cash_payment || 0) + (s.booking?.card_payment || 0) + (s.booking?.advance_payment || 0), 0)
                      : filteredAllBookings.reduce((sum, b) => sum + (b.cash_payment || 0) + (b.card_payment || 0) + (b.advance_payment || 0), 0)
                  )}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
