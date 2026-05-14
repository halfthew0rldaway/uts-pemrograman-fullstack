import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import pool from '../config/db.js'
import { logActivity, getClientIP, LOG_ACTIONS } from '../utils/logger.js'

// ---------------------------------------------------------------------------
// Helper: Verifikasi Google reCAPTCHA v2 token
// ---------------------------------------------------------------------------

/**
 * @description Memverifikasi token reCAPTCHA ke server Google.
 * @param {string} captchaToken - Token dari client-side reCAPTCHA widget
 * @returns {Promise<boolean>} true jika verifikasi berhasil
 */
const verifyCaptcha = async (captchaToken) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  if (!secretKey) {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY tidak diset — melewati verifikasi CAPTCHA')
    return true
  }

  // Bypass CAPTCHA di mode development dengan token "dev"
  if (process.env.NODE_ENV !== 'production' && captchaToken === 'dev') {
    console.warn('⚠️  CAPTCHA bypass aktif (dev mode)')
    return true
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: captchaToken,
        },
      },
    )
    return response.data.success === true
  } catch (error) {
    console.error('❌ Gagal verifikasi CAPTCHA:', error.message)
    return false
  }
}

// ---------------------------------------------------------------------------
// Helper: Generate JWT access token (short-lived)
// ---------------------------------------------------------------------------

/**
 * @description Membuat JWT access token dengan payload user.
 * @param {{ id, username, email, role }} userPayload
 * @returns {string} JWT token string
 */
const generateAccessToken = (userPayload) => {
  return jwt.sign(userPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  })
}

// ---------------------------------------------------------------------------
// Helper: Generate JWT refresh token (long-lived)
// ---------------------------------------------------------------------------

/**
 * @description Membuat JWT refresh token untuk perpanjangan sesi.
 * @param {{ id }} userPayload
 * @returns {string} JWT refresh token string
 */
const generateRefreshToken = (userPayload) => {
  return jwt.sign({ id: userPayload.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })
}

// ---------------------------------------------------------------------------
// Controller: Login
// ---------------------------------------------------------------------------

/**
 * @description Menangani proses login user.
 * Alur: Validasi input → Verifikasi CAPTCHA → Cek user di DB →
 *       Verifikasi password bcrypt → Buat JWT + Session → Response.
 *
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { email, password, captchaToken, rememberMe }
 */
export const login = async (req, res) => {
  const { email, password, captchaToken, rememberMe } = req.body

  // 1. Validasi input dasar
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi',
    })
  }

  // 2. Verifikasi CAPTCHA
  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'Verifikasi CAPTCHA diperlukan',
    })
  }

  const captchaValid = await verifyCaptcha(captchaToken)
  if (!captchaValid) {
    return res.status(400).json({
      success: false,
      message: 'Verifikasi CAPTCHA gagal, silakan coba lagi',
    })
  }

  try {
    // 3. Cari user berdasarkan email (join ke employees untuk data profil)
    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.employee_id,
         u.username,
         u.email,
         u.password,
         u.role,
         u.status,
         e.full_name,
         e.profile_photo,
         e.division,
         e.position
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.email = ?
       LIMIT 1`,
      [email],
    )

    const user = rows[0]

    // 4. Cek apakah user ditemukan
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      })
    }

    // 5. Cek status akun
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda tidak aktif, hubungi administrator',
      })
    }

    // 6. Verifikasi password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      await logActivity({
        userId: user.id,
        action: LOG_ACTIONS.LOGIN_FAILED,
        target: `user:${user.id}`,
        details: { email, reason: 'Wrong password' },
        ipAddress: getClientIP(req),
      })
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      })
    }

    // 7. Siapkan payload untuk token (tidak menyertakan password)
    const tokenPayload = {
      id: user.id,
      employee_id: user.employee_id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    }

    // 8. Generate JWT tokens
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // 9. Simpan refresh token ke database (kolom remember_token)
    await pool.execute(
      'UPDATE users SET remember_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, user.id],
    )

    // 10. Buat session (hybrid auth)
    req.session.user = tokenPayload
    req.session.isAuthenticated = true

    // Perpanjang masa session jika rememberMe aktif
    if (rememberMe) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000 // 7 hari
    }

    // Log aktivitas login sukses
    await logActivity({
      userId: user.id,
      action: LOG_ACTIONS.LOGIN_SUCCESS,
      target: `user:${user.id}`,
      details: { username: user.username, role: user.role },
      ipAddress: getClientIP(req),
    })

    // 11. Set refresh token sebagai HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    })

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          profile_photo: user.profile_photo,
          division: user.division,
          position: user.position,
        },
      },
    })
  } catch (error) {
    console.error('❌ Login error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat proses login',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: Logout
// ---------------------------------------------------------------------------

/**
 * @description Menghapus session dan invalidasi refresh token di database.
 *
 * @route   POST /api/auth/logout
 * @access  Private (authMiddleware)
 */
export const logout = async (req, res) => {
  try {
    const userId = req.user?.id

    if (userId) {
      // Hapus refresh token dari database
      await pool.execute(
        'UPDATE users SET remember_token = NULL WHERE id = ?',
        [userId],
      )
      // Log aktivitas logout
      await logActivity({
        userId,
        action: LOG_ACTIONS.LOGOUT,
        target: `user:${userId}`,
        ipAddress: getClientIP(req),
      })
    }

    // Hapus session
    req.session.destroy((err) => {
      if (err) {
        console.error('⚠️  Gagal menghapus session:', err.message)
      }
    })

    // Hapus cookie refresh token
    res.clearCookie('refreshToken')

    return res.status(200).json({
      success: true,
      message: 'Logout berhasil',
    })
  } catch (error) {
    console.error('❌ Logout error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat proses logout',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: Refresh Access Token
// ---------------------------------------------------------------------------

/**
 * @description Memperbarui access token menggunakan refresh token dari cookie.
 *
 * @route   POST /api/auth/refresh
 * @access  Public (menggunakan cookie)
 */
export const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token tidak ditemukan',
    })
  }

  try {
    // Verifikasi refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

    // Cek apakah token masih tersimpan di database (belum di-logout)
    const [rows] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ? AND remember_token = ? AND status = "Active"',
      [decoded.id, token],
    )

    if (!rows[0]) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token tidak valid atau sudah kadaluarsa',
      })
    }

    const user = rows[0]
    const newAccessToken = generateAccessToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    })
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Refresh token tidak valid atau sudah kadaluarsa',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: Get Current User Profile
// ---------------------------------------------------------------------------

/**
 * @description Mengambil data profil user yang sedang login.
 *
 * @route   GET /api/auth/me
 * @access  Private (authMiddleware)
 */
export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.employee_id,
         u.username,
         u.email,
         u.role,
         u.status,
         u.last_login,
         e.full_name,
         e.profile_photo,
         e.division,
         e.position,
         e.phone_number
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.id],
    )

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      })
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error('❌ getMe error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil',
    })
  }
}
