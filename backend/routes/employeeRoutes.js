import express from 'express'
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDivisions,
  exportEmployees,
} from '../controllers/employeeController.js'
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware.js'
import { uploadPhoto } from '../config/multer.js'

const router = express.Router()

/** GET /api/employees/divisions — Daftar divisi unik (untuk dropdown filter) */
router.get('/divisions', authMiddleware, getDivisions)

/** GET /api/employees/export?format=excel|pdf — Export data */
router.get('/export', authMiddleware, adminOnly, exportEmployees)

/** GET /api/employees — Daftar karyawan dengan search & pagination */
router.get('/', authMiddleware, getAllEmployees)

/** GET /api/employees/:id — Detail satu karyawan */
router.get('/:id', authMiddleware, getEmployeeById)

/** POST /api/employees — Tambah karyawan baru */
router.post('/', authMiddleware, adminOnly, uploadPhoto.single('profile_photo'), createEmployee)

/** PUT /api/employees/:id — Update data karyawan */
router.put('/:id', authMiddleware, adminOnly, uploadPhoto.single('profile_photo'), updateEmployee)

/** DELETE /api/employees/:id — Hapus karyawan */
router.delete('/:id', authMiddleware, adminOnly, deleteEmployee)

export default router
