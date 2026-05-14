import pool from '../config/db.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'

/**
 * @description Mengambil daftar activity logs dengan pagination dan filter.
 *
 * @route   GET /api/logs
 * @access  Private (adminOnly)
 * @query   { page, pageSize, action, user_id, search }
 */
export const getActivityLogs = async (req, res) => {
  try {
    const { page, pageSize, action, user_id, search } = req.query
    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize || 20)

    const conditions = []
    const params = []

    if (action) {
      conditions.push('l.action = ?')
      params.push(action)
    }
    if (user_id) {
      conditions.push('l.user_id = ?')
      params.push(user_id)
    }
    if (search) {
      conditions.push('(u.username LIKE ? OR l.target LIKE ? OR l.action LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${where}`,
      params,
    )

    const [logs] = await pool.execute(
      `SELECT
         l.id,
         l.action,
         l.target,
         l.details,
         l.ip_address,
         l.created_at,
         u.username,
         u.email,
         u.role
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )

    // Parse details JSON string ke object
    const parsedLogs = logs.map((log) => ({
      ...log,
      details: log.details ? (() => { try { return JSON.parse(log.details) } catch { return log.details } })() : null,
    }))

    return res.status(200).json({
      success: true,
      data: parsedLogs,
      pagination: buildPaginationMeta(countRows[0].total, currentPage, size),
    })
  } catch (error) {
    console.error('❌ getActivityLogs error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data activity log' })
  }
}

/**
 * @description Mengambil daftar action types yang tersedia untuk filter dropdown.
 *
 * @route   GET /api/logs/actions
 * @access  Private (adminOnly)
 */
export const getLogActions = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT action FROM activity_logs ORDER BY action ASC',
    )
    return res.status(200).json({
      success: true,
      data: rows.map((r) => r.action),
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data actions' })
  }
}
