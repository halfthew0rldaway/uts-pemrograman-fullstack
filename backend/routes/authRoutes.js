import express from 'express'
import { login, logout, refreshToken, getMe } from '../controllers/authController.js'
import { forgotPassword, resetPassword } from '../controllers/passwordResetController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

/** POST /api/auth/login — Login dengan JWT + Session + CAPTCHA */
router.post('/login', login)

/** POST /api/auth/logout — Logout & hapus session */
router.post('/logout', authMiddleware, logout)

/** POST /api/auth/refresh — Perbarui access token */
router.post('/refresh', refreshToken)

/** GET /api/auth/me — Profil user yang sedang login */
router.get('/me', authMiddleware, getMe)

/** POST /api/auth/forgot-password — Request token reset password */
router.post('/forgot-password', forgotPassword)

/** POST /api/auth/reset-password — Reset password dengan token */
router.post('/reset-password', resetPassword)

export default router
