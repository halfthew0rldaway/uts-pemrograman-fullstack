/**
 * @description Utilitas sanitasi dan validasi input untuk mencegah XSS,
 * injeksi data, dan nilai tidak valid sebelum masuk ke database.
 */

/**
 * Hapus tag HTML/script dari string (XSS protection).
 * @param {string} str
 * @returns {string}
 */
export const stripHtml = (str) => {
  if (typeof str !== 'string') return str
  return str
    .replace(/<[^>]*>/g, '')           // hapus semua tag HTML
    .replace(/javascript:/gi, '')       // hapus javascript: protocol
    .replace(/on\w+\s*=/gi, '')         // hapus event handlers (onclick=, etc)
    .trim()
}

/**
 * Potong string ke panjang maksimal.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export const truncate = (str, max) => {
  if (typeof str !== 'string') return str
  return str.length > max ? str.substring(0, max) : str
}

/**
 * Sanitasi objek — strip HTML dari semua nilai string.
 * @param {object} obj
 * @returns {object}
 */
export const sanitizeObject = (obj) => {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = stripHtml(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Validasi ENUM — lempar error jika nilai tidak ada di daftar.
 * @param {string} value
 * @param {string[]} allowed
 * @param {string} fieldName
 * @throws {Error}
 */
export const validateEnum = (value, allowed, fieldName) => {
  if (value && !allowed.includes(value)) {
    const err = new Error(`Nilai "${value}" tidak valid untuk field ${fieldName}. Nilai yang diizinkan: ${allowed.join(', ')}`)
    err.statusCode = 400
    throw err
  }
}

/**
 * Validasi panjang string — lempar error jika terlalu panjang.
 * @param {string} value
 * @param {number} max
 * @param {string} fieldName
 * @throws {Error}
 */
export const validateLength = (value, max, fieldName) => {
  if (value && String(value).length > max) {
    const err = new Error(`Field ${fieldName} maksimal ${max} karakter`)
    err.statusCode = 400
    throw err
  }
}

/**
 * Validasi format email.
 * @param {string} email
 * @throws {Error}
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (email && !re.test(email)) {
    const err = new Error('Format email tidak valid')
    err.statusCode = 400
    throw err
  }
}

/**
 * Validasi nilai numerik tidak negatif.
 * @param {number|string} value
 * @param {string} fieldName
 * @throws {Error}
 */
export const validateNonNegative = (value, fieldName) => {
  const num = parseFloat(value)
  if (!isNaN(num) && num < 0) {
    const err = new Error(`Field ${fieldName} tidak boleh bernilai negatif`)
    err.statusCode = 400
    throw err
  }
}
