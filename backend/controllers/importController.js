import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'
import pool from '../config/db.js'
import { logActivity, getClientIP, LOG_ACTIONS } from '../utils/logger.js'
import { deleteFile } from '../utils/fileHelper.js'

// ---------------------------------------------------------------------------
// Data Cleansing Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize date string to YYYY-MM-DD.
 * Handles: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, Excel serial numbers, ISO strings.
 */
const normalizeDate = (raw) => {
  if (!raw) return null

  // Excel serial number (e.g. 44927)
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw)
    if (date) {
      const y = date.y
      const m = String(date.m).padStart(2, '0')
      const d = String(date.d).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }

  const str = String(raw).trim()

  // Already ISO: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(str)) {
    return str.replace(/\//g, '-')
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Try native Date parse as last resort
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

/** Normalize phone: keep only digits, +, -, spaces. Strip leading/trailing spaces. */
const normalizePhone = (raw) => {
  if (!raw) return ''
  return String(raw).trim().replace(/[^\d+\-\s]/g, '').trim()
}

/** Capitalize each word in a name. Strip HTML tags and extra spaces. */
const cleanName = (raw) => {
  if (!raw) return ''
  return String(raw)
    .replace(/<[^>]*>/g, '')           // strip HTML
    .replace(/\s+/g, ' ')              // collapse spaces
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Validate email format. */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

/** Normalize enum values: trim + capitalize first letter. */
const normalizeEnum = (raw, validValues, fallback = null) => {
  if (!raw) return fallback
  const cleaned = String(raw).trim()
  // Case-insensitive match
  const match = validValues.find((v) => v.toLowerCase() === cleaned.toLowerCase())
  return match || fallback
}

/**
 * @description Import data karyawan dari file Excel (.xlsx/.xls) atau CSV.
 * Melakukan validasi per-baris dan bulk insert ke database.
 *
 * @route   POST /api/employees/import
 * @access  Private (adminOnly)
 * @body    multipart/form-data — field: file
 */
export const importEmployees = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File tidak ditemukan. Upload file Excel atau CSV.' })
  }

  const filePath = req.file.path
  const ext = path.extname(req.file.originalname).toLowerCase()

  try {
    let rows = []

    // --- Parse file ---
    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf-8')
      rows = parse(content, {
        columns: true,         // baris pertama = header
        skip_empty_lines: true,
        trim: true,
      })
    } else {
      // .xlsx / .xls
      const workbook = XLSX.readFile(filePath)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    }

    if (!rows.length) {
      deleteFile(filePath)
      return res.status(400).json({ success: false, message: 'File kosong atau tidak ada data yang bisa diproses.' })
    }

    // --- Required columns ---
    const REQUIRED = [
      'full_name', 'gender', 'birth_date', 'email', 'phone_number',
      'address', 'city', 'province', 'postal_code', 'division',
      'position', 'salary', 'join_date',
    ]

    const errors = []
    const toInsert = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      // --- Data Cleansing ---
      const full_name = cleanName(row.full_name)
      const gender = normalizeEnum(row.gender, ['Male', 'Female'])
      const birth_date = normalizeDate(row.birth_date)
      const email = String(row.email || '').trim().toLowerCase()
      const phone_number = normalizePhone(row.phone_number)
      const address = String(row.address || '').replace(/<[^>]*>/g, '').trim()
      const city = cleanName(row.city)
      const province = cleanName(row.province)
      const postal_code = String(row.postal_code || '').trim()
      const division = String(row.division || '').trim()
      const position = String(row.position || '').trim()
      const salary = parseFloat(String(row.salary || '').replace(/[^\d.]/g, ''))
      const join_date = normalizeDate(row.join_date)
      const employment_status = normalizeEnum(row.employment_status, ['Active', 'Inactive', 'Resigned'], 'Active')
      const marital_status = normalizeEnum(row.marital_status, ['Single', 'Married'], 'Single')
      const emergency_contact = cleanName(row.emergency_contact) || '-'
      const emergency_phone = normalizePhone(row.emergency_phone) || '-'
      const education = String(row.education || '').trim() || '-'

      // --- Validation after cleansing ---
      const rowErrors = []

      if (!full_name) rowErrors.push('full_name kosong')
      if (!gender) rowErrors.push(`gender tidak valid ("${row.gender}") — gunakan Male/Female`)
      if (!birth_date) rowErrors.push(`birth_date tidak valid ("${row.birth_date}") — gunakan YYYY-MM-DD`)
      if (!email) rowErrors.push('email kosong')
      else if (!isValidEmail(email)) rowErrors.push(`format email tidak valid ("${email}")`)
      if (!phone_number) rowErrors.push('phone_number kosong')
      if (!address) rowErrors.push('address kosong')
      if (!city) rowErrors.push('city kosong')
      if (!province) rowErrors.push('province kosong')
      if (!postal_code) rowErrors.push('postal_code kosong')
      if (!division) rowErrors.push('division kosong')
      if (!position) rowErrors.push('position kosong')
      if (isNaN(salary) || salary < 0) rowErrors.push(`salary tidak valid ("${row.salary}")`)
      if (!join_date) rowErrors.push(`join_date tidak valid ("${row.join_date}") — gunakan YYYY-MM-DD`)

      if (rowErrors.length) {
        errors.push(`Baris ${rowNum} (${full_name || 'N/A'}): ${rowErrors.join(', ')}`)
        continue
      }

      toInsert.push({
        full_name, gender, birth_date, email, phone_number,
        address, city, province, postal_code, division, position,
        salary, join_date, employment_status, emergency_contact,
        emergency_phone, education, marital_status,
      })
    }

    // Jika semua baris error, batalkan
    if (!toInsert.length) {
      deleteFile(filePath)
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data valid yang bisa diimport.',
        errors,
      })
    }

    // --- Bulk insert dengan auto-generate employee_code ---
    // Ambil kode terakhir sekali saja
    const [lastCodeRows] = await pool.execute(
      'SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1',
    )
    let lastNumber = 0
    if (lastCodeRows[0]) {
      lastNumber = parseInt(lastCodeRows[0].employee_code.split('-')[1]) || 0
    }

    let inserted = 0
    const skipped = []

    for (const emp of toInsert) {
      // Cek duplikasi email
      const [existing] = await pool.execute(
        'SELECT id FROM employees WHERE email = ? LIMIT 1',
        [emp.email],
      )
      if (existing[0]) {
        skipped.push(`Email ${emp.email} sudah terdaftar — dilewati`)
        continue
      }

      lastNumber++
      const employee_code = `EMP-${String(lastNumber).padStart(3, '0')}`

      await pool.execute(
        `INSERT INTO employees (
          employee_code, full_name, gender, birth_date, email, phone_number,
          address, city, province, postal_code, division, position, salary,
          join_date, employment_status, emergency_contact, emergency_phone,
          education, marital_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_code, emp.full_name, emp.gender, emp.birth_date, emp.email,
          emp.phone_number, emp.address, emp.city, emp.province, emp.postal_code,
          emp.division, emp.position, emp.salary, emp.join_date,
          emp.employment_status, emp.emergency_contact, emp.emergency_phone,
          emp.education, emp.marital_status,
        ],
      )
      inserted++
    }

    // Hapus file import setelah selesai
    deleteFile(filePath)

    await logActivity({
      userId: req.user?.id,
      action: LOG_ACTIONS.CREATE_EMPLOYEE,
      target: 'bulk_import',
      details: { inserted, skipped: skipped.length, errors: errors.length },
      ipAddress: getClientIP(req),
    })

    return res.status(200).json({
      success: true,
      message: `Import selesai. ${inserted} data berhasil diimport.`,
      data: { inserted, skipped, errors },
    })
  } catch (error) {
    deleteFile(filePath)
    console.error('❌ importEmployees error:', error.message)
    return res.status(500).json({ success: false, message: 'Gagal memproses file import.' })
  }
}

/**
 * @description Download template Excel untuk import karyawan.
 * @route   GET /api/employees/import/template
 * @access  Private (adminOnly)
 */
export const downloadImportTemplate = (req, res) => {
  const headers = [
    'full_name', 'gender', 'birth_date', 'email', 'phone_number',
    'address', 'city', 'province', 'postal_code', 'division',
    'position', 'salary', 'join_date', 'employment_status',
    'emergency_contact', 'emergency_phone', 'education', 'marital_status',
  ]

  const example = [{
    full_name: 'Budi Santoso',
    gender: 'Male',
    birth_date: '1990-01-15',
    email: 'budi@example.com',
    phone_number: '081234567890',
    address: 'Jl. Contoh No. 1',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '12345',
    division: 'Teknologi Informasi',
    position: 'Software Engineer',
    salary: '8000000',
    join_date: '2023-01-01',
    employment_status: 'Active',
    emergency_contact: 'Siti Santoso',
    emergency_phone: '081234567891',
    education: 'S1 Teknik Informatika',
    marital_status: 'Single',
  }]

  const ws = XLSX.utils.json_to_sheet(example, { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Disposition', 'attachment; filename="template_import_karyawan.xlsx"')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  return res.send(buffer)
}
