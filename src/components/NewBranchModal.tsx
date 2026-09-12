import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, BedDouble, AlertCircle } from 'lucide-react';
import { Branch } from '../types';

interface NewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; address: string; phone: string; rooms_count: number }) => Promise<void>;
  existingBranchesCount: number;
  editingBranch?: Branch | null;
}

export const NewBranchModal: React.FC<NewBranchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBranchesCount,
  editingBranch = null
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [roomsCount, setRoomsCount] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editingBranch;

  useEffect(() => {
    if (editingBranch) {
      setName(editingBranch.name || '');
      setAddress(editingBranch.address || '');
      setPhone(editingBranch.phone || '+998 ');
      setRoomsCount(editingBranch.total_rooms || 8);
    } else {
      setName(`${existingBranchesCount + 1}-Filial`);
      setAddress('');
      setPhone('+998 ');
      setRoomsCount(8);
    }
    setError('');
  }, [editingBranch, existingBranchesCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Filial nomini kiritish shart');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        rooms_count: Number(roomsCount) || 8
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? "Filialni Tahrirlash" : "Yangi Filial Qo'shish"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? "Filial ma'lumotlarini o'zgartiring" : "Mehmonxona tarmog'iga yangi filial qo'shing"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Filial nomi *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: 2-Filial (Aeroport)"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Manzili
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masalan: Toshkent sh., Bobur ko'chasi, 12"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Telefon raqami
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 (71) 200-33-44"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Xonalar soni (Admin ixtiyoriy son kiritishi mumkin, har biri 10 o'rinli) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <BedDouble className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                  placeholder="Xonalar sonini kiriting (masalan: 8, 10, 15...)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Tezkor tanlash:</span>
                {[4, 6, 8, 10, 12, 16].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRoomsCount(num)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      roomsCount === num
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {num} ta
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {isSubmitting
                ? "Saqlanmoqda..."
                : isEditing
                ? "O'zgarishlarni saqlash"
                : "+ Filialni qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
