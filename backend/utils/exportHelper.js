import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

/**
 * @description Mengekspor data karyawan ke format Excel (.xlsx).
 * Mengirim file langsung sebagai response stream.
 * @param {Array} employees - Array data karyawan dari database
 * @param {object} res - Express response object
 */
export const exportToExcel = async (employees, res) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'PT Digital Nusantara'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Data Karyawan')

  // Definisi kolom header
  sheet.columns = [
    { header: 'No',               key: 'no',                width: 5  },
    { header: 'Kode Karyawan',    key: 'employee_code',     width: 15 },
    { header: 'Nama Lengkap',     key: 'full_name',         width: 25 },
    { header: 'Jenis Kelamin',    key: 'gender',            width: 15 },
    { header: 'Tanggal Lahir',    key: 'birth_date',        width: 15 },
    { header: 'Email',            key: 'email',             width: 30 },
    { header: 'No. Telepon',      key: 'phone_number',      width: 18 },
    { header: 'Kota',             key: 'city',              width: 18 },
    { header: 'Provinsi',         key: 'province',          width: 18 },
    { header: 'Divisi',           key: 'division',          width: 20 },
    { header: 'Jabatan',          key: 'position',          width: 20 },
    { header: 'Gaji',             key: 'salary',            width: 18 },
    { header: 'Tanggal Bergabung',key: 'join_date',         width: 18 },
    { header: 'Status',           key: 'employment_status', width: 15 },
    { header: 'Pendidikan',       key: 'education',         width: 20 },
    { header: 'Status Nikah',     key: 'marital_status',    width: 15 },
  ]

  // Style header row
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // Isi data
  employees.forEach((emp, index) => {
    sheet.addRow({
      no: index + 1,
      ...emp,
      birth_date: emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('id-ID') : '',
      join_date:  emp.join_date  ? new Date(emp.join_date).toLocaleDateString('id-ID')  : '',
      salary: parseFloat(emp.salary || 0),
    })
  })

  // Format kolom gaji sebagai currency
  sheet.getColumn('salary').numFmt = '"Rp"#,##0.00'

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="karyawan_${Date.now()}.xlsx"`)

  await workbook.xlsx.write(res)
  res.end()
}

/**
 * @description Mengekspor data karyawan ke format PDF.
 * Mengirim file langsung sebagai response stream.
 * @param {Array} employees - Array data karyawan dari database
 * @param {object} res - Express response object
 */
export const exportToPDF = (employees, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="karyawan_${Date.now()}.pdf"`)
  doc.pipe(res)

  // Header dokumen
  doc.fontSize(16).font('Helvetica-Bold').text('PT Digital Nusantara', { align: 'center' })
  doc.fontSize(12).font('Helvetica').text('Laporan Data Karyawan', { align: 'center' })
  doc.moveDown()
  doc.fontSize(9).text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'right' })
  doc.moveDown()

  // Tabel sederhana
  const headers = ['No', 'Kode', 'Nama', 'Divisi', 'Jabatan', 'Status', 'Bergabung']
  const colWidths = [25, 70, 150, 100, 120, 70, 80]
  let x = 40
  const headerY = doc.y

  // Header tabel
  doc.font('Helvetica-Bold').fontSize(8)
  headers.forEach((h, i) => {
    doc.rect(x, headerY, colWidths[i], 18).fillAndStroke('#1E3A5F', '#1E3A5F')
    doc.fillColor('white').text(h, x + 3, headerY + 5, { width: colWidths[i] - 6 })
    x += colWidths[i]
  })

  // Baris data
  doc.font('Helvetica').fontSize(7).fillColor('black')
  employees.forEach((emp, idx) => {
    if (doc.y > 520) { doc.addPage(); }
    const rowY = doc.y + 2
    x = 40
    const rowData = [
      idx + 1,
      emp.employee_code,
      emp.full_name,
      emp.division,
      emp.position,
      emp.employment_status,
      emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID') : '',
    ]
    const bg = idx % 2 === 0 ? '#F5F7FA' : '#FFFFFF'
    rowData.forEach((val, i) => {
      doc.rect(x, rowY, colWidths[i], 16).fillAndStroke(bg, '#CCCCCC')
      doc.fillColor('black').text(String(val ?? ''), x + 3, rowY + 4, { width: colWidths[i] - 6 })
      x += colWidths[i]
    })
    doc.moveDown(0.1)
  })

  doc.end()
}
