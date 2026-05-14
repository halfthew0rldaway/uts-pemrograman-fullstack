-- ============================================================
-- Activity Logs Table
-- Jalankan: mysql -u root pt_digital_nusantara < database/activity_logs.sql
-- ============================================================

USE pt_digital_nusantara;

CREATE TABLE IF NOT EXISTS activity_logs (
  id          INT           NOT NULL AUTO_INCREMENT,
  user_id     INT           NULL DEFAULT NULL COMMENT 'ID user yang melakukan aksi',
  action      VARCHAR(50)   NOT NULL COMMENT 'Jenis aksi: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ROLE_CHANGE, STATUS_CHANGE',
  target      VARCHAR(100)  NULL DEFAULT NULL COMMENT 'Target aksi, contoh: employee:5, user:2',
  details     TEXT          NULL DEFAULT NULL COMMENT 'Detail tambahan dalam format JSON string',
  ip_address  VARCHAR(45)   NULL DEFAULT NULL COMMENT 'IP address client',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_user_id   (user_id),
  INDEX idx_action    (action),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Riwayat aktivitas pengguna sistem';
