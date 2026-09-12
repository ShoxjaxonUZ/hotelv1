import React, { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, Wallet, CreditCard, AlertCircle, Calculator } from 'lucide-react';
import { Booking, Branch, Room } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Booking>) => Promise<void>;
  initialBooking?: Booking | null;
  initialSlotNumber?: number;
  currentBranchId: number;
  currentRoomNumber: number;
  branches: Branch[];
  rooms: Room[];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBooking,
  initialSlotNumber = 1,
  currentBranchId,
  currentRoomNumber,
  branches,
  rooms
}) => {
  const isEditing = !!initialBooking;

  const [branchId, setBranchId] = useState<number>(currentBranchId || 1);
  const [roomNumber, setRoomNumber] = useState<number>(currentRoomNumber || 1);
  const [slotNumber, setSlotNumber] = useState<number>(initialSlotNumber || 1);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [cashPayment, setCashPayment] = useState<number>(0);
  const [cardPayment, setCardPayment] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [debt, setDebt] = useState<number>(0);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Find matching room to retrieve price_per_day
  const selectedRoom = rooms.find((r) => r.room_number === roomNumber && r.branch_id === branchId) || rooms[0];

  useEffect(() => {
    if (initialBooking) {
      setBranchId(initialBooking.branch_id);
      setRoomNumber(initialBooking.room_number || currentRoomNumber);
      setSlotNumber(initialBooking.slot_number || initialSlotNumber || 1);
      setGuestName(initialBooking.guest_name);
      setPhone(initialBooking.phone || '');
      setCashPayment(initialBooking.cash_payment || 0);
      setCardPayment(initialBooking.card_payment || 0);
      setAdvancePayment(initialBooking.advance_payment || 0);
      setDebt(initialBooking.debt || 0);
      setCheckInDate(initialBooking.check_in_date);
      setCheckOutDate(initialBooking.check_out_date);
      setStatus(initialBooking.status || 'active');
      setNotes(initialBooking.notes || '');
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      setBranchId(currentBranchId || 1);
      setRoomNumber(currentRoomNumber || 1);
      setSlotNumber(initialSlotNumber || 1);
      setGuestName('');
      setPhone('');
      const defaultPrice = selectedRoom ? selectedRoom.price_per_day : 250000;
      setCashPayment(defaultPrice);
      setCardPayment(0);
      setAdvancePayment(0);
      setDebt(0);
      setCheckInDate(today);
      setCheckOutDate(tomorrow);
      setStatus('active');
      setNotes('');
    }
    setFormError('');
  }, [initialBooking, isOpen, currentBranchId, currentRoomNumber, initialSlotNumber]);

  if (!isOpen) return null;

  // Auto calculate debt based on dates and daily rate
  const autoCalculateDebt = () => {
    if (!checkInDate || !checkOutDate) return;
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    if (end <= start) {
      setFormError("Ketish vaqti kelgan kundan keyin bo'lishi kerak");
      return;
    }
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const dailyPrice = selectedRoom?.price_per_day || 250000;
    const totalExpected = days * dailyPrice;
    const totalPaid = Number(cashPayment || 0) + Number(cardPayment || 0) + Number(advancePayment || 0);
    const calculatedDebt = Math.max(0, totalExpected - totalPaid);
    setDebt(calculatedDebt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!guestName.trim()) {
      setFormError("Mijozning F.I.Sh kiritilishi shart");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setFormError("Kelgan kuni va Ketish vaqti kiritilishi shart");
      return;
    }
    if (new Date(checkOutDate) < new Date(checkInDate)) {
      setFormError("Ketish sanasi kelgan sanadan oldin bo'lishi mumkin emas");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetRoom = rooms.find((r) => r.room_number === roomNumber && r.branch_id === branchId);
      const roomId = targetRoom ? targetRoom.id : (initialBooking?.room_id || 1);

      await onSave({
        id: initialBooking?.id,
        branch_id: branchId,
        room_id: roomId,
        guest_name: guestName.trim(),
        phone: phone.trim(),
        cash_payment: Number(cashPayment) || 0,
        card_payment: Number(cardPayment) || 0,
        advance_payment: Number(advancePayment) || 0,
        debt: Number(debt) || 0,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        status,
        slot_number: Number(slotNumber) || 1,
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Branch rooms list for select
  const currentBranchRooms = rooms.filter(r => r.branch_id === branchId);
  const roomOptions = currentBranchRooms.length > 0 
    ? currentBranchRooms 
    : [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ room_number: n, type: 'Standart', max_capacity: 10 }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? "Mijoz ma'lumotlarini tahrirlash" : "Yangi mijoz qo'shish (Bron)"}
              </h2>
              <p className="text-xs text-slate-400">
                {branchId}-Filial • Xona #{roomNumber} • Joy #{slotNumber} (1-10 o'rin)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Branch, Room and Slot selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Filial</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Xona raqami</label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                {roomOptions.map((r: any) => (
                  <option key={r.room_number} value={r.room_number}>
                    Xona #{r.room_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">O'rin (Joy No: 1-10)</label>
              <select
                value={slotNumber}
                onChange={(e) => setSlotNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500 font-mono font-semibold text-indigo-300"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}-o'rin (Qator #{n})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                F.I.Sh (Mijozning to'liq ismi) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Masalan: Sardor Aliyev"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefon raqami
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123-45-67"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Check-in and Check-out dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kelgan kuni (Check-in) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ketish vaqti (Check-out) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Payments Section (Naqt, Karta, Avans, Qarz) */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                <span>To'lovlar (Naqt, Karta) va Qarz</span>
              </span>
              <button
                type="button"
                onClick={autoCalculateDebt}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                title="Sana bo'yicha qarzni avtomatik hisoblash"
              >
                <Calculator className="w-3 h-3" />
                <span>Avto-hisoblash</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Naqt</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cashPayment}
                  onChange={(e) => setCashPayment(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold text-emerald-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-indigo-400" />
                  <span>Karta</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cardPayment}
                  onChange={(e) => setCardPayment(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold text-indigo-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Avans</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold text-sky-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Qarz</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={debt}
                  onChange={(e) => setDebt(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold text-rose-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bandlik holati</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Faol (Xonada band)</option>
                <option value="completed">Yakunlangan (Ketgan)</option>
                <option value="cancelled">Bekor qilingan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Qo'shimcha izoh / Pasport</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pasport: AA 1234567, maxsus talablar..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
            >
              {isSubmitting ? "Saqlanmoqda..." : (isEditing ? "O'zgarishlarni saqlash" : "Mijozni qo'shish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
