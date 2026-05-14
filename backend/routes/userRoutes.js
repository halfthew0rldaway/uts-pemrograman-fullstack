import express from 'express'
import {
  getAllUsers, getUserById, createUser,
  updateUser, deleteUser, updateProfile,
} from '../controllers/userController.js'
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

/** PUT /api/users/profile — Update profil sendiri (harus sebelum /:id) */
router.put('/profile', authMiddleware, updateProfile)

/** GET /api/users — Daftar semua user */
router.get('/', authMiddleware, adminOnly, getAllUsers)

/** GET /api/users/:id — Detail user */
router.get('/:id', authMiddleware, adminOnly, getUserById)

/** POST /api/users — Buat user baru */
router.post('/', authMiddleware, adminOnly, createUser)

/** PUT /api/users/:id — Update user */
router.put('/:id', authMiddleware, adminOnly, updateUser)

/** DELETE /api/users/:id — Hapus user */
router.delete('/:id', authMiddleware, adminOnly, deleteUser)

export default router
