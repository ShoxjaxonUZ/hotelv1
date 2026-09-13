// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDB, query } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewarelar
app.use(cors({
  origin: '*', // Vercel yoki istalgan frontend domendan ulanishga ruxsat
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Server sog'lig'ini tekshirish uchun endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/auth/login — Admin kirishi
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();

  if ((u === 'bodomzor-hotel' || u === 'bodomzor' || u === 'bodomzorhotel') && (p === 'Bodom1225' || p === 'bodom1225')) {
    return res.json({
      success: true,
      user: {
        id: 1,
        username: 'Bodomzor-Hotel',
        name: 'Bodomzor Hotel Rahbariyati',
        role: 'admin'
      },
      token: 'bodomzor-jwt-token-' + Date.now()
    });
  }

  // Backup fallback
  if (u === 'admin' && (p === 'Bodom1225' || p === 'admin123')) {
    return res.json({
      success: true,
      user: {
        id: 1,
        username: 'Bodomzor-Hotel',
        name: 'Bodomzor Hotel Rahbariyati',
        role: 'admin'
      },
      token: 'bodomzor-jwt-token-' + Date.now()
    });
  }

  return res.status(401).json({ error: "Noto'g'ri login yoki parol" });
});

/* ==========================================================
   1. FILIALLAR (BRANCHES) ENDPOINTS
   ========================================================== */

// GET /api/branches — Barcha filiallarni xonalar soni va bandlik bilan olish
app.get('/api/branches', async (req, res) => {
  try {
    const sql = `
      SELECT 
        b.id,
        b.name,
        b.address,
        b.phone,
        COUNT(DISTINCT r.id)::INTEGER AS total_rooms,
        COUNT(e.id) FILTER (WHERE e.fish IS NOT NULL AND TRIM(e.fish) != '')::INTEGER AS occupied_slots,
        COALESCE(SUM(e.naqt), 0)::NUMERIC AS total_cash,
        COALESCE(SUM(e.karta), 0)::NUMERIC AS total_card,
        COALESCE(SUM(e.oldindan), 0)::NUMERIC AS total_advance,
        COALESCE(SUM(e.qarz), 0)::NUMERIC AS total_debt
      FROM branches b
      LEFT JOIN rooms r ON r.branch_id = b.id
      LEFT JOIN entries e ON e.room_id = r.id
      GROUP BY b.id
      ORDER BY b.id ASC;
    `;
    const result = await query(sql);
    res.json({ success: true, branches: result.rows });
  } catch (err) {
    console.error('GET /api/branches error:', err);
    res.status(500).json({ error: 'Filiallarni olishda xatolik: ' + err.message });
  }
});

// POST /api/branches — Yangi filial qo'shish (ixtiyoriy rooms_count bilan)
app.post('/api/branches', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, address = '', phone = '', rooms_count = 8 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Filial nomi kiritilishi shart' });
    }

    const numRooms = Math.max(1, Math.min(50, parseInt(rooms_count, 10) || 8));

    await client.query('BEGIN');

    // Filialni saqlash
    const branchRes = await client.query(
      `INSERT INTO branches (name, address, phone) VALUES ($1, $2, $3) RETURNING *;`,
      [name.trim(), address.trim(), phone.trim()]
    );
    const newBranch = branchRes.rows[0];

    // Xonalarni avtomatik yaratish
    for (let r = 1; r <= numRooms; r++) {
      await client.query(
        `INSERT INTO rooms (branch_id, room_num) VALUES ($1, $2);`,
        [newBranch.id, r]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Yangi filial va xonalar muvaffaqiyatli yaratildi',
      branch: { ...newBranch, total_rooms: numRooms }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/branches error:', err);
    res.status(500).json({ error: 'Filial qo\'shishda xatolik: ' + err.message });
  } finally {
    client.release();
  }
});

// PUT /api/branches/:id — Filialni tahrirlash
app.put('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone } = req.body;

    const existing = await query('SELECT * FROM branches WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Filial topilmadi' });
    }

    const current = existing.rows[0];
    const updateRes = await query(
      `UPDATE branches SET 
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING *;`,
      [
        name !== undefined ? name.trim() : current.name,
        address !== undefined ? address.trim() : current.address,
        phone !== undefined ? phone.trim() : current.phone,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Filial ma\'lumotlari yangilandi',
      branch: updateRes.rows[0]
    });
  } catch (err) {
    console.error('PUT /api/branches/:id error:', err);
    res.status(500).json({ error: 'Filialni tahrirlashda xatolik: ' + err.message });
  }
});

// DELETE /api/branches/:id — Filialni o'chirish (CASCADE orqali xonalar ham o'chadi)
app.delete('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delRes = await query('DELETE FROM branches WHERE id = $1 RETURNING *;', [id]);

    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Filial topilmadi' });
    }

    res.json({
      success: true,
      message: 'Filial va unga tegishli barcha ma\'lumotlar o\'chirildi'
    });
  } catch (err) {
    console.error('DELETE /api/branches/:id error:', err);
    res.status(500).json({ error: 'Filialni o\'chirishda xatolik: ' + err.message });
  }
});

/* ==========================================================
   2. XONALAR (ROOMS) ENDPOINTS
   ========================================================== */

// GET /api/rooms/:branch_id — Filialning xonalarini va bandlik sonini olish
app.get('/api/rooms/:branch_id', async (req, res) => {
  try {
    const { branch_id } = req.params;

    const sql = `
      SELECT 
        r.id,
        r.branch_id,
        r.room_num,
        COUNT(e.id) FILTER (WHERE e.fish IS NOT NULL AND TRIM(e.fish) != '')::INTEGER AS occupied_count,
        10 AS max_capacity,
        CASE 
          WHEN COUNT(e.id) FILTER (WHERE e.fish IS NOT NULL AND TRIM(e.fish) != '') >= 10 THEN 'full'
          WHEN COUNT(e.id) FILTER (WHERE e.fish IS NOT NULL AND TRIM(e.fish) != '') > 0 THEN 'partial'
          ELSE 'empty'
        END AS status
      FROM rooms r
      LEFT JOIN entries e ON e.room_id = r.id
      WHERE r.branch_id = $1
      GROUP BY r.id
      ORDER BY r.room_num ASC;
    `;
    const result = await query(sql, [branch_id]);
    res.json({ success: true, rooms: result.rows });
  } catch (err) {
    console.error('GET /api/rooms/:branch_id error:', err);
    res.status(500).json({ error: 'Xonalarni olishda xatolik: ' + err.message });
  }
});

/* ==========================================================
   3. 10 TA QATOR (ENTRIES) ENDPOINTS
   ========================================================== */

// GET /api/entries/:room_id — Xona ichidagi aniq 10 ta qatorni olish
app.get('/api/entries/:room_id', async (req, res) => {
  try {
    const { room_id } = req.params;

    // Mavjud yozuvlarni bazadan olish
    const existing = await query(
      `SELECT * FROM entries WHERE room_id = $1 ORDER BY row_index ASC;`,
      [room_id]
    );

    const map = {};
    existing.rows.forEach(row => {
      map[row.row_index] = row;
    });

    // Har doim 1 dan 10 gacha to'liq 10 ta qatorni qaytarish
    const slots = [];
    for (let i = 1; i <= 10; i++) {
      if (map[i]) {
        slots.push(map[i]);
      } else {
        slots.push({
          id: null,
          room_id: parseInt(room_id, 10),
          row_index: i,
          fish: '',
          naqt: 0,
          karta: 0,
          oldindan: 0,
          qarz: 0,
          arrival_date: '',
          departure_date: ''
        });
      }
    }

    res.json({ success: true, room_id: parseInt(room_id, 10), entries: slots });
  } catch (err) {
    console.error('GET /api/entries/:room_id error:', err);
    res.status(500).json({ error: 'Yozuvlarni olishda xatolik: ' + err.message });
  }
});

// POST /api/entries — Ma'lum bir qatorga kiritish yoki tahrirlash (UPSERT)
app.post('/api/entries', async (req, res) => {
  try {
    const {
      room_id,
      row_index,
      fish = '',
      naqt = 0,
      karta = 0,
      oldindan = 0,
      qarz = 0,
      arrival_date = '',
      departure_date = ''
    } = req.body;

    if (!room_id || !row_index || row_index < 1 || row_index > 10) {
      return res.status(400).json({
        error: 'room_id va row_index (1 dan 10 gacha) kiritilishi shart'
      });
    }

    // PostgreSQL UPSERT: agar mavjud bo'lsa yangilaydi, bo'lmasa yaratadi
    const sql = `
      INSERT INTO entries (
        room_id, row_index, fish, naqt, karta, oldindan, qarz, arrival_date, departure_date, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (room_id, row_index) 
      DO UPDATE SET
        fish = EXCLUDED.fish,
        naqt = EXCLUDED.naqt,
        karta = EXCLUDED.karta,
        oldindan = EXCLUDED.oldindan,
        qarz = EXCLUDED.qarz,
        arrival_date = EXCLUDED.arrival_date,
        departure_date = EXCLUDED.departure_date,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      room_id,
      row_index,
      fish ? fish.trim() : '',
      Number(naqt) || 0,
      Number(karta) || 0,
      Number(oldindan) || 0,
      Number(qarz) || 0,
      arrival_date || '',
      departure_date || ''
    ];

    const result = await query(sql, values);
    res.json({
      success: true,
      message: 'Mijoz ma\'lumoti saqlandi',
      entry: result.rows[0]
    });
  } catch (err) {
    console.error('POST /api/entries error:', err);
    res.status(500).json({ error: 'Yozuvni saqlashda xatolik: ' + err.message });
  }
});

// DELETE /api/entries/:room_id/:row_index — O'rinni bo'shatish
app.delete('/api/entries/:room_id/:row_index', async (req, res) => {
  try {
    const { room_id, row_index } = req.params;
    await query(
      `DELETE FROM entries WHERE room_id = $1 AND row_index = $2;`,
      [room_id, row_index]
    );
    res.json({ success: true, message: 'O\'rin bo\'shatildi' });
  } catch (err) {
    console.error('DELETE entry error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================
   SERVERNI ISHGA TUSHIRISH
   ========================================================== */
async function startServer() {
  try {
    await initDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server http://localhost:${PORT} manzilida ishlamoqda`);
    });
  } catch (err) {
    console.error('❌ Serverni ishga tushirishda xatolik:', err.message);
    process.exit(1);
  }
}

startServer();