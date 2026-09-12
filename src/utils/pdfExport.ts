import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, MonthlyReportResponse, DailyReportResponse } from '../types';
import { formatCurrency, formatDate } from './formatters';

// 1. Export Daily Report to PDF (Kunlik hisobot)
export function exportDailyReportToPDF(reportData: DailyReportResponse) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const { filter, summary, records } = reportData;
  const branchLabel = filter.branchId === 'all' 
    ? 'Barcha filiallar' 
    : `${filter.branchId}-Filial`;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BODOMZOR HOTEL - KUNLIK MOLIYAVIY HISOBOT', 14, 12);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Kunlik hisobot | Sana: ${formatDate(filter.date)} | ${branchLabel}`, 14, 20);

  const generationDate = new Date().toLocaleString('uz-UZ');
  doc.setFontSize(8.5);
  doc.text(`Chop etilgan vaqt: ${generationDate}`, 215, 20);

  // Summary Metrics Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("Kunlik kassa va mijozlar hisoboti xulosasi:", 14, 37);

  // 6 Metric Cards
  const cards = [
    { label: 'Jami mijozlar', val: `${summary.total_guests} kishi`, bg: [241, 245, 249], border: [203, 213, 225] },
    { label: "Naqt to'lov", val: formatCurrency(summary.total_cash), bg: [240, 253, 244], border: [187, 247, 208] },
    { label: "Karta (Plastik)", val: formatCurrency(summary.total_card), bg: [238, 242, 255], border: [199, 210, 254] },
    { label: "Oldindan to'lov", val: formatCurrency(summary.total_advance), bg: [245, 243, 255], border: [221, 214, 254] },
    { label: 'Qarz miqdori', val: formatCurrency(summary.total_debt), bg: [254, 242, 242], border: [254, 202, 202] },
    { label: 'Umumiy tushum', val: formatCurrency(summary.grand_total), bg: [236, 253, 245], border: [167, 243, 208] },
  ];

  const cardWidth = 43;
  const cardHeight = 15;
  const startX = 14;
  const cardY = 41;

  cards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + 2.5);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 2.5, cardY + 5.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.val, x + 2.5, cardY + 11.5);
  });

  // Table rows with exact columns requested:
  // No, F.I.Sh, Naqt, Karta, Oldindan to'lov, Qarz, Kelgan kuni, Ketish vaqti
  const tableRows = records.map((r, index) => [
    (index + 1).toString(),
    r.guest_name || '-',
    `${r.branch_name || (r.branch_id + '-Filial')} - Xona #${r.room_number || r.room_id}`,
    formatCurrency(r.cash_payment),
    formatCurrency(r.card_payment || 0),
    formatCurrency(r.advance_payment),
    formatCurrency(r.debt),
    formatDate(r.check_in_date),
    formatDate(r.check_out_date),
    r.status === 'active' ? 'Faol (Band)' : (r.status === 'completed' ? 'Yakunlangan' : 'Bekor')
  ]);

  autoTable(doc, {
    startY: 61,
    head: [[
      'No',
      'F.I.Sh (Mijozning to\'liq ismi)',
      'Filial / Xona',
      'Naqt',
      'Karta',
      "Oldindan to'lov",
      'Qarz',
      'Kelgan kuni',
      'Ketish vaqti',
      'Holati'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 46 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 24 },
      8: { halign: 'center', cellWidth: 24 },
      9: { halign: 'center', cellWidth: 23 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    foot: [[
      'JAMI',
      `${records.length} ta mehmon`,
      '-',
      formatCurrency(summary.total_cash),
      formatCurrency(summary.total_card),
      formatCurrency(summary.total_advance),
      formatCurrency(summary.total_debt),
      '-',
      '-',
      formatCurrency(summary.grand_total)
    ]],
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold'
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY < 192) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Hisobotni tasdiqladi (Administrator): _____________________', 14, finalY);
    doc.text('Kassir / Hisobchi: _____________________', 190, finalY);
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Sahifa ${i} / ${pageCount} | Mehmonxona boshqaruv tizimi kunlik hisoboti`, 14, 202);
  }

  doc.save(`Kunlik_Hisobot_${filter.date}_Filial_${filter.branchId}.pdf`);
}

// 2. Export Monthly Report to PDF (Oylik hisobot)
export function exportMonthlyReportToPDF(reportData: MonthlyReportResponse) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const { filter, summary, records } = reportData;
  const monthNames: Record<string, string> = {
    '01': 'Yanvar', '02': 'Fevral', '03': 'Mart', '04': 'Aprel',
    '05': 'May', '06': 'Iyun', '07': 'Iyul', '08': 'Avgust',
    '09': 'Sentyabr', '10': 'Oktyabr', '11': 'Noyabr', '12': 'Dekabr'
  };

  const monthLabel = monthNames[filter.month] || filter.month;
  const branchLabel = filter.branchId === 'all' 
    ? 'Barcha filiallar' 
    : `${filter.branchId}-Filial`;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BODOMZOR HOTEL - OYLIK MOLIYAVIY HISOBOT', 14, 12);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Oylik umumiy hisobot | Davr: ${monthLabel} ${filter.year} | ${branchLabel}`, 14, 20);

  const generationDate = new Date().toLocaleString('uz-UZ');
  doc.setFontSize(8.5);
  doc.text(`Chop etilgan vaqt: ${generationDate}`, 215, 20);

  // Summary Cards
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("Oylik moliyaviy va mijozlar ko'rsatkichlari xulosasi:", 14, 37);

  const cards = [
    { label: 'Jami mijozlar', val: `${summary.total_guests} kishi`, bg: [241, 245, 249], border: [203, 213, 225] },
    { label: "Jami Naqt to'lov", val: formatCurrency(summary.total_cash), bg: [240, 253, 244], border: [187, 247, 208] },
    { label: "Jami Karta to'lov", val: formatCurrency(summary.total_card), bg: [238, 242, 255], border: [199, 210, 254] },
    { label: "Jami Oldindan to'lov", val: formatCurrency(summary.total_advance), bg: [245, 243, 255], border: [221, 214, 254] },
    { label: 'Jami Qarz miqdori', val: formatCurrency(summary.total_debt), bg: [254, 242, 242], border: [254, 202, 202] },
    { label: 'Umumiy tushum', val: formatCurrency(summary.grand_total), bg: [236, 253, 245], border: [167, 243, 208] },
  ];

  const cardWidth = 43;
  const cardHeight = 15;
  const startX = 14;
  const cardY = 41;

  cards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + 2.5);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 2.5, cardY + 5.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.val, x + 2.5, cardY + 11.5);
  });

  const tableRows = records.map((r, index) => [
    (index + 1).toString(),
    r.guest_name || '-',
    `${r.branch_name || (r.branch_id + '-Filial')} - Xona #${r.room_number || r.room_id}`,
    formatCurrency(r.cash_payment),
    formatCurrency(r.card_payment || 0),
    formatCurrency(r.advance_payment),
    formatCurrency(r.debt),
    formatDate(r.check_in_date),
    formatDate(r.check_out_date),
    r.status === 'active' ? 'Faol (Band)' : (r.status === 'completed' ? 'Yakunlangan' : 'Bekor')
  ]);

  autoTable(doc, {
    startY: 61,
    head: [[
      'No',
      'F.I.Sh (Mijozning to\'liq ismi)',
      'Filial / Xona',
      'Naqt',
      'Karta',
      "Oldindan to'lov",
      'Qarz',
      'Kelgan kuni',
      'Ketish vaqti',
      'Holati'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 46 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 24 },
      8: { halign: 'center', cellWidth: 24 },
      9: { halign: 'center', cellWidth: 23 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    foot: [[
      'JAMI',
      `${records.length} ta buyurtma`,
      '-',
      formatCurrency(summary.total_cash),
      formatCurrency(summary.total_card),
      formatCurrency(summary.total_advance),
      formatCurrency(summary.total_debt),
      '-',
      '-',
      formatCurrency(summary.grand_total)
    ]],
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold'
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY < 192) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Hisobotni tasdiqladi (Bosh Administrator): _____________________', 14, finalY);
    doc.text('Bosh hisobchi: _____________________', 190, finalY);
  }

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sahifa ${i} / ${pageCount} | Mehmonxona boshqaruv tizimi oylik hisoboti`,
      14,
      202
    );
  }

  doc.save(`Oylik_Hisobot_${monthLabel}_${filter.year}_Filial_${filter.branchId}.pdf`);
}

// 3. Export Room Bookings to PDF
export function exportRoomBookingsToPDF(
  branchName: string,
  roomNumber: number,
  roomType: string,
  bookings: Booking[],
  totals: {
    total_cash: number;
    total_card: number;
    total_advance: number;
    total_debt: number;
    total_count: number;
    active_count: number;
    capacity: number;
  }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BODOMZOR HOTEL - XONA MEHMONLARI RO\'YXATI', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`${branchName} | Xona #${roomNumber} (${roomType} • Sig'imi: ${totals.capacity} kishi) | Hozirda band: ${totals.active_count}/${totals.capacity} joy`, 14, 19);

  doc.setFontSize(8.5);
  doc.text(`Sana: ${new Date().toLocaleString('uz-UZ')}`, 215, 19);

  // Summary line
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Jami mijozlar: ${totals.total_count} ta  |  Naqt: ${formatCurrency(totals.total_cash)}  |  Karta: ${formatCurrency(totals.total_card)}  |  Avans: ${formatCurrency(totals.total_advance)}  |  Qarz: ${formatCurrency(totals.total_debt)}  |  Kassa tushumi: ${formatCurrency(totals.total_cash + totals.total_card + totals.total_advance)}`,
    14,
    35
  );

  const tableRows = bookings.map((b, idx) => [
    (idx + 1).toString(),
    b.guest_name,
    formatCurrency(b.cash_payment),
    formatCurrency(b.card_payment || 0),
    formatCurrency(b.advance_payment),
    formatCurrency(b.debt),
    formatDate(b.check_in_date),
    formatDate(b.check_out_date),
    b.status === 'active' ? 'Faol (Band)' : (b.status === 'completed' ? 'Yakunlangan' : 'Bekor')
  ]);

  autoTable(doc, {
    startY: 42,
    head: [[
      'No',
      'F.I.Sh (Mijozning to\'liq ismi)',
      'Naqt',
      'Karta',
      "Oldindan to'lov",
      'Qarz',
      'Kelgan kuni',
      'Ketish vaqti',
      'Holati'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'center', cellWidth: 28 },
      7: { halign: 'center', cellWidth: 28 },
      8: { halign: 'center', cellWidth: 26 },
    },
    foot: [[
      'JAMI',
      `${totals.total_count} kishi`,
      formatCurrency(totals.total_cash),
      formatCurrency(totals.total_card),
      formatCurrency(totals.total_advance),
      formatCurrency(totals.total_debt),
      '-',
      '-',
      '-'
    ]],
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold'
    }
  });

  doc.save(`Xona_${roomNumber}_${branchName.replace(/\s+/g, '_')}_Hisoboti.pdf`);
}
