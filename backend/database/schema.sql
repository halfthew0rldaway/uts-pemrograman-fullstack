-- ============================================================
-- PT Digital Nusantara - Sistem Manajemen Karyawan
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS pt_digital_nusantara
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pt_digital_nusantara;

-- ------------------------------------------------------------
-- Table: employees
-- Menyimpan data lengkap setiap karyawan (23 kolom)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id                INT             NOT NULL AUTO_INCREMENT,
  employee_code     VARCHAR(20)     NOT NULL UNIQUE COMMENT 'Kode unik karyawan, contoh: EMP-001',
  full_name         VARCHAR(100)    NOT NULL COMMENT 'Nama lengkap karyawan',
  gender            ENUM('Male','Female') NOT NULL COMMENT 'Jenis kelamin',
  birth_date        DATE            NOT NULL COMMENT 'Tanggal lahir',
  email             VARCHAR(100)    NOT NULL UNIQUE COMMENT 'Email pribadi/kantor',
  phone_number      VARCHAR(20)     NOT NULL COMMENT 'Nomor telepon aktif',
  address           TEXT            NOT NULL COMMENT 'Alamat lengkap tempat tinggal',
  city              VARCHAR(100)    NOT NULL COMMENT 'Kota tempat tinggal',
  province          VARCHAR(100)    NOT NULL COMMENT 'Provinsi tempat tinggal',
  postal_code       VARCHAR(10)     NOT NULL COMMENT 'Kode pos alamat',
  division          VARCHAR(100)    NOT NULL COMMENT 'Divisi tempat bekerja',
  position          VARCHAR(100)    NOT NULL COMMENT 'Jabatan karyawan',
  salary            DECIMAL(12,2)   NOT NULL DEFAULT 0.00 COMMENT 'Gaji karyawan dalam Rupiah',
  join_date         DATE            NOT NULL COMMENT 'Tanggal mulai bekerja',
  employment_status ENUM('Active','Inactive','Resigned') NOT NULL DEFAULT 'Active' COMMENT 'Status kerja karyawan',
  profile_photo     VARCHAR(255)    NULL DEFAULT NULL COMMENT 'Path/nama file foto profil',
  emergency_contact VARCHAR(100)    NOT NULL COMMENT 'Nama kontak darurat',
  emergency_phone   VARCHAR(20)     NOT NULL COMMENT 'Nomor telepon kontak darurat',
  education         VARCHAR(100)    NOT NULL COMMENT 'Pendidikan terakhir',
  marital_status    ENUM('Single','Married') NOT NULL DEFAULT 'Single' COMMENT 'Status pernikahan',
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_employee_code (employee_code),
  INDEX idx_full_name     (full_name),
  INDEX idx_email         (email),
  INDEX idx_division      (division),
  INDEX idx_employment_status (employment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Data lengkap karyawan PT Digital Nusantara';

-- ------------------------------------------------------------
-- Table: users
-- Akun login yang terhubung ke data karyawan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INT             NOT NULL AUTO_INCREMENT,
  employee_id     INT             NULL DEFAULT NULL COMMENT 'FK ke tabel employees (NULL jika super admin)',
  username        VARCHAR(100)    NOT NULL UNIQUE COMMENT 'Username untuk login',
  email           VARCHAR(100)    NOT NULL UNIQUE COMMENT 'Email akun login',
  password        VARCHAR(255)    NOT NULL COMMENT 'Password yang sudah di-hash dengan bcrypt',
  role            ENUM('Admin','Employee') NOT NULL DEFAULT 'Employee' COMMENT 'Hak akses user',
  status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Status akun login',
  remember_token  VARCHAR(255)    NULL DEFAULT NULL COMMENT 'Token untuk fitur remember me / session',
  last_login      DATETIME        NULL DEFAULT NULL COMMENT 'Waktu terakhir login berhasil',
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_users_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX idx_username (username),
  INDEX idx_email    (email),
  INDEX idx_role     (role),
  INDEX idx_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Akun login sistem manajemen karyawan';

-- ------------------------------------------------------------
-- Seed: Default Admin Account
-- Password: Admin@123 (hashed dengan bcrypt rounds=12)
-- GANTI hash ini setelah deployment pertama!
-- ------------------------------------------------------------
INSERT INTO users (employee_id, username, email, password, role, status)
VALUES (
  NULL,
  'admin',
  'admin@ptdigitalnusantara.com',
  '$2b$12$yofaiiudZMMHrxPnrkOSEODzdbEXo4uXeWx3N6TZJe34pXJVjNlxa',
  'Admin',
  'Active'
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
