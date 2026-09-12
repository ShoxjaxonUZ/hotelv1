import React from 'react';
import { AlertTriangle, X, Building2 } from 'lucide-react';
import { Branch } from '../types';

interface DeleteBranchModalProps {
  isOpen: boolean;
  branch: Branch | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  branch,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          Filialni butunlay o'chirishni tasdiqlaysizmi?
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          <span className="font-semibold text-rose-400">{branch.name}</span> filiali, unga tegishli barcha xonalar va mehmonlar bron yozuvlari butunlay o'chiriladi.
        </p>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 mb-6 flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <div className="font-semibold">{branch.name}</div>
            <div className="text-[11px] text-slate-400">{branch.total_rooms || 8} ta xona, {branch.total_capacity || 80} kishilik sig'im</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
          >
            {isDeleting ? "O'chirilmoqda..." : "Ha, filialni o'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
};
