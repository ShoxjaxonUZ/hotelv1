import React, { useState } from 'react';
import { 
  Building2, FileText, LogOut, RefreshCw, Hotel, Calendar, 
  Menu, X, ChevronRight, User as UserIcon 
} from 'lucide-react';
import { User, Branch } from '../types';

interface NavbarProps {
  currentUser: User;
  branches: Branch[];
  selectedBranchId: number | null;
  onSelectBranch: (id: number | null) => void;
  onOpenDailyReports: () => void;
  onOpenMonthlyReports: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  branches,
  selectedBranchId,
  onSelectBranch,
  onOpenDailyReports,
  onOpenMonthlyReports,
  onLogout,
  onRefresh,
  isRefreshing = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectBranchMobile = (id: number | null) => {
    onSelectBranch(id);
    setIsMobileMenuOpen(false);
  };

  const handleOpenDailyMobile = () => {
    onOpenDailyReports();
    setIsMobileMenuOpen(false);
  };

  const handleOpenMonthlyMobile = () => {
    onOpenMonthlyReports();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => onSelectBranch(null)}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0 min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
              <Hotel className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                <span className="truncate max-w-[110px] min-[400px]:max-w-none">Grand Hotel</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 shrink-0">
                  {branches.length > 0 ? `${branches.length} Filial` : 'Filial'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Mehmonxona boshqaruv tizimi
              </p>
            </div>
          </div>

          {/* Desktop Branch Navigation Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectBranch(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedBranchId === null
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Barcha Filiallar
            </button>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBranch(b.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedBranchId === b.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{b.id}-Filial</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </button>
            ))}
          </div>

          {/* Action Buttons & User Menu */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Refresh button */}
            <button
              onClick={onRefresh}
              title="Ma'lumotlarni yangilash"
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Kunlik Hisobot Button (PDF) */}
            <button
              onClick={onOpenDailyReports}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer shrink-0"
              title="Kunlik hisobot (PDF)"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden min-[480px]:inline">Kunlik</span>
              <span className="hidden lg:inline"> hisobot (PDF)</span>
            </button>

            {/* Oylik Hisobot Button (PDF) */}
            <button
              onClick={onOpenMonthlyReports}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
              title="Oylik hisobot (PDF)"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden min-[480px]:inline">Oylik</span>
              <span className="hidden lg:inline"> hisobot (PDF)</span>
            </button>

            {/* User profile & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2.5 border-l border-slate-800 shrink-0">
              <div className="text-right hidden lg:block">
                <div className="text-xs font-semibold text-slate-200">{currentUser.name}</div>
                <div className="text-[11px] text-emerald-400 capitalize font-medium">{currentUser.role}</div>
              </div>
              <button
                onClick={onLogout}
                title="Tizimdan chiqish"
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800/80 transition-colors cursor-pointer shrink-0 hidden min-[360px]:flex"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Menu Toggle (md:hidden) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 md:hidden transition-colors cursor-pointer shrink-0"
              aria-label="Menyuni ochish"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-rose-400" /> : <Menu className="w-4 h-4 text-indigo-400" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Horizontal Quick Branch Switcher bar */}
      <div className="flex md:hidden items-center gap-1 px-2.5 py-1.5 bg-slate-950/90 border-t border-slate-800/80 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => onSelectBranch(null)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            selectedBranchId === null
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Barcha Filiallar
        </button>
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBranch(b.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedBranchId === b.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 bg-slate-900 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3 h-3 text-indigo-400" />
            <span>{b.id}-Filial</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>
        ))}
      </div>

      {/* Mobile Expandable Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-3 space-y-3 shadow-2xl">
          {/* User info */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">{currentUser.role}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-medium border border-rose-500/20 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>

          {/* Quick PDF Reports inside menu */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleOpenDailyMobile}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Kunlik PDF</span>
            </button>

            <button
              onClick={handleOpenMonthlyMobile}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Oylik PDF</span>
            </button>
          </div>

          {/* Filiallar ro'yxati */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 px-1">Filialni tanlash:</div>
            <button
              onClick={() => handleSelectBranchMobile(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                selectedBranchId === null
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Barcha Filiallar</span>
              {selectedBranchId === null && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Faol</span>}
            </button>

            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBranchMobile(b.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  selectedBranchId === b.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{b.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
