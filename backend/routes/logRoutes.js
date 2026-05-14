import express from 'express'
import { getActivityLogs, getLogActions } from '../controllers/logController.js'
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

/** GET /api/logs/actions — Daftar action types untuk filter */
router.get('/actions', authMiddleware, adminOnly, getLogActions)

/** GET /api/logs — Daftar activity logs dengan pagination */
router.get('/', authMiddleware, adminOnly, getActivityLogs)

export default router
