import React from 'react';
import { Building2, DoorOpen, Users, Wallet, CreditCard, AlertCircle, ArrowRight, Phone, MapPin, Sparkles, Plus, FileText, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Branch } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BranchesViewProps {
  branches: Branch[];
  onSelectBranch: (branchId: number) => void;
  onOpenDailyReports: () => void;
  onOpenMonthlyReports: () => void;
  onOpenNewBranchModal: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  onResetCleanData?: () => void;
  onResetSampleData?: () => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({
  branches,
  onSelectBranch,
  onOpenDailyReports,
  onOpenMonthlyReports,
  onOpenNewBranchModal,
  onEditBranch,
  onDeleteBranch,
  onResetCleanData,
  onResetSampleData
}) => {
  // Aggregate stats across all branches
  const totalRooms = branches.reduce((acc, b) => acc + (b.total_rooms || 8), 0);
  const totalOccupiedRooms = branches.reduce((acc, b) => acc + (b.occupied_rooms || 0), 0);
  const totalAvailableRooms = totalRooms - totalOccupiedRooms;
  const totalCash = branches.reduce((acc, b) => acc + (b.total_cash || 0), 0);
  const totalCard = branches.reduce((acc, b) => acc + (b.total_card || 0), 0);
  const totalAdvance = branches.reduce((acc, b) => acc + (b.total_advance || 0), 0);
  const totalDebt = branches.reduce((acc, b) => acc + (b.total_debt || 0), 0);
  const grandTotal = totalCash + totalCard + totalAdvance;
  const totalActiveGuests = branches.reduce((acc, b) => acc + (b.active_guests_total || 0), 0);
  const totalCapacity = branches.reduce((acc, b) => acc + (b.total_capacity || ((b.total_rooms || 8) * 10)), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Markaziy Administrator Boshqaruvi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Space_Grotesk']">
              Mehmonxona Filiallari va Xonalar Paneli
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Filiallar, xonalar (har biri 10 kishilik sig'im), mehmonlar ro'yxati, Naqt va Karta to'lovlari hamda qarzdorlikni to'liq nazorat qiling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={onOpenNewBranchModal}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Filial qo'shish</span>
            </button>
            <button
              onClick={onOpenDailyReports}
              className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
              title="Kunlik hisobot (PDF)"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Kunlik PDF</span>
            </button>
            <button
              onClick={onOpenMonthlyReports}
              className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
              title="Oylik hisobot (PDF)"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Oylik PDF</span>
            </button>

            {onResetCleanData && (
              <button
                onClick={onResetCleanData}
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Barcha xonalarni bo'shatish va toza (0 dan) holatda boshlash"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden min-[480px]:inline">Toza holat (0 dan)</span>
                <span className="min-[480px]:hidden">Tozalash</span>
              </button>
            )}

            {onResetSampleData && (
              <button
                onClick={onResetSampleData}
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-900/80 hover:bg-indigo-950/40 text-slate-400 hover:text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Namunaviy mehmonlar va to'lovlarni yuklash"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden min-[480px]:inline">Namuna</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Global Overview Stats (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Rooms */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Xonalar</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DoorOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-white">{totalRooms} <span className="text-xs text-slate-400 font-normal">ta</span></div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">{totalAvailableRooms} bo'sh</span> • <span className="text-amber-400 font-medium">{totalOccupiedRooms} band</span>
          </div>
        </div>

        {/* Total Guests (10 capacity) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Mehmonlar</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-white">{totalActiveGuests} <span className="text-xs text-slate-400 font-normal">kishi</span></div>
          <div className="mt-1.5 text-[11px] text-slate-400 truncate">
            Sig'im: {totalCapacity} kishilik
          </div>
        </div>

        {/* Cash Payment */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Naqt Kassa</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400">
            {formatCurrency(totalCash)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">Qabul qilingan naqt</div>
        </div>

        {/* Card Payment (Karta) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Karta (Plastik)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-indigo-400">
            {formatCurrency(totalCard)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">Bank / Terminal</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Jami Tushum</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-cyan-300">
            {formatCurrency(grandTotal)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">Naqt + Karta + Avans</div>
        </div>

        {/* Debt */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Qarzlar</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-400">
            {formatCurrency(totalDebt)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">Undirilishi kerak</div>
        </div>
      </div>

      {/* Dynamic Branch Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Filiallar Ro'yxati ({branches.length} ta filial)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Har bir filialdagi 1 dan {branches[0]?.total_rooms || 8} gacha bo'lgan xonalar va 10 kishilik joylarni boshqaring
            </p>
          </div>

          <button
            onClick={onOpenNewBranchModal}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Filial qo'shish</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {branches.map((branch) => {
            const roomsCount = branch.total_rooms || 8;
            const occupied = branch.occupied_rooms || 0;
            const available = roomsCount - occupied;
            const occupancyPct = roomsCount > 0 ? Math.round((occupied / roomsCount) * 100) : 0;
            const branchMaxCapacity = (branch.total_capacity || (roomsCount * 10));
            const activeGuests = branch.active_guests_total || 0;

            return (
              <div
                key={branch.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-6 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-indigo-950/30 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Branch Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {branch.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {branch.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                            Faol
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[240px]">{branch.address || "Manzil ko'rsatilmagan"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Tahrirlash va O'chirish */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBranch(branch);
                        }}
                        title="Filial ma'lumotlarini tahrirlash"
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/70 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tahrirlash</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBranch(branch);
                        }}
                        title="Filialni butunlay o'chirish"
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-5 bg-slate-950/50 px-3.5 py-2 rounded-xl border border-slate-800/50">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Aloqa: <span className="text-slate-300 font-medium">{branch.phone || "+998 -- --- -- --"}</span></span>
                  </div>

                  {/* Room & Capacity Status */}
                  <div className="mb-5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Xonalar (1 - {roomsCount} xona):
                      </span>
                      <span className="text-indigo-400 font-bold">
                        {occupied}/{roomsCount} xona band ({occupancyPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mb-2.5">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {available} ta bo'sh xona
                      </span>
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <Users className="w-3 h-3 text-sky-400" />
                        {activeGuests} / {branchMaxCapacity} mehmon
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown (Naqt, Karta, Qarz) */}
                  <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
                    <div className="bg-slate-950/60 border border-slate-800/70 p-2.5 rounded-xl">
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Naqt</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {formatCurrency(branch.total_cash)}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/70 p-2.5 rounded-xl">
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Karta</span>
                      <span className="text-xs font-bold text-indigo-400">
                        {formatCurrency(branch.total_card || 0)}
                      </span>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800/70 p-2.5 rounded-xl">
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Qarz</span>
                      <span className="text-xs font-bold text-rose-400">
                        {formatCurrency(branch.total_debt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Action Button */}
                <button
                  onClick={() => onSelectBranch(branch.id)}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
                >
                  <span>{branch.name} xonalarini ochish</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Report Access */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Kunlik yoki Oylik hisobotni chop etish kerakmi?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Barcha xonalar bo'yicha Naqt, Karta to'lovlari, avans va qarzlarni 1 tugma bilan to'g'ridan-to'g'ri PDF shaklida yuklab oling.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenDailyReports}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Kunlik hisobot (PDF)</span>
          </button>
          <button
            onClick={onOpenMonthlyReports}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Oylik hisobot (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
