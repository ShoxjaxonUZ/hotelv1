import React, { useState } from 'react';
import { ArrowLeft, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Branch, Room } from '../types';

interface RoomsGridProps {
  branch: Branch;
  rooms: Room[];
  onBack: () => void;
  onSelectRoom: (roomNumber: number) => void;
  onQuickBook?: (room: Room) => void;
  onOpenDailyReports: () => void;
  onOpenMonthlyReports: () => void;
}

export const RoomsGrid: React.FC<RoomsGridProps> = ({
  branch,
  rooms,
  onBack,
  onSelectRoom,
  onOpenDailyReports,
  onOpenMonthlyReports
}) => {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'full'>('all');

  const filteredRooms = rooms.filter((r) => {
    const count = r.active_guests_count || (r.is_occupied ? 1 : 0);
    const maxCap = r.max_capacity || 10;
    if (filter === 'available') return count === 0;
    if (filter === 'occupied') return count > 0 && count < maxCap;
    if (filter === 'full') return count >= maxCap;
    return true;
  });

  const availableCount = rooms.filter((r) => (r.active_guests_count || (r.is_occupied ? 1 : 0)) === 0).length;
  const occupiedCount = rooms.filter((r) => {
    const c = r.active_guests_count || (r.is_occupied ? 1 : 0);
    return c > 0 && c < (r.max_capacity || 10);
  }).length;
  const fullCount = rooms.filter((r) => (r.active_guests_count || (r.is_occupied ? 1 : 0)) >= (r.max_capacity || 10)).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            title="Filiallarga qaytish"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk']">
                {branch.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-semibold">
                {rooms.length} ta xona
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {branch.address} • {branch.phone}
            </p>
          </div>
        </div>

        {/* Quick Branch PDF Reports: Kunlik & Oylik */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenDailyReports}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            title="Kunlik hisobot (PDF)"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Kunlik hisobot (PDF)</span>
          </button>
          <button
            onClick={onOpenMonthlyReports}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            title="Oylik hisobot (PDF)"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Oylik hisobot (PDF)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Barchasi ({rooms.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Bo'sh ({availableCount})</span>
          </button>
          <button
            onClick={() => setFilter('occupied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'occupied'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Joy bor ({occupiedCount})</span>
          </button>
          <button
            onClick={() => setFilter('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'full'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>To'liq ({fullCount})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Xonani tanlang va 10 kishilik jadvaliga o'ting
        </div>
      </div>

      {/* Minimalistic Rooms GRID - Faqat xona raqami va holati */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {filteredRooms.map((room) => {
          const maxCapacity = 10;
          const guestsCount = room.active_guests_count !== undefined 
            ? room.active_guests_count 
            : (room.is_occupied ? 1 : 0);
          const isFull = guestsCount >= maxCapacity;
          const isOccupied = guestsCount > 0;

          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.room_number)}
              className={`bg-slate-900 border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] hover:shadow-xl ${
                isFull
                  ? 'border-rose-500/40 hover:border-rose-500 bg-gradient-to-b from-slate-900 to-rose-950/20'
                  : isOccupied
                  ? 'border-amber-500/40 hover:border-amber-500 bg-gradient-to-b from-slate-900 to-amber-950/20'
                  : 'border-slate-800 hover:border-emerald-500/70 hover:shadow-emerald-950/20'
              }`}
            >
              {/* Top: Room Number & Status Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight group-hover:text-indigo-300 transition-colors">
                    #{room.room_number}
                  </div>

                  {/* Clean Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isFull
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isOccupied
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isFull
                          ? 'bg-rose-400'
                          : isOccupied
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-emerald-400'
                      }`}
                    />
                    {isFull
                      ? '10/10 Band'
                      : isOccupied
                      ? `${guestsCount}/10 Band`
                      : "0/10 Bo'sh"}
                  </span>
                </div>

                {/* 10-Slot Minimal Indicator: 10 ta toza segment */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 mb-4">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div
                      key={idx}
                      title={`${idx + 1}-o'rin: ${idx < guestsCount ? 'Band' : "Bo'sh"}`}
                      className={`h-2 flex-1 rounded-sm transition-all ${
                        idx < guestsCount
                          ? isFull
                            ? 'bg-rose-500'
                            : 'bg-amber-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Action: Clean button to open table */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRoom(room.room_number);
                }}
                className="w-full py-2 px-3 bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700/60 group-hover:border-indigo-500 shadow-sm"
              >
                <span>Jadvalni ochish</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
