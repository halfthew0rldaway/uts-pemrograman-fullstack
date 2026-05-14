import pool from '../config/db.js'

/**
 * @description Mencatat aktivitas pengguna ke tabel activity_logs.
 * Fire-and-forget — tidak memblokir response jika gagal.
 *
 * @param {object} params
 * @param {number|null} params.userId   - ID user yang melakukan aksi
 * @param {string}      params.action   - Jenis aksi (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, dll)
 * @param {string|null} params.target   - Target aksi, contoh: "employee:5"
 * @param {object|null} params.details  - Detail tambahan (akan di-JSON.stringify)
 * @param {string|null} params.ipAddress - IP address client
 */
export const logActivity = async ({ userId = null, action, target = null, details = null, ipAddress = null }) => {
  try {
    const detailsStr = details ? JSON.stringify(details) : null
    await pool.execute(
      `INSERT INTO activity_logs (user_id, action, target, details, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, target, detailsStr, ipAddress],
    )
  } catch (error) {
    // Log ke console tapi jangan crash aplikasi
    console.error('⚠️  Failed to write activity log:', error.message)
  }
}

/**
 * @description Mengambil IP address dari request Express.
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
export const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

/**
 * @description Konstanta aksi yang tersedia untuk konsistensi.
 */
export const LOG_ACTIONS = {
  LOGIN_SUCCESS:   'LOGIN_SUCCESS',
  LOGIN_FAILED:    'LOGIN_FAILED',
  LOGOUT:          'LOGOUT',
  CREATE_EMPLOYEE: 'CREATE_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  CREATE_USER:     'CREATE_USER',
  UPDATE_USER:     'UPDATE_USER',
  DELETE_USER:     'DELETE_USER',
  ROLE_CHANGE:     'ROLE_CHANGE',
  STATUS_CHANGE:   'STATUS_CHANGE',
  EXPORT_DATA:     'EXPORT_DATA',
}
