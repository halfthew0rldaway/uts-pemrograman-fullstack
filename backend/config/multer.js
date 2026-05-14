import multer, { diskStorage } from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

// ---------------------------------------------------------------------------
// Helper: Pastikan direktori upload ada, buat jika belum
// ---------------------------------------------------------------------------
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// ---------------------------------------------------------------------------
// Storage engine untuk foto profil karyawan
// ---------------------------------------------------------------------------
const photoStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'photos')
    ensureDir(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Format: photo-<uuid>.<ext> — menghindari konflik nama file
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueName = `photo-${uuidv4()}${ext}`
    cb(null, uniqueName)
  },
})

// ---------------------------------------------------------------------------
// Storage engine untuk file Excel import
// ---------------------------------------------------------------------------
const excelStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'imports')
    ensureDir(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueName = `import-${uuidv4()}${ext}`
    cb(null, uniqueName)
  },
})

// ---------------------------------------------------------------------------
// Filter: Hanya izinkan file gambar (JPEG, PNG, WebP)
// ---------------------------------------------------------------------------
const imageFileFilter = (req, file, cb) => {
  // Strict MIME type check — hanya JPEG dan PNG
  const allowedMimeTypes = ['image/jpeg', 'image/png']
  const allowedExtensions = ['.jpg', '.jpeg', '.png']
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Format file tidak didukung. Hanya JPEG dan PNG yang diizinkan'), false)
  }
}

// ---------------------------------------------------------------------------
// Filter: Hanya izinkan file Excel (.xlsx, .xls)
// ---------------------------------------------------------------------------
const excelFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)'), false)
  }
}

// ---------------------------------------------------------------------------
// Export instance Multer
// ---------------------------------------------------------------------------

/** Multer untuk upload foto profil (maks 2MB) */
export const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
})

/** Multer untuk import data via Excel (maks 5MB) */
export const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: excelFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})
