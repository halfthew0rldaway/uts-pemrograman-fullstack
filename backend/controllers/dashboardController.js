import pool from '../config/db.js'

/**
 * @description Mengambil semua data statistik untuk halaman dashboard.
 * Menjalankan beberapa query secara paralel untuk efisiensi.
 *
 * @route   GET /api/dashboard/stats
 * @access  Private (authMiddleware)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      [totalEmployees],
      [totalDivisions],
      [totalUsers],
      [activeEmployees],
      [genderStats],
      [statusStats],
      [divisionStats],
      [recentEmployees],
      [recruitmentByMonth],
      [avgSalaryByDivision],
    ] = await Promise.all([
      // Total seluruh karyawan
      pool.execute('SELECT COUNT(*) AS total FROM employees'),

      // Total divisi unik
      pool.execute('SELECT COUNT(DISTINCT division) AS total FROM employees'),

      // Total akun user aktif
      pool.execute('SELECT COUNT(*) AS total FROM users WHERE status = "Active"'),

      // Total karyawan dengan status Active
      pool.execute('SELECT COUNT(*) AS total FROM employees WHERE employment_status = "Active"'),

      // Distribusi gender
      pool.execute(
        `SELECT gender, COUNT(*) AS total
         FROM employees
         GROUP BY gender`,
      ),

      // Distribusi status kerja
      pool.execute(
        `SELECT employment_status AS status, COUNT(*) AS total
         FROM employees
         GROUP BY employment_status`,
      ),

      // Top 5 divisi berdasarkan jumlah karyawan
      pool.execute(
        `SELECT division, COUNT(*) AS total
         FROM employees
         GROUP BY division
         ORDER BY total DESC
         LIMIT 5`,
      ),

      // 5 karyawan terbaru
      pool.execute(
        `SELECT id, employee_code, full_name, division, position,
                employment_status, profile_photo, join_date
         FROM employees
         ORDER BY created_at DESC
         LIMIT 5`,
      ),

      // Rekrutmen per bulan (semua data historis berdasarkan join_date)
      pool.execute(
        `SELECT
           DATE_FORMAT(join_date, '%b %Y') AS month,
           DATE_FORMAT(join_date, '%Y-%m') AS month_key,
           COUNT(*) AS total
         FROM employees
         GROUP BY month_key, month
         ORDER BY month_key ASC`,
      ),

      // Rata-rata gaji per divisi (top 6)
      pool.execute(
        `SELECT
           division,
           ROUND(AVG(salary), 0) AS avg_salary,
           MIN(salary) AS min_salary,
           MAX(salary) AS max_salary
         FROM employees
         WHERE salary > 0
         GROUP BY division
         ORDER BY avg_salary DESC
         LIMIT 6`,
      ),
    ])

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees: totalEmployees[0].total,
          totalDivisions: totalDivisions[0].total,
          totalUsers: totalUsers[0].total,
          activeEmployees: activeEmployees[0].total,
        },
        genderStats: genderStats,
        statusStats: statusStats,
        divisionStats: divisionStats,
        recentEmployees: recentEmployees,
        recruitmentByMonth: recruitmentByMonth,
        avgSalaryByDivision: avgSalaryByDivision,
      },
    })
  } catch (error) {
    console.error('❌ getDashboardStats error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dashboard',
    })
  }
}
