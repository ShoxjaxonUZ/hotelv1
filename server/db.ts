import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;
const DB_FILE = path.join(process.cwd(), 'hotel.sqlite');

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error loading SQLite file, creating new:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  initSchema(db);
  saveDb();
  return db;
}

export function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      room_number INTEGER NOT NULL,
      type TEXT DEFAULT 'Standart',
      price_per_day REAL DEFAULT 250000,
      max_capacity INTEGER DEFAULT 10,
      status TEXT DEFAULT 'available',
      UNIQUE(branch_id, room_number)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      cash_payment REAL DEFAULT 0,
      card_payment REAL DEFAULT 0,
      advance_payment REAL DEFAULT 0,
      debt REAL DEFAULT 0,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      phone TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      slot_number INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(branch_id) REFERENCES branches(id),
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    );
  `);

  // Check if card_payment column exists in bookings (migration for existing db)
  try {
    database.exec(`SELECT card_payment FROM bookings LIMIT 1;`);
  } catch (err) {
    try {
      database.run(`ALTER TABLE bookings ADD COLUMN card_payment REAL DEFAULT 0;`);
    } catch (e) {
      console.log('card_payment migration note:', e);
    }
  }

  // Check if slot_number column exists in bookings (migration for 1-10 table slots)
  try {
    database.exec(`SELECT slot_number FROM bookings LIMIT 1;`);
  } catch (err) {
    try {
      database.run(`ALTER TABLE bookings ADD COLUMN slot_number INTEGER DEFAULT 0;`);
    } catch (e) {
      console.log('slot_number migration note:', e);
    }
  }

  // Check if max_capacity column exists in rooms
  try {
    const checkCap = database.exec(`SELECT max_capacity FROM rooms LIMIT 1;`);
  } catch (err) {
    try {
      database.run(`ALTER TABLE rooms ADD COLUMN max_capacity INTEGER DEFAULT 10;`);
    } catch (e) {
      console.log('max_capacity migration note:', e);
    }
  }

  // Seed default admin user if not exists
  const userCheck = database.exec(`SELECT COUNT(*) as count FROM users;`);
  const userCount = userCheck[0]?.values[0]?.[0] as number;
  if (!userCount || userCount === 0) {
    database.run(`
      INSERT INTO users (username, password, name, role) 
      VALUES ('admin', 'admin123', 'Bosh Administrator', 'admin');
    `);
  }

  // Seed strictly 1 branch initially as requested
  const branchCheck = database.exec(`SELECT COUNT(*) as count FROM branches;`);
  const branchCount = branchCheck[0]?.values[0]?.[0] as number;
  if (!branchCount || branchCount === 0) {
    database.run(`
      INSERT INTO branches (id, name, address, phone) VALUES 
      (1, '1-Filial (Bosh bino)', 'Toshkent sh., Amir Temur ko''chasi, 45', '+998 (71) 200-11-22');
    `);

    // Seed 8 rooms for Branch 1 with 10-person capacity
    const roomTypes = ['Standart', 'Standart', 'Komfort', 'Komfort', 'Lyuks', 'Lyuks', 'VIP', 'VIP'];
    const prices = [250000, 250000, 350000, 350000, 500000, 500000, 800000, 800000];

    for (let r = 1; r <= 8; r++) {
      database.run(
        `INSERT INTO rooms (branch_id, room_number, type, price_per_day, max_capacity, status) VALUES (?, ?, ?, ?, ?, ?);`,
        [1, r, roomTypes[r - 1], prices[r - 1], 10, 'available']
      );
    }

    // Add initial realistic bookings with cash and card payments
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Guest 1 in Room 1 (Naqt: 300,000, Karta: 200,000, Avans: 100,000, Qarz: 0)
    database.run(`
      INSERT INTO bookings (branch_id, room_id, guest_name, cash_payment, card_payment, advance_payment, debt, check_in_date, check_out_date, status, phone, notes)
      VALUES (1, 1, 'Alisher Qodirov', 300000, 200000, 100000, 0, '${today}', '${tomorrow}', 'active', '+998 90 123-45-67', 'Passport nusxasi olindi');
    `);

    // Guest 2 in Room 1 (Shared room with 10-person capacity)
    database.run(`
      INSERT INTO bookings (branch_id, room_id, guest_name, cash_payment, card_payment, advance_payment, debt, check_in_date, check_out_date, status, phone, notes)
      VALUES (1, 1, 'Bobur Mirzaev', 250000, 150000, 50000, 0, '${today}', '${inThreeDays}', 'active', '+998 97 555-11-22', 'Do''stlar guruhi');
    `);

    // Guest in Room 3 (With debt)
    database.run(`
      INSERT INTO bookings (branch_id, room_id, guest_name, cash_payment, card_payment, advance_payment, debt, check_in_date, check_out_date, status, phone, notes)
      VALUES (1, 3, 'Malika Karimova', 150000, 100000, 50000, 100000, '${yesterday}', '${inThreeDays}', 'active', '+998 93 987-65-43', 'Ertaga qarzni to''laydi');
    `);
  }
}
