import pool from '../config/db.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { logActivity, getClientIP, LOG_ACTIONS } from '../utils/logger.js'

/**
 * @description Meminta reset password — generate token dan simpan ke DB.
 * Dalam production, token dikirim via email. Di development, token dikembalikan
 * langsung di response untuk kemudahan testing.
 *
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * @body    { email }
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' })
    }

    const [rows] = await pool.execute(
      'SELECT id, username, email FROM users WHERE email = ? AND status = "Active" LIMIT 1',
      [email],
    )

    // Selalu return 200 untuk mencegah user enumeration attack
    if (!rows[0]) {
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, instruksi reset password telah dikirim.',
      })
    }

    const user = rows[0]

    // Generate token acak 32 bytes
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 jam

    // Simpan hash token ke database
    await pool.execute(
      `UPDATE users SET
         remember_token = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [`reset:${resetTokenHash}:${expiresAt.toISOString()}`, user.id],
    )

    await logActivity({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      target: `user:${user.id}`,
      details: { email },
      ipAddress: getClientIP(req),
    })

    // Di production: kirim email dengan link reset
    // Di development: kembalikan token langsung
    const isDev = process.env.NODE_ENV !== 'production'

    return res.status(200).json({
      success: true,
      message: 'Jika email terdaftar, instruksi reset password telah dikirim.',
      ...(isDev && {
        dev_token: resetToken,
        dev_note: 'Token ini hanya muncul di mode development',
      }),
    })
  } catch (error) {
    console.error('❌ forgotPassword error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal memproses permintaan' })
  }
}

/**
 * @description Reset password menggunakan token yang valid.
 *
 * @route   POST /api/auth/reset-password
 * @access  Public
 * @body    { token, newPassword, confirmPassword }
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password baru dan konfirmasi tidak cocok' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' })
    }

    // Hash token yang diterima untuk dibandingkan dengan yang di DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Cari user dengan token yang cocok
    const [rows] = await pool.execute(
      `SELECT id, username, remember_token FROM users
       WHERE remember_token LIKE ? AND status = "Active" LIMIT 1`,
      [`reset:${tokenHash}:%`],
    )

    if (!rows[0]) {
      return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah digunakan' })
    }

    const user = rows[0]

    // Cek apakah token sudah expired
    const tokenParts = user.remember_token.split(':')
    const expiresAt = new Date(tokenParts[2])
    if (new Date() > expiresAt) {
      return res.status(400).json({ success: false, message: 'Token sudah kadaluarsa. Silakan minta reset password baru.' })
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password dan hapus token
    await pool.execute(
      `UPDATE users SET
         password = ?,
         remember_token = NULL,
         updated_at = NOW()
       WHERE id = ?`,
      [hashedPassword, user.id],
    )

    await logActivity({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      target: `user:${user.id}`,
      details: { username: user.username },
      ipAddress: getClientIP(req),
    })

    return res.status(200).json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    })
  } catch (error) {
    console.error('❌ resetPassword error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal mereset password' })
  }
}
