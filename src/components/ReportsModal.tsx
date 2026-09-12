import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Download, Building2, Calendar, Users, Wallet, 
  CreditCard, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';
import { fetchMonthlyReport, fetchDailyReport } from '../services/api';
import { MonthlyReportResponse, DailyReportResponse, Branch } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportMonthlyReportToPDF, exportDailyReportToPDF } from '../utils/pdfExport';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBranchId?: string;
  branches?: Branch[];
  initialReportType?: 'daily' | 'monthly';
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  defaultBranchId = 'all',
  branches = [],
  initialReportType = 'daily'
}) => {
  const currentDate = new Date();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>(initialReportType);

  useEffect(() => {
    if (isOpen && initialReportType) {
      setReportType(initialReportType);
    }
  }, [isOpen, initialReportType]);
  
  // Daily filters
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate.toISOString().slice(0, 10)
  );

  // Monthly filters
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (currentDate.getMonth() + 1).toString().padStart(2, '0')
  );

  // Common filters
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranchId);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyReportData, setDailyReportData] = useState<DailyReportResponse | null>(null);
  const [monthlyReportData, setMonthlyReportData] = useState<MonthlyReportResponse | null>(null);
  const [error, setError] = useState('');

  const months = [
    { value: '01', label: 'Yanvar' },
    { value: '02', label: 'Fevral' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'Aprel' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Iyun' },
    { value: '07', label: 'Iyul' },
    { value: '08', label: 'Avgust' },
    { value: '09', label: 'Sentyabr' },
    { value: '10', label: 'Oktyabr' },
    { value: '11', label: 'Noyabr' },
    { value: '12', label: 'Dekabr' },
  ];

  const loadReport = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (reportType === 'daily') {
        const data = await fetchDailyReport(selectedBranch, selectedDate);
        setDailyReportData(data);
      } else {
        const data = await fetchMonthlyReport(selectedBranch, selectedMonth, selectedYear);
        setMonthlyReportData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Hisobotni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen, reportType, selectedBranch, selectedDate, selectedMonth, selectedYear]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    if (reportType === 'daily' && dailyReportData) {
      exportDailyReportToPDF(dailyReportData);
    } else if (reportType === 'monthly' && monthlyReportData) {
      exportMonthlyReportToPDF(monthlyReportData);
    }
  };

  const currentSummary = reportType === 'daily' 
    ? dailyReportData?.summary 
    : monthlyReportData?.summary;

  const currentRecords = reportType === 'daily'
    ? dailyReportData?.records || []
    : monthlyReportData?.records || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {reportType === 'daily' ? 'Kunlik Hisobot' : 'Oylik Umumiy Hisobot'}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  PDF Eksport
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mijozlar, naqt, karta, avans, qarz va umumiy tushumlar bo'yicha to'liq hisobot
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

        {/* Report Type Switcher & Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
              <button
                onClick={() => setReportType('daily')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  reportType === 'daily'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Kunlik hisobot</span>
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  reportType === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Oylik hisobot</span>
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isLoading || currentRecords.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{reportType === 'daily' ? 'Kunlik PDF yuklab olish' : 'Oylik PDF yuklab olish'}</span>
            </button>
          </div>

          {/* Filter Inputs Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Branch selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Barcha filiallar</option>
                {branches && branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">1-Filial</option>
                    <option value="2">2-Filial</option>
                  </>
                )}
              </select>
            </div>

            {/* Daily Date Picker */}
            {reportType === 'daily' ? (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>
            ) : (
              <>
                {/* Monthly Month Selector */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monthly Year Selector */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="2025">2025-yil</option>
                    <option value="2026">2026-yil</option>
                    <option value="2027">2027-yil</option>
                  </select>
                </div>
              </>
            )}

            <button
              onClick={loadReport}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Qayta yuklash"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Summary Metric Cards */}
          {currentSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Jami mijozlar
                </span>
                <span className="text-base font-bold text-white font-mono">
                  {currentSummary.total_guests} kishi
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Naqt to'lov
                </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {formatCurrency(currentSummary.total_cash)}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  Karta (Plastik)
                </span>
                <span className="text-base font-bold text-indigo-400 font-mono">
                  {formatCurrency(currentSummary.total_card || 0)}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-sky-400" />
                  Oldindan to'lov
                </span>
                <span className="text-base font-bold text-sky-300 font-mono">
                  {formatCurrency(currentSummary.total_advance)}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Qarz miqdori
                </span>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {formatCurrency(currentSummary.total_debt)}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-800/40 bg-emerald-950/10">
                <span className="text-[11px] font-medium text-emerald-300 block mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Umumiy tushum
                </span>
                <span className="text-base font-bold text-emerald-300 font-mono">
                  {formatCurrency(currentSummary.grand_total)}
                </span>
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {reportType === 'daily' 
                  ? `Kunlik mijozlar ro'yxati (${formatDate(selectedDate)})`
                  : `Oylik mijozlar ro'yxati (${selectedMonth}/${selectedYear})`
                }
              </span>
              <span className="text-xs text-slate-400">
                {currentRecords.length} ta yozuv topildi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3.5">F.I.Sh (Mijozning to'liq ismi)</th>
                    <th className="py-3 px-3">Filial / Xona</th>
                    <th className="py-3 px-3 text-right">Naqt</th>
                    <th className="py-3 px-3 text-right">Karta</th>
                    <th className="py-3 px-3 text-right">Oldindan to'lov</th>
                    <th className="py-3 px-3 text-right">Qarz</th>
                    <th className="py-3 px-3 text-center">Kelgan kuni</th>
                    <th className="py-3 px-3 text-center">Ketish vaqti</th>
                    <th className="py-3 px-3 text-center">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-white">
                          {r.guest_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {r.branch_name || `${r.branch_id}-Filial`} • #{r.room_number || r.room_id}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-mono font-semibold">
                          {formatCurrency(r.cash_payment)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-indigo-400 font-mono font-semibold">
                          {formatCurrency(r.card_payment || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-sky-300 font-mono">
                          {formatCurrency(r.advance_payment)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {r.debt > 0 ? (
                            <span className="text-rose-400 font-bold">{formatCurrency(r.debt)}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-400">
                          {formatDate(r.check_in_date)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-400">
                          {formatDate(r.check_out_date)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {r.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              Faol
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Yakunlangan
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Tanlangan davr va filial bo'yicha hech qanday buyurtma topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
