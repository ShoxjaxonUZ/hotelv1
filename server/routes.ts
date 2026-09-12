import { Router } from 'express';
import { getDb, saveDb } from './db.js';

export const router = Router();

// Helper to map sql.js query results to object array
function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = _db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

let _db: any = null;

export async function initRoutes() {
  _db = await getDb();
  return router;
}

// 1. Auth routes
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Foydalanuvchi nomi va parol kiritilishi shart' });
    }

    const users = queryAll(
      `SELECT id, username, name, role FROM users WHERE username = ? AND password = ?`,
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Noto'g'ri login yoki parol kiritildi" });
    }

    const user = users[0];
    const token = `token_${user.id}_${Date.now()}`;
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server xatosi' });
  }
});

router.get('/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      username: 'admin',
      name: 'Bosh Administrator',
      role: 'admin'
    }
  });
});

// 2. Branches: GET list with statistics
router.get('/branches', (req, res) => {
  try {
    const branches = queryAll(`SELECT * FROM branches ORDER BY id ASC`);
    const today = new Date().toISOString().slice(0, 10);

    const result = branches.map((branch: any) => {
      // Fetch rooms for this branch
      const rooms = queryAll(
        `SELECT id, room_number, type, price_per_day, max_capacity FROM rooms WHERE branch_id = ? ORDER BY room_number ASC`,
        [branch.id]
      );

      // Check current active bookings in this branch
      const activeBookings = queryAll(
        `SELECT b.*, r.room_number 
         FROM bookings b
         JOIN rooms r ON b.room_id = r.id
         WHERE b.branch_id = ? AND b.status = 'active'
         AND b.check_in_date <= ? AND b.check_out_date >= ?`,
        [branch.id, today, today]
      );

      const occupiedRoomIds = new Set(activeBookings.map((b: any) => b.room_id));
      const occupiedCount = occupiedRoomIds.size;
      const availableCount = rooms.length - occupiedCount;
      const activeGuestsTotal = activeBookings.length;
      const totalCapacity = rooms.reduce((sum: number, r: any) => sum + (r.max_capacity || 10), 0);

      // Overall financial stats for branch including card_payment
      const stats = queryAll(
        `SELECT 
          COALESCE(SUM(cash_payment), 0) as total_cash,
          COALESCE(SUM(card_payment), 0) as total_card,
          COALESCE(SUM(advance_payment), 0) as total_advance,
          COALESCE(SUM(debt), 0) as total_debt,
          COUNT(*) as total_bookings
         FROM bookings 
         WHERE branch_id = ?`,
        [branch.id]
      )[0] || { total_cash: 0, total_card: 0, total_advance: 0, total_debt: 0, total_bookings: 0 };

      return {
        ...branch,
        total_rooms: rooms.length,
        occupied_rooms: occupiedCount,
        available_rooms: availableCount,
        active_guests_total: activeGuestsTotal,
        total_capacity: totalCapacity,
        total_cash: Number(stats.total_cash),
        total_card: Number(stats.total_card),
        total_advance: Number(stats.total_advance),
        total_debt: Number(stats.total_debt),
        total_bookings: Number(stats.total_bookings)
      };
    });

    res.json({ branches: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Branches: POST Create new branch dynamically
router.post('/branches', (req, res) => {
  try {
    const { name, address = '', phone = '', rooms_count = 8 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Filial nomi kiritilishi shart' });
    }

    // Insert new branch
    _db.run(
      `INSERT INTO branches (name, address, phone) VALUES (?, ?, ?);`,
      [name.trim(), address.trim(), phone.trim()]
    );

    const branchId = _db.exec(`SELECT last_insert_rowid() as id;`)[0]?.values[0]?.[0];

    // Seed rooms for the new branch (10-person capacity per room)
    const numRooms = Math.max(1, Math.min(50, Number(rooms_count) || 8));
    const roomTypes = ['Standart', 'Standart', 'Komfort', 'Komfort', 'Lyuks', 'Lyuks', 'VIP', 'VIP'];
    const prices = [250000, 250000, 350000, 350000, 500000, 500000, 800000, 800000];

    for (let r = 1; r <= numRooms; r++) {
      const type = roomTypes[(r - 1) % roomTypes.length];
      const price = prices[(r - 1) % prices.length];
      _db.run(
        `INSERT INTO rooms (branch_id, room_number, type, price_per_day, max_capacity, status) VALUES (?, ?, ?, ?, ?, ?);`,
        [branchId, r, type, price, 10, 'available']
      );
    }

    saveDb();

    const createdBranch = queryAll(`SELECT * FROM branches WHERE id = ?`, [branchId])[0];

    res.status(201).json({
      success: true,
      message: 'Yangi filial va xonalar muvaffaqiyatli yaratildi',
      branch: createdBranch
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3.1 Branches: PUT Update branch details (name, address, phone)
router.put('/branches/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, address, phone } = req.body;

    const branch = queryAll(`SELECT * FROM branches WHERE id = ?`, [id])[0];
    if (!branch) {
      return res.status(404).json({ error: 'Filial topilmadi' });
    }

    _db.run(
      `UPDATE branches SET 
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone)
       WHERE id = ?;`,
      [
        name !== undefined ? name.trim() : branch.name,
        address !== undefined ? address.trim() : branch.address,
        phone !== undefined ? phone.trim() : branch.phone,
        id
      ]
    );
    saveDb();

    const updated = queryAll(`SELECT * FROM branches WHERE id = ?`, [id])[0];
    res.json({ success: true, message: "Filial ma'lumotlari yangilandi", branch: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3.2 Branches: DELETE Remove branch, its rooms and bookings
router.delete('/branches/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const branch = queryAll(`SELECT * FROM branches WHERE id = ?`, [id])[0];
    if (!branch) {
      return res.status(404).json({ error: 'Filial topilmadi' });
    }

    // Delete associated bookings
    _db.run(`DELETE FROM bookings WHERE branch_id = ?;`, [id]);
    // Delete associated rooms
    _db.run(`DELETE FROM rooms WHERE branch_id = ?;`, [id]);
    // Delete branch
    _db.run(`DELETE FROM branches WHERE id = ?;`, [id]);
    saveDb();

    res.json({ success: true, message: "Filial muvaffaqiyatli o'chirildi" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Rooms for a specific branch
router.get('/branches/:branchId/rooms', (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const today = new Date().toISOString().slice(0, 10);

    const branch = queryAll(`SELECT * FROM branches WHERE id = ?`, [branchId])[0];
    if (!branch) {
      return res.status(404).json({ error: 'Filial topilmadi' });
    }

    const rooms = queryAll(
      `SELECT * FROM rooms WHERE branch_id = ? ORDER BY room_number ASC`,
      [branchId]
    );

    const roomsWithStatus = rooms.map((room: any) => {
      // Find all currently active bookings in this room (out of 10 capacity)
      const activeBookings = queryAll(
        `SELECT * FROM bookings 
         WHERE room_id = ? AND status = 'active' 
         AND check_in_date <= ? AND check_out_date >= ?
         ORDER BY id DESC`,
        [room.id, today, today]
      );

      const activeGuestsCount = activeBookings.length;
      const maxCapacity = room.max_capacity || 10;
      const isFull = activeGuestsCount >= maxCapacity;
      const isOccupied = activeGuestsCount > 0;

      // Total count of history bookings in this room
      const totalBookingsCount = queryAll(
        `SELECT COUNT(*) as count FROM bookings WHERE room_id = ?`,
        [room.id]
      )[0]?.count || 0;

      return {
        ...room,
        max_capacity: maxCapacity,
        active_guests_count: activeGuestsCount,
        is_occupied: isOccupied,
        is_full: isFull,
        current_guest: activeBookings.length > 0 ? activeBookings[0].guest_name : null,
        active_guests: activeBookings.map((b: any) => b.guest_name),
        current_booking: activeBookings.length > 0 ? activeBookings[0] : null,
        total_history_bookings: totalBookingsCount
      };
    });

    res.json({ branch, rooms: roomsWithStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Room detail & bookings table
router.get('/branches/:branchId/rooms/:roomNumber/bookings', (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const roomNumber = parseInt(req.params.roomNumber);
    const today = new Date().toISOString().slice(0, 10);

    const room = queryAll(
      `SELECT * FROM rooms WHERE branch_id = ? AND room_number = ?`,
      [branchId, roomNumber]
    )[0];

    if (!room) {
      return res.status(404).json({ error: 'Xona topilmadi' });
    }

    const branch = queryAll(`SELECT * FROM branches WHERE id = ?`, [branchId])[0];

    const bookings = queryAll(
      `SELECT * FROM bookings WHERE room_id = ? ORDER BY check_in_date DESC, id DESC`,
      [room.id]
    );

    // Active guests in this room right now
    const activeBookings = bookings.filter(
      (b: any) => b.status === 'active' && b.check_in_date <= today && b.check_out_date >= today
    );

    // Calculate totals for room including card_payment
    const totals = queryAll(
      `SELECT 
        COALESCE(SUM(cash_payment), 0) as total_cash,
        COALESCE(SUM(card_payment), 0) as total_card,
        COALESCE(SUM(advance_payment), 0) as total_advance,
        COALESCE(SUM(debt), 0) as total_debt,
        COUNT(*) as total_count
       FROM bookings WHERE room_id = ?`,
      [room.id]
    )[0] || { total_cash: 0, total_card: 0, total_advance: 0, total_debt: 0, total_count: 0 };

    res.json({
      branch,
      room: {
        ...room,
        max_capacity: room.max_capacity || 10,
        active_guests_count: activeBookings.length,
        is_full: activeBookings.length >= (room.max_capacity || 10)
      },
      bookings,
      totals: {
        total_cash: Number(totals.total_cash),
        total_card: Number(totals.total_card),
        total_advance: Number(totals.total_advance),
        total_debt: Number(totals.total_debt),
        total_count: Number(totals.total_count),
        active_count: activeBookings.length,
        capacity: room.max_capacity || 10
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. CRUD: Create Booking with 10-person capacity validation & card_payment
router.post('/bookings', (req, res) => {
  try {
    const {
      branch_id,
      room_id,
      guest_name,
      cash_payment = 0,
      card_payment = 0,
      advance_payment = 0,
      debt = 0,
      check_in_date,
      check_out_date,
      status = 'active',
      phone = '',
      notes = '',
      slot_number = 0
    } = req.body;

    if (!branch_id || !room_id || !guest_name || !check_in_date || !check_out_date) {
      return res.status(400).json({
        error: "Barcha majburiy maydonlarni to'ldiring (Filial, Xona, F.I.Sh, Kelgan kuni, Ketish vaqti)"
      });
    }

    // Check 10-person capacity for this room
    if (status === 'active') {
      const activeCount = queryAll(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE room_id = ? AND status = 'active'
         AND check_in_date <= ? AND check_out_date >= ?`,
        [room_id, check_out_date, check_in_date]
      )[0]?.count || 0;

      if (activeCount >= 10) {
        return res.status(400).json({
          error: "Ushbu xonada maksimal 10 kishilik sig'im to'lgan! Yangi mehmon qo'shish uchun avval biror mehmonni chiqaring yoki boshqa xonani tanlang."
        });
      }
    }

    _db.run(
      `INSERT INTO bookings (
        branch_id, room_id, guest_name, cash_payment, card_payment, advance_payment, debt,
        check_in_date, check_out_date, status, phone, notes, slot_number, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        branch_id,
        room_id,
        guest_name.trim(),
        Number(cash_payment) || 0,
        Number(card_payment) || 0,
        Number(advance_payment) || 0,
        Number(debt) || 0,
        check_in_date,
        check_out_date,
        status,
        phone.trim(),
        notes.trim(),
        Number(slot_number) || 0
      ]
    );

    saveDb();

    const lastId = _db.exec(`SELECT last_insert_rowid() as id;`)[0]?.values[0]?.[0];
    const createdBooking = queryAll(`SELECT * FROM bookings WHERE id = ?`, [lastId])[0];

    res.status(201).json({
      success: true,
      message: "Mijoz ma'lumotlari muvaffaqiyatli saqlandi",
      booking: createdBooking
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. CRUD: Update Booking
router.put('/bookings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      guest_name,
      cash_payment,
      card_payment,
      advance_payment,
      debt,
      check_in_date,
      check_out_date,
      status,
      phone,
      notes,
      slot_number,
      room_id
    } = req.body;

    const existing = queryAll(`SELECT * FROM bookings WHERE id = ?`, [id])[0];
    if (!existing) {
      return res.status(404).json({ error: 'Bron yozuvi topilmadi' });
    }

    // Capacity validation if activating
    if (status === 'active' && existing.status !== 'active') {
      const targetRoomId = room_id || existing.room_id;
      const targetCheckIn = check_in_date || existing.check_in_date;
      const targetCheckOut = check_out_date || existing.check_out_date;

      const activeCount = queryAll(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE room_id = ? AND status = 'active' AND id != ?
         AND check_in_date <= ? AND check_out_date >= ?`,
        [targetRoomId, id, targetCheckOut, targetCheckIn]
      )[0]?.count || 0;

      if (activeCount >= 10) {
        return res.status(400).json({
          error: "Ushbu xonada 10 kishilik sig'im to'lgan! Xonani faol holatga o'tkazib bo'lmaydi."
        });
      }
    }

    _db.run(
      `UPDATE bookings SET 
        guest_name = COALESCE(?, guest_name),
        cash_payment = COALESCE(?, cash_payment),
        card_payment = COALESCE(?, card_payment),
        advance_payment = COALESCE(?, advance_payment),
        debt = COALESCE(?, debt),
        check_in_date = COALESCE(?, check_in_date),
        check_out_date = COALESCE(?, check_out_date),
        status = COALESCE(?, status),
        phone = COALESCE(?, phone),
        notes = COALESCE(?, notes),
        slot_number = COALESCE(?, slot_number),
        room_id = COALESCE(?, room_id),
        updated_at = datetime('now')
      WHERE id = ?`,
      [
        guest_name?.trim() ?? existing.guest_name,
        cash_payment !== undefined ? Number(cash_payment) : existing.cash_payment,
        card_payment !== undefined ? Number(card_payment) : existing.card_payment,
        advance_payment !== undefined ? Number(advance_payment) : existing.advance_payment,
        debt !== undefined ? Number(debt) : existing.debt,
        check_in_date ?? existing.check_in_date,
        check_out_date ?? existing.check_out_date,
        status ?? existing.status,
        phone !== undefined ? phone.trim() : existing.phone,
        notes !== undefined ? notes.trim() : existing.notes,
        slot_number !== undefined ? Number(slot_number) : existing.slot_number,
        room_id ?? existing.room_id,
        id
      ]
    );

    saveDb();

    const updated = queryAll(`SELECT * FROM bookings WHERE id = ?`, [id])[0];
    res.json({
      success: true,
      message: "Ma'lumotlar yangilandi",
      booking: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. CRUD: Delete Booking
router.delete('/bookings/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = queryAll(`SELECT * FROM bookings WHERE id = ?`, [id])[0];
    if (!existing) {
      return res.status(404).json({ error: 'Bron yozuvi topilmadi' });
    }

    _db.run(`DELETE FROM bookings WHERE id = ?`, [id]);
    saveDb();

    res.json({ success: true, message: "Yozuv o'chirildi" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. DAILY REPORT Endpoint (Kunlik hisobot)
router.get('/reports/daily', (req, res) => {
  try {
    const { branchId, date } = req.query;
    const targetDate = date ? String(date) : new Date().toISOString().slice(0, 10);

    let sql = `
      SELECT b.*, br.name as branch_name, r.room_number, r.type as room_type
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      JOIN rooms r ON b.room_id = r.id
      WHERE (b.check_in_date = ? OR (b.check_in_date <= ? AND b.check_out_date >= ?))
    `;
    const params: any[] = [targetDate, targetDate, targetDate];

    if (branchId && branchId !== 'all') {
      sql += ` AND b.branch_id = ?`;
      params.push(parseInt(branchId as string));
    }

    sql += ` ORDER BY r.room_number ASC, b.id DESC`;

    const records = queryAll(sql, params);

    let totalCash = 0;
    let totalCard = 0;
    let totalAdvance = 0;
    let totalDebt = 0;

    records.forEach((r: any) => {
      totalCash += Number(r.cash_payment || 0);
      totalCard += Number(r.card_payment || 0);
      totalAdvance += Number(r.advance_payment || 0);
      totalDebt += Number(r.debt || 0);
    });

    res.json({
      filter: {
        type: 'daily',
        date: targetDate,
        branchId: branchId || 'all'
      },
      summary: {
        total_guests: records.length,
        total_cash: totalCash,
        total_card: totalCard,
        total_advance: totalAdvance,
        total_debt: totalDebt,
        grand_total: totalCash + totalCard + totalAdvance
      },
      records
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. MONTHLY REPORT Endpoint (Oylik hisobot)
router.get('/reports/monthly', (req, res) => {
  try {
    const { branchId, month, year } = req.query;

    const currentYear = year ? String(year) : new Date().getFullYear().toString();
    const currentMonth = month ? String(month).padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
    const monthPattern = `${currentYear}-${currentMonth}-%`;

    let sql = `
      SELECT b.*, br.name as branch_name, r.room_number, r.type as room_type
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      JOIN rooms r ON b.room_id = r.id
      WHERE (b.check_in_date LIKE ? OR b.check_out_date LIKE ?)
    `;
    const params: any[] = [monthPattern, monthPattern];

    if (branchId && branchId !== 'all') {
      sql += ` AND b.branch_id = ?`;
      params.push(parseInt(branchId as string));
    }

    sql += ` ORDER BY b.check_in_date DESC`;

    const records = queryAll(sql, params);

    let totalCash = 0;
    let totalCard = 0;
    let totalAdvance = 0;
    let totalDebt = 0;

    records.forEach((r: any) => {
      totalCash += Number(r.cash_payment || 0);
      totalCard += Number(r.card_payment || 0);
      totalAdvance += Number(r.advance_payment || 0);
      totalDebt += Number(r.debt || 0);
    });

    res.json({
      filter: {
        type: 'monthly',
        year: currentYear,
        month: currentMonth,
        branchId: branchId || 'all'
      },
      summary: {
        total_guests: records.length,
        total_cash: totalCash,
        total_card: totalCard,
        total_advance: totalAdvance,
        total_debt: totalDebt,
        grand_total: totalCash + totalCard + totalAdvance
      },
      records
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
