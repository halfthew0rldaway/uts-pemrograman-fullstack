import jwt from 'jsonwebtoken'

/**
 * @description Memvalidasi JWT token dari header Authorization.
 * Menyimpan payload user ke req.user jika valid.
 */
export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' })
  }
}

/**
 * @description Memvalidasi session login.
 * Digunakan sebagai fallback atau alternatif JWT untuk web browser.
 */
export const verifySession = (req, res, next) => {
  if (!req.session || !req.session.user) {
    if (req.headers['accept'] === 'application/json' || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid, silakan login kembali' })
    }
    return res.redirect('/auth/login')
  }
  req.user = req.session.user
  next()
}

/**
 * @description Hybrid auth — menerima JWT (API) atau Session (browser).
 * Cocok untuk endpoint yang diakses dari dua sumber.
 */
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
      return next()
    } catch {
      return res.status(403).json({ success: false, message: 'Token tidak valid' })
    }
  }

  if (req.session && req.session.user) {
    req.user = req.session.user
    return next()
  }

  if (req.headers['accept'] === 'application/json' || req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' })
  }
  return res.redirect('/auth/login')
}

/**
 * @description Middleware untuk membatasi akses hanya ke role Admin.
 * Harus digunakan setelah authMiddleware.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak: hanya Admin yang diizinkan' })
  }
  next()
}

/**
 * @description Global error handler middleware.
 * Menangkap semua error yang di-throw dari controller.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
