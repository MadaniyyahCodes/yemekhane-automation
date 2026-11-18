const mysql = require('mysql2/promise');

const ortak = {
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_ADI,
  user: process.env.DB_KULLANICI,
  password: process.env.DB_SIFRE,
  charset: 'utf8mb4',
  timezone: '+03:00',
  dateStrings: true, // dates come back as plain text like "2026-11-18"
  waitForConnections: true,
  connectionLimit: 10,
};

// Writes (and reads that must be fresh) go to the primary
const yazma = mysql.createPool({ ...ortak, host: process.env.DB_YAZMA_HOST });

// Lists and reports go to the replica
const okuma = mysql.createPool({ ...ortak, host: process.env.DB_OKUMA_HOST });

module.exports = { yazma, okuma };