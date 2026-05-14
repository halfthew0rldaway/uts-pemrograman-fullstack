import express from 'express'
import { getDashboardStats } from '../controllers/dashboardController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

/** GET /api/dashboard/stats — Statistik ringkasan untuk dashboard */
router.get('/stats', authMiddleware, getDashboardStats)

export default router
