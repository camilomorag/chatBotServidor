import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Opción 1: Usar variables separadas
const connection = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Opción 2: Si tienes DATABASE_URL (recomendado)
// const connection = await mysql.createPool(process.env.DATABASE_URL);

export default connection;