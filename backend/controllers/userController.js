import express from 'express'
import pool from '../config/db.js'
import bcrypt from 'bcrypt'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import { logActivity, getClientIP, LOG_ACTIONS } from '../utils/logger.js'

// ---------------------------------------------------------------------------
// Controller: GET semua user (dengan pagination & search)
// ---------------------------------------------------------------------------

/**
 * @description Mengambil daftar user dengan pagination dan pencarian.
 * @route   GET /api/users
 * @access  Private (adminOnly)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page, pageSize, search, role, status } = req.query
    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize)

    const conditions = []
    const params = []

    if (search) {
      conditions.push('(u.username LIKE ? OR u.email LIKE ? OR e.full_name LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (role) { conditions.push('u.role = ?'); params.push(role) }
    if (status) { conditions.push('u.status = ?'); params.push(status) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u LEFT JOIN employees e ON u.employee_id = e.id ${where}`,
      params,
    )

    const [users] = await pool.query(
      `SELECT
         u.id, u.employee_id, u.username, u.email, u.role, u.status,
         u.last_login, u.created_at,
         e.full_name, e.division, e.position, e.profile_photo
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )

    return res.status(200).json({
      success: true,
      data: users,
      pagination: buildPaginationMeta(countRows[0].total, currentPage, size),
    })
  } catch (error) {
    console.error('❌ getAllUsers error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data user' })
  }
}

// ---------------------------------------------------------------------------
// Controller: GET satu user berdasarkan ID
// ---------------------------------------------------------------------------

/**
 * @description Mengambil detail satu user berdasarkan ID.
 * @route   GET /api/users/:id
 * @access  Private (adminOnly)
 */
export const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.employee_id, u.username, u.email, u.role, u.status,
              u.last_login, u.created_at, e.full_name, e.division, e.position
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.id = ? LIMIT 1`,
      [req.params.id],
    )
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })
    return res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('❌ getUserById error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data user' })
  }
}

// ---------------------------------------------------------------------------
// Controller: POST buat user baru
// ---------------------------------------------------------------------------

/**
 * @description Membuat akun user baru dengan password di-hash bcrypt.
 * @route   POST /api/users
 * @access  Private (adminOnly)
 */
export const createUser = async (req, res) => {
  try {
    const { employee_id, username, email, password, role, status } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, dan password wajib diisi' })
    }

    // Cek duplikasi username/email
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email],
    )
    if (existing[0]) {
      return res.status(409).json({ success: false, message: 'Username atau email sudah digunakan' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const [result] = await pool.execute(
      `INSERT INTO users (employee_id, username, email, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id || null, username, email, hashedPassword, role || 'Employee', status || 'Active'],
    )

    await logActivity({
      userId: req.user?.id,
      action: LOG_ACTIONS.CREATE_USER,
      target: `user:${result.insertId}`,
      details: { username, email, role: role || 'Employee' },
      ipAddress: getClientIP(req),
    })

    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: { id: result.insertId, username, email, role: role || 'Employee' },
    })
  } catch (error) {
    console.error('❌ createUser error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal membuat user' })
  }
}

// ---------------------------------------------------------------------------
// Controller: PUT update user
// ---------------------------------------------------------------------------

/**
 * @description Memperbarui data user. Password hanya diupdate jika dikirim.
 * @route   PUT /api/users/:id
 * @access  Private (adminOnly)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { employee_id, username, email, password, role, status } = req.body

    const [existing] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [id])
    if (!existing[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })

    // Cek duplikasi email/username milik user lain
    if (email || username) {
      const [dup] = await pool.execute(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ? LIMIT 1',
        [username || '', email || '', id],
      )
      if (dup[0]) return res.status(409).json({ success: false, message: 'Username atau email sudah digunakan' })
    }

    let passwordClause = ''
    const params = [employee_id || null, username, email, role || 'Employee', status || 'Active']

    if (password) {
      const hashed = await bcrypt.hash(password, 12)
      passwordClause = ', password = ?'
      params.push(hashed)
    }

    params.push(id)

    // Ambil data lama untuk deteksi role/status change
    const [oldUser] = await pool.execute('SELECT role, status FROM users WHERE id = ? LIMIT 1', [id])
    const oldRole = oldUser[0]?.role
    const oldStatus = oldUser[0]?.status

    await pool.execute(
      `UPDATE users SET employee_id = ?, username = ?, email = ?, role = ?, status = ?${passwordClause} WHERE id = ?`,
      params,
    )

    const newRole = role || 'Employee'
    const newStatus = status || 'Active'
    const action = oldRole !== newRole ? LOG_ACTIONS.ROLE_CHANGE
      : oldStatus !== newStatus ? LOG_ACTIONS.STATUS_CHANGE
      : LOG_ACTIONS.UPDATE_USER

    await logActivity({
      userId: req.user?.id,
      action,
      target: `user:${id}`,
      details: { username, oldRole, newRole, oldStatus, newStatus },
      ipAddress: getClientIP(req),
    })

    return res.status(200).json({ success: true, message: 'User berhasil diperbarui' })
  } catch (error) {
    console.error('❌ updateUser error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal memperbarui user' })
  }
}

// ---------------------------------------------------------------------------
// Controller: DELETE user
// ---------------------------------------------------------------------------

/**
 * @description Menghapus user berdasarkan ID. Tidak bisa hapus diri sendiri.
 * @route   DELETE /api/users/:id
 * @access  Private (adminOnly)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' })
    }

    const [rows] = await pool.execute('SELECT id, username FROM users WHERE id = ? LIMIT 1', [id])
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })

    await pool.execute('DELETE FROM users WHERE id = ?', [id])

    await logActivity({
      userId: req.user?.id,
      action: LOG_ACTIONS.DELETE_USER,
      target: `user:${id}`,
      details: { username: rows[0].username },
      ipAddress: getClientIP(req),
    })

    return res.status(200).json({ success: true, message: `User "${rows[0].username}" berhasil dihapus` })
  } catch (error) {
    console.error('❌ deleteUser error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal menghapus user' })
  }
}

// ---------------------------------------------------------------------------
// Controller: PUT update profil sendiri (untuk user yang login)
// ---------------------------------------------------------------------------

/**
 * @description User memperbarui profil dan/atau password sendiri.
 * @route   PUT /api/users/profile
 * @access  Private (authMiddleware)
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body
    const userId = req.user.id

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId])
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })

    const user = rows[0]

    // Jika ingin ganti password, verifikasi password lama
    let passwordClause = ''
    const params = [username || user.username, email || user.email]

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Password lama wajib diisi untuk mengganti password' })
      }
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Password lama tidak sesuai' })
      }
      const hashed = await bcrypt.hash(newPassword, 12)
      passwordClause = ', password = ?'
      params.push(hashed)
    }

    params.push(userId)

    await pool.execute(
      `UPDATE users SET username = ?, email = ?${passwordClause} WHERE id = ?`,
      params,
    )

    return res.status(200).json({ success: true, message: 'Profil berhasil diperbarui' })
  } catch (error) {
    console.error('❌ updateProfile error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil' })
  }
}
