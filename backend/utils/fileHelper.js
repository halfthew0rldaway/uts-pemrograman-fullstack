import fs from 'fs'
import path from 'path'

/**
 * @description Menghapus file fisik dari server secara aman.
 * Tidak melempar error jika file tidak ditemukan (idempotent).
 * @param {string} filePath - Path relatif atau absolut ke file
 */
export const deleteFile = (filePath) => {
  if (!filePath) return

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), 'uploads', filePath)

  fs.unlink(absolutePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`⚠️  Gagal menghapus file: ${absolutePath}`, err.message)
    }
  })
}

/**
 * @description Membangun URL publik untuk mengakses file upload.
 * @param {string} filename - Nama file yang tersimpan
 * @param {string} subfolder - Subfolder dalam direktori uploads (contoh: 'photos')
 * @returns {string|null} URL publik atau null jika filename kosong
 */
export const buildFileUrl = (filename, subfolder = '') => {
  if (!filename) return null
  const base = process.env.APP_URL || 'http://localhost:5000'
  return subfolder
    ? `${base}/uploads/${subfolder}/${filename}`
    : `${base}/uploads/${filename}`
}
