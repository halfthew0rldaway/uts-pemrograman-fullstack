import express from 'express'
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDivisions,
  exportEmployees,
  deleteEmployeePhoto,
} from '../controllers/employeeController.js'
import { importEmployees, downloadImportTemplate } from '../controllers/importController.js'
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware.js'
import { uploadPhoto, uploadExcel } from '../config/multer.js'

const router = express.Router()

/** GET /api/employees/divisions — Daftar divisi unik (untuk dropdown filter) */
router.get('/divisions', authMiddleware, getDivisions)

/** GET /api/employees/export?format=excel|pdf — Export data */
router.get('/export', authMiddleware, adminOnly, exportEmployees)

/** GET /api/employees/import/template — Download template Excel */
router.get('/import/template', authMiddleware, adminOnly, downloadImportTemplate)

/** POST /api/employees/import — Import data dari Excel/CSV */
router.post('/import', authMiddleware, adminOnly, uploadExcel.single('file'), importEmployees)

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

/** DELETE /api/employees/:id/photo — Hapus foto profil dari server */
router.delete('/:id/photo', authMiddleware, adminOnly, deleteEmployeePhoto)

export default router
