// db.js
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL ulanishlar hovuzi (Connection Pool)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('render.com');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false } // Render.com va bulutli bazalar uchun zarur
});

// Bazadagi jadvallarni avtomatik yaratish funksiyasi
async function initDB() {
  const client = await pool.connect();
  try {
    console.log('🔄 PostgreSQL ma\'lumotlar bazasiga ulanish tekshirilmoqda...');

    await client.query('BEGIN');

    // 1. Filiallar jadvali (branches)
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Xonalar jadvali (rooms)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        room_num INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(branch_id, room_num)
      );
    `);

    // 3. Xona ichidagi 1-10 gacha bo'lgan qatorlar jadvali (entries)
    await client.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        row_index INTEGER NOT NULL CHECK (row_index >= 1 AND row_index <= 10),
        fish VARCHAR(255) DEFAULT '',
        naqt NUMERIC(15, 2) DEFAULT 0,
        karta NUMERIC(15, 2) DEFAULT 0,
        oldindan NUMERIC(15, 2) DEFAULT 0,
        qarz NUMERIC(15, 2) DEFAULT 0,
        arrival_date VARCHAR(50) DEFAULT '',
        departure_date VARCHAR(50) DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id, row_index)
      );
    `);

    // Boshlang'ich 1-filial mavjud bo'lmasa, avtomatik yaratish
    const branchCheck = await client.query('SELECT COUNT(*) FROM branches');
    if (parseInt(branchCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Boshlang\'ich 1-filial va xonalar yaratilmoqda...');
      const newBranch = await client.query(`
        INSERT INTO branches (name, address, phone) 
        VALUES ('1-Filial (Bosh bino)', 'Toshkent sh., Amir Temur ko''chasi, 45', '+998 (71) 200-11-22') 
        RETURNING id;
      `);
      const branchId = newBranch.rows[0].id;

      // 8 ta xonani avtomatik ochish
      for (let r = 1; r <= 8; r++) {
        await client.query(
          `INSERT INTO rooms (branch_id, room_num) VALUES ($1, $2);`,
          [branchId, r]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ PostgreSQL jadvallari tayyor (branches, rooms, entries).');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ma\'lumotlar bazasini initsializatsiya qilishda xatolik:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params)
};