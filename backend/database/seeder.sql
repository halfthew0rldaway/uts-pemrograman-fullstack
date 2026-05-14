-- ============================================================
-- PT Digital Nusantara - Data Seeder
-- Jalankan: mysql -u root pt_digital_nusantara < database/seeder.sql
-- ============================================================

USE pt_digital_nusantara;

-- ------------------------------------------------------------
-- Seed: Employees (15 karyawan dummy)
-- ------------------------------------------------------------
INSERT INTO employees (
  employee_code, full_name, gender, birth_date, email, phone_number,
  address, city, province, postal_code, division, position,
  salary, join_date, employment_status, emergency_contact,
  emergency_phone, education, marital_status
) VALUES
('EMP-001', 'Budi Santoso',       'Male',   '1990-03-15', 'budi.santoso@ptdn.com',       '081234567001', 'Jl. Merdeka No. 1',      'Jakarta',    'DKI Jakarta',      '10110', 'Teknologi Informasi', 'Software Engineer',       8500000.00,  '2020-01-15', 'Active',   'Siti Santoso',    '081234560001', 'S1 Teknik Informatika',  'Married'),
('EMP-002', 'Dewi Rahayu',        'Female', '1993-07-22', 'dewi.rahayu@ptdn.com',        '081234567002', 'Jl. Sudirman No. 5',     'Jakarta',    'DKI Jakarta',      '10220', 'Keuangan',            'Akuntan',                 7200000.00,  '2020-03-01', 'Active',   'Ahmad Rahayu',    '081234560002', 'S1 Akuntansi',           'Single'),
('EMP-003', 'Rizky Pratama',      'Male',   '1988-11-10', 'rizky.pratama@ptdn.com',      '081234567003', 'Jl. Gatot Subroto No. 8','Bandung',    'Jawa Barat',       '40111', 'Teknologi Informasi', 'Backend Developer',       9000000.00,  '2019-06-01', 'Active',   'Rina Pratama',    '081234560003', 'S1 Sistem Informasi',    'Married'),
('EMP-004', 'Sari Indah',         'Female', '1995-02-28', 'sari.indah@ptdn.com',         '081234567004', 'Jl. Diponegoro No. 12',  'Surabaya',   'Jawa Timur',       '60111', 'Sumber Daya Manusia', 'HR Specialist',           6500000.00,  '2021-01-10', 'Active',   'Joko Indah',      '081234560004', 'S1 Psikologi',           'Single'),
('EMP-005', 'Ahmad Fauzi',        'Male',   '1987-09-05', 'ahmad.fauzi@ptdn.com',        '081234567005', 'Jl. Ahmad Yani No. 20',  'Yogyakarta', 'DI Yogyakarta',    '55111', 'Pemasaran',           'Marketing Manager',       11000000.00, '2018-04-15', 'Active',   'Fatimah Fauzi',   '081234560005', 'S2 Manajemen Pemasaran', 'Married'),
('EMP-006', 'Linda Kusuma',       'Female', '1992-05-18', 'linda.kusuma@ptdn.com',       '081234567006', 'Jl. Pemuda No. 3',       'Semarang',   'Jawa Tengah',      '50111', 'Keuangan',            'Finance Analyst',         7800000.00,  '2020-08-01', 'Active',   'Hendra Kusuma',   '081234560006', 'S1 Manajemen Keuangan',  'Married'),
('EMP-007', 'Doni Setiawan',      'Male',   '1991-12-30', 'doni.setiawan@ptdn.com',      '081234567007', 'Jl. Pahlawan No. 7',     'Medan',      'Sumatera Utara',   '20111', 'Teknologi Informasi', 'Frontend Developer',      8200000.00,  '2021-03-15', 'Active',   'Yuni Setiawan',   '081234560007', 'S1 Teknik Komputer',     'Single'),
('EMP-008', 'Putri Wulandari',    'Female', '1994-08-14', 'putri.wulandari@ptdn.com',    '081234567008', 'Jl. Veteran No. 9',      'Makassar',   'Sulawesi Selatan', '90111', 'Pemasaran',           'Digital Marketing',       7000000.00,  '2021-06-01', 'Active',   'Agus Wulandari',  '081234560008', 'S1 Komunikasi',          'Single'),
('EMP-009', 'Hendra Wijaya',      'Male',   '1986-04-25', 'hendra.wijaya@ptdn.com',      '081234567009', 'Jl. Imam Bonjol No. 15', 'Palembang',  'Sumatera Selatan', '30111', 'Operasional',         'Operations Manager',      12000000.00, '2017-09-01', 'Active',   'Sri Wijaya',      '081234560009', 'S2 Manajemen Operasi',   'Married'),
('EMP-010', 'Mega Lestari',       'Female', '1996-01-08', 'mega.lestari@ptdn.com',       '081234567010', 'Jl. Kartini No. 4',      'Denpasar',   'Bali',             '80111', 'Sumber Daya Manusia', 'Recruiter',               6000000.00,  '2022-01-03', 'Active',   'Wayan Lestari',   '081234560010', 'S1 Manajemen SDM',       'Single'),
('EMP-011', 'Fajar Nugroho',      'Male',   '1989-06-17', 'fajar.nugroho@ptdn.com',      '081234567011', 'Jl. Hasanuddin No. 6',   'Balikpapan', 'Kalimantan Timur', '76111', 'Teknologi Informasi', 'DevOps Engineer',         10500000.00, '2019-11-01', 'Active',   'Nia Nugroho',     '081234560011', 'S1 Teknik Informatika',  'Married'),
('EMP-012', 'Rini Anggraini',     'Female', '1993-10-03', 'rini.anggraini@ptdn.com',     '081234567012', 'Jl. Sudirman No. 22',    'Pekanbaru',  'Riau',             '28111', 'Keuangan',            'Tax Consultant',          8000000.00,  '2020-05-15', 'Active',   'Budi Anggraini',  '081234560012', 'S1 Perpajakan',          'Single'),
('EMP-013', 'Wahyu Hidayat',      'Male',   '1990-07-29', 'wahyu.hidayat@ptdn.com',      '081234567013', 'Jl. Diponegoro No. 33',  'Malang',     'Jawa Timur',       '65111', 'Operasional',         'Logistics Coordinator',   6800000.00,  '2021-09-01', 'Inactive', 'Sari Hidayat',    '081234560013', 'D3 Manajemen Logistik',  'Married'),
('EMP-014', 'Nadia Permata',      'Female', '1997-03-11', 'nadia.permata@ptdn.com',      '081234567014', 'Jl. Merdeka No. 18',     'Bogor',      'Jawa Barat',       '16111', 'Pemasaran',           'Content Creator',         5500000.00,  '2022-07-01', 'Active',   'Eko Permata',     '081234560014', 'S1 Desain Komunikasi',   'Single'),
('EMP-015', 'Eko Prasetyo',       'Male',   '1985-12-20', 'eko.prasetyo@ptdn.com',       '081234567015', 'Jl. Ahmad Yani No. 45',  'Jakarta',    'DKI Jakarta',      '10310', 'Operasional',         'General Manager',         18000000.00, '2015-03-01', 'Resigned', 'Dewi Prasetyo',   '081234560015', 'S2 Manajemen Bisnis',    'Married')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ------------------------------------------------------------
-- Seed: Users (terhubung ke beberapa karyawan)
-- Password semua: Karyawan@123
-- Hash: $2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (bcrypt rounds=12)
-- ------------------------------------------------------------
INSERT INTO users (employee_id, username, email, password, role, status)
SELECT
  e.id,
  LOWER(REPLACE(SUBSTRING_INDEX(e.full_name, ' ', 1), ' ', '')) AS username,
  e.email,
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Employee',
  'Active'
FROM employees e
WHERE e.employee_code IN ('EMP-001','EMP-002','EMP-003','EMP-004','EMP-005')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Verifikasi data
SELECT 'Employees:' AS info, COUNT(*) AS total FROM employees
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Active employees:', COUNT(*) FROM employees WHERE employment_status = 'Active'
UNION ALL
SELECT 'Divisions:', COUNT(DISTINCT division) FROM employees;
