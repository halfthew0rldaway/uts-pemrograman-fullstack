/**
 * @fileoverview Konfigurasi koneksi database MySQL menggunakan connection pool.
 * Menggunakan environment variables untuk keamanan kredensial.
 */

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

/**
 * MySQL connection pool.
 * Pool digunakan untuk efisiensi koneksi — menghindari overhead
 * membuka/menutup koneksi baru di setiap request.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pt_digital_nusantara',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
})

/**
 * Menguji koneksi ke database saat aplikasi pertama kali dijalankan.
 * Akan melempar error jika koneksi gagal.
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Database connected successfully')
    connection.release()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

export default pool
