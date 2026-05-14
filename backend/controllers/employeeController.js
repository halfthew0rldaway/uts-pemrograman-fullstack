import pool from '../config/db.js'
import { getPagination, buildPaginationMeta } from '../utils/pagination.js'
import { deleteFile, buildFileUrl } from '../utils/fileHelper.js'
import { exportToExcel, exportToPDF } from '../utils/exportHelper.js'
import { logActivity, getClientIP, LOG_ACTIONS } from '../utils/logger.js'
import { sanitizeObject, validateEnum, validateLength, validateEmail, validateNonNegative } from '../utils/sanitize.js'

// ---------------------------------------------------------------------------
// Helper: Generate kode karyawan otomatis (EMP-001, EMP-002, dst.)
// ---------------------------------------------------------------------------

/**
 * @description Membuat kode karyawan unik berurutan berdasarkan data terakhir.
 * @returns {Promise<string>} Kode karyawan baru, contoh: "EMP-042"
 */
const generateEmployeeCode = async () => {
  const [rows] = await pool.execute(
    'SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1',
  )

  if (!rows[0]) return 'EMP-001'

  const lastCode = rows[0].employee_code // contoh: "EMP-041"
  const lastNumber = parseInt(lastCode.split('-')[1]) || 0
  const nextNumber = String(lastNumber + 1).padStart(3, '0')
  return `EMP-${nextNumber}`
}

// ---------------------------------------------------------------------------
// Controller: GET semua karyawan (dengan search & pagination)
// ---------------------------------------------------------------------------

/**
 * @description Mengambil daftar karyawan dengan fitur pencarian multi-kolom
 * dan pagination server-side.
 *
 * @route   GET /api/employees
 * @access  Private (authMiddleware)
 * @query   { page, pageSize, search, division, employment_status }
 */
export const getAllEmployees = async (req, res) => {
  try {
    const { page, pageSize, search, division, employment_status } = req.query
    const { limit, offset, page: currentPage, pageSize: size } = getPagination(page, pageSize)

    // Bangun kondisi WHERE secara dinamis
    const conditions = []
    const queryParams = []

    if (search) {
      conditions.push('(e.full_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)')
      const likeValue = `%${search}%`
      queryParams.push(likeValue, likeValue, likeValue)
    }

    if (division) {
      conditions.push('e.division = ?')
      queryParams.push(division)
    }

    if (employment_status) {
      conditions.push('e.employment_status = ?')
      queryParams.push(employment_status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Query total data untuk metadata pagination
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM employees e ${whereClause}`,
      queryParams,
    )
    const totalItems = countRows[0].total

    // Query data utama
    const [employees] = await pool.execute(
      `SELECT
         e.id,
         e.employee_code,
         e.full_name,
         e.gender,
         e.email,
         e.phone_number,
         e.city,
         e.province,
         e.division,
         e.position,
         e.salary,
         e.join_date,
         e.employment_status,
         e.profile_photo,
         e.education,
         e.marital_status,
         e.created_at
       FROM employees e
       ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    )

    return res.status(200).json({
      success: true,
      data: employees,
      pagination: buildPaginationMeta(totalItems, currentPage, size),
    })
  } catch (error) {
    console.error('❌ getAllEmployees error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data karyawan',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: GET satu karyawan berdasarkan ID
// ---------------------------------------------------------------------------

/**
 * @description Mengambil detail lengkap satu karyawan berdasarkan ID.
 *
 * @route   GET /api/employees/:id
 * @access  Private (authMiddleware)
 * @param   id - ID karyawan
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await pool.execute(
      `SELECT
         e.*,
         u.username,
         u.email AS user_email,
         u.role,
         u.status AS user_status,
         u.last_login
       FROM employees e
       LEFT JOIN users u ON u.employee_id = e.id
       WHERE e.id = ?
       LIMIT 1`,
      [id],
    )

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: `Karyawan dengan ID ${id} tidak ditemukan`,
      })
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error('❌ getEmployeeById error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail karyawan',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: POST buat karyawan baru
// ---------------------------------------------------------------------------

/**
 * @description Membuat data karyawan baru dengan validasi input.
 * Mendukung upload foto profil via Multer (req.file).
 *
 * @route   POST /api/employees
 * @access  Private (adminOnly)
 * @body    Data karyawan sesuai skema tabel employees
 */
export const createEmployee = async (req, res) => {
  try {
    // 1. Sanitasi XSS — strip HTML dari semua string input
    const body = sanitizeObject(req.body)

    const {
      full_name, gender, birth_date, email, phone_number,
      address, city, province, postal_code, division, position,
      salary, join_date, employment_status, emergency_contact,
      emergency_phone, education, marital_status,
    } = body

    // 2. Validasi field wajib
    const requiredFields = {
      full_name, gender, birth_date, email, phone_number,
      address, city, province, postal_code, division, position,
      salary, join_date, emergency_contact, emergency_phone, education,
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      if (req.file) deleteFile(req.file.filename)
      return res.status(400).json({
        success: false,
        message: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
      })
    }

    // 3. Validasi enum
    validateEnum(gender, ['Male', 'Female'], 'gender')
    validateEnum(employment_status, ['Active', 'Inactive', 'Resigned'], 'employment_status')
    validateEnum(marital_status, ['Single', 'Married'], 'marital_status')

    // 4. Validasi email format
    validateEmail(email)

    // 5. Guard nilai negatif pada salary
    validateNonNegative(salary, 'salary')

    // 6. Validasi panjang string
    validateLength(full_name, 100, 'full_name')
    validateLength(division, 100, 'division')
    validateLength(position, 100, 'position')
    validateLength(city, 100, 'city')
    validateLength(province, 100, 'province')
    validateLength(postal_code, 10, 'postal_code')
    validateLength(phone_number, 20, 'phone_number')
    validateLength(education, 100, 'education')

    // Cek duplikasi email
    const [existingEmail] = await pool.execute(
      'SELECT id FROM employees WHERE email = ? LIMIT 1',
      [email],
    )
    if (existingEmail[0]) {
      if (req.file) deleteFile(req.file.filename)
      return res.status(409).json({
        success: false,
        message: 'Email sudah digunakan oleh karyawan lain',
      })
    }

    // Generate kode karyawan otomatis
    const employee_code = await generateEmployeeCode()

    // Nama file foto profil (dari Multer)
    const profile_photo = req.file ? req.file.filename : null

    const [result] = await pool.execute(
      `INSERT INTO employees (
         employee_code, full_name, gender, birth_date, email, phone_number,
         address, city, province, postal_code, division, position, salary,
         join_date, employment_status, profile_photo, emergency_contact,
         emergency_phone, education, marital_status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_code, full_name, gender, birth_date, email, phone_number,
        address, city, province, postal_code, division, position,
        parseFloat(salary), join_date,
        employment_status || 'Active',
        profile_photo,
        emergency_contact, emergency_phone, education,
        marital_status || 'Single',
      ],
    )

    await logActivity({
      userId: req.user?.id,
      action: LOG_ACTIONS.CREATE_EMPLOYEE,
      target: `employee:${result.insertId}`,
      details: { employee_code, full_name, division, position },
      ipAddress: getClientIP(req),
    })

    return res.status(201).json({
      success: true,
      message: 'Karyawan berhasil ditambahkan',
      data: {
        id: result.insertId,
        employee_code,
        full_name,
        profile_photo_url: buildFileUrl(profile_photo, 'photos'),
      },
    })
  } catch (error) {
    if (req.file) deleteFile(req.file.filename)
    console.error('❌ createEmployee error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data karyawan',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: PUT update data karyawan
// ---------------------------------------------------------------------------

/**
 * @description Memperbarui data karyawan berdasarkan ID.
 * Jika ada foto baru diupload, foto lama akan dihapus dari server.
 *
 * @route   PUT /api/employees/:id
 * @access  Private (adminOnly)
 * @param   id - ID karyawan yang akan diupdate
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params

    // 1. Sanitasi XSS
    const body = sanitizeObject(req.body)
    const {
      full_name, gender, birth_date, email, phone_number,
      address, city, province, postal_code, division, position,
      salary, join_date, employment_status, emergency_contact,
      emergency_phone, education, marital_status,
    } = body

    // 2. Validasi enum, email, salary, length
    validateEnum(gender, ['Male', 'Female'], 'gender')
    validateEnum(employment_status, ['Active', 'Inactive', 'Resigned'], 'employment_status')
    validateEnum(marital_status, ['Single', 'Married'], 'marital_status')
    validateEmail(email)
    validateNonNegative(salary, 'salary')
    validateLength(full_name, 100, 'full_name')
    validateLength(division, 100, 'division')
    validateLength(position, 100, 'position')
    validateLength(phone_number, 20, 'phone_number')
    validateLength(postal_code, 10, 'postal_code')
    validateLength(education, 100, 'education')

    // Cek apakah karyawan ada
    const [existing] = await pool.execute(
      'SELECT id, profile_photo FROM employees WHERE id = ? LIMIT 1',
      [id],
    )

    if (!existing[0]) {
      if (req.file) deleteFile(req.file.filename)
      return res.status(404).json({
        success: false,
        message: `Karyawan dengan ID ${id} tidak ditemukan`,
      })
    }

    // Cek duplikasi email (kecuali milik karyawan ini sendiri)
    if (email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM employees WHERE email = ? AND id != ? LIMIT 1',
        [email, id],
      )
      if (emailCheck[0]) {
        if (req.file) deleteFile(req.file.filename)
        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan oleh karyawan lain',
        })
      }
    }

    // Tentukan foto profil: gunakan file baru jika ada, atau pertahankan yang lama
    let profile_photo = existing[0].profile_photo
    if (req.file) {
      // Hapus foto lama dari server
      deleteFile(existing[0].profile_photo)
      profile_photo = req.file.filename
    }

    await pool.execute(
      `UPDATE employees SET
         full_name = ?, gender = ?, birth_date = ?, email = ?,
         phone_number = ?, address = ?, city = ?, province = ?,
         postal_code = ?, division = ?, position = ?, salary = ?,
         join_date = ?, employment_status = ?, profile_photo = ?,
         emergency_contact = ?, emergency_phone = ?,
         education = ?, marital_status = ?
       WHERE id = ?`,
      [
        full_name, gender, birth_date, email,
        phone_number, address, city, province,
        postal_code, division, position, parseFloat(salary || 0),
        join_date, employment_status || 'Active', profile_photo,
        emergency_contact, emergency_phone,
        education, marital_status || 'Single',
        id,
      ],
    )

    await logActivity({
      userId: req.user?.id,
      action: LOG_ACTIONS.UPDATE_EMPLOYEE,
      target: `employee:${id}`,
      details: { full_name, division, position },
      ipAddress: getClientIP(req),
    })

    return res.status(200).json({
      success: true,
      message: 'Data karyawan berhasil diperbarui',
      data: {
        id: parseInt(id),
        profile_photo_url: buildFileUrl(profile_photo, 'photos'),
      },
    })
  } catch (error) {
    if (req.file) deleteFile(req.file.filename)
    console.error('❌ updateEmployee error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data karyawan',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: DELETE karyawan
// ---------------------------------------------------------------------------

/**
 * @description Menghapus data karyawan beserta foto profil dari server.
 * Akun user terkait akan otomatis di-set employee_id = NULL (via FK ON DELETE SET NULL).
 *
 * @route   DELETE /api/employees/:id
 * @access  Private (adminOnly)
 * @param   id - ID karyawan yang akan dihapus
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params

    // Ambil data foto sebelum dihapus
    const [rows] = await pool.execute(
      'SELECT id, full_name, profile_photo FROM employees WHERE id = ? LIMIT 1',
      [id],
    )

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: `Karyawan dengan ID ${id} tidak ditemukan`,
      })
    }

    const employee = rows[0]

    // Hapus record dari database
    await pool.execute('DELETE FROM employees WHERE id = ?', [id])

    // Hapus file foto profil dari server (jika ada)
    if (employee.profile_photo) {
      deleteFile(employee.profile_photo)
    }

    await logActivity({
      userId: req.user?.id,
      action: LOG_ACTIONS.DELETE_EMPLOYEE,
      target: `employee:${id}`,
      details: { full_name: employee.full_name },
      ipAddress: getClientIP(req),
    })

    return res.status(200).json({
      success: true,
      message: `Karyawan "${employee.full_name}" berhasil dihapus`,
    })
  } catch (error) {
    console.error('❌ deleteEmployee error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus data karyawan',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: GET daftar divisi unik (untuk filter dropdown)
// ---------------------------------------------------------------------------

/**
 * @description Mengambil daftar divisi yang ada di database untuk keperluan filter.
 *
 * @route   GET /api/employees/divisions
 * @access  Private (authMiddleware)
 */
export const getDivisions = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT division FROM employees ORDER BY division ASC',
    )
    return res.status(200).json({
      success: true,
      data: rows.map((r) => r.division),
    })
  } catch (error) {
    console.error('❌ getDivisions error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data divisi',
    })
  }
}

// ---------------------------------------------------------------------------
// Controller: Export data karyawan
// ---------------------------------------------------------------------------

/**
 * @description Mengekspor seluruh data karyawan ke Excel atau PDF.
 * Mendukung filter yang sama dengan getAllEmployees.
 *
 * @route   GET /api/employees/export?format=excel|pdf
 * @access  Private (adminOnly)
 */
export const exportEmployees = async (req, res) => {
  try {
    const { format = 'excel', search, division, employment_status } = req.query

    const conditions = []
    const queryParams = []

    if (search) {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR employee_code LIKE ?)')
      const likeValue = `%${search}%`
      queryParams.push(likeValue, likeValue, likeValue)
    }
    if (division) {
      conditions.push('division = ?')
      queryParams.push(division)
    }
    if (employment_status) {
      conditions.push('employment_status = ?')
      queryParams.push(employment_status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const [employees] = await pool.execute(
      `SELECT * FROM employees ${whereClause} ORDER BY full_name ASC`,
      queryParams,
    )

    if (format === 'pdf') {
      return exportToPDF(employees, res)
    }

    return await exportToExcel(employees, res)
  } catch (error) {
    console.error('❌ exportEmployees error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal mengekspor data karyawan',
    })
  }
}
