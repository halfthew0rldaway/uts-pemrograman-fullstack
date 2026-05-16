# 🎬 SCRIPT VIDEO DEMO — UTS Pemrograman Fullstack
**PT Digital Nusantara — Sistem Manajemen Karyawan**
**Stack: Node.js + Express.js + MySQL + Vue.js (Vuestic Admin)**

---

## 📋 CHECKLIST RUBRIK PENILAIAN

| No | Aspek | Bobot |
|----|-------|-------|
| 1 | Authentication & JWT | 20 |
| 2 | CRUD Data Karyawan | 25 |
| 3 | Search & Pagination | 20 |
| 4 | Dashboard & Relasi Data | 10 |
| 5 | CRUD Management Data | 10 |
| 6 | Struktur Coding & Kerapian | 15 |

---

## ⏱️ ESTIMASI DURASI: 10–15 menit

---

## 🎙️ INTRO (±30 detik)

> *Tampilkan halaman login di browser*

"Halo, perkenalkan saya [Nama], NIM [NIM]. Pada video ini saya akan mendemonstrasikan aplikasi fullstack **Sistem Manajemen Karyawan PT Digital Nusantara** yang dibangun menggunakan Node.js, Express.js, MySQL di backend, dan Vue.js dengan Vuestic Admin di frontend."

---

## BAGIAN 1 — AUTHENTICATION & JWT (±3 menit)

### 1.1 — Tampilkan Halaman Login

> *Buka browser, arahkan ke `http://localhost:5173/auth/login`*

"Pertama, kita lihat halaman login. Aplikasi ini menggunakan sistem autentikasi berlapis — JWT, Session, dan Google reCAPTCHA v2."

> *Tunjukkan form login dengan field email, password, dan widget CAPTCHA*

"Perhatikan ada widget CAPTCHA di sini. Login tidak bisa dilakukan tanpa menyelesaikan verifikasi CAPTCHA terlebih dahulu."

---

### 1.2 — Coba Login dengan Kredensial Salah

> *Isi email: `salah@email.com`, password: `wrongpass`, selesaikan CAPTCHA, klik Login*

"Jika email atau password salah, sistem menampilkan pesan error. Tidak ada informasi spesifik mana yang salah — ini adalah praktik keamanan yang benar."

---

### 1.3 — Login Berhasil sebagai Admin

> *Isi email admin yang benar, isi password, selesaikan CAPTCHA, klik Login*

"Sekarang login dengan akun Admin yang valid."

> *Setelah berhasil, buka DevTools → Application → Cookies atau Local Storage*

"Setelah login berhasil, sistem menyimpan **access token JWT** di localStorage dan **refresh token** disimpan sebagai HttpOnly cookie — tidak bisa diakses JavaScript, ini untuk keamanan."

> *Buka DevTools → Network → pilih request login → lihat Response Headers*

"Di sini terlihat cookie `refreshToken` dengan flag `HttpOnly` dan `SameSite=Strict`."

---

### 1.4 — Tunjukkan Protected Route

> *Buka tab baru, coba akses `http://localhost:5173/employees` tanpa login*

"Jika mencoba mengakses halaman yang dilindungi tanpa token, sistem otomatis redirect ke halaman login."

---

### 1.5 — Tunjukkan JWT di Backend (opsional, buka kode)

> *Buka file `backend/middlewares/authMiddleware.js`*

"Di backend, setiap request ke endpoint protected melewati `authMiddleware`. Middleware ini mendukung **hybrid auth** — bisa menerima JWT dari header Authorization maupun Session dari browser. Ada juga `adminOnly` middleware yang membatasi akses hanya untuk role Admin."

---

### 1.6 — Forgot Password

> *Klik link "Lupa Password" di halaman login*

"Fitur Forgot Password juga tersedia. User memasukkan email, sistem akan mengirimkan token reset."

---

### 1.7 — Logout

> *Klik tombol Logout / avatar user di pojok kanan atas → pilih Logout*

"Saat logout, sistem menghapus session di server, menghapus refresh token dari database, dan menghapus cookie. Setelah logout, token lama tidak bisa digunakan lagi."

> *Coba akses halaman employees setelah logout — akan redirect ke login*

---

## BAGIAN 2 — CRUD DATA KARYAWAN (±4 menit)

> *Login kembali sebagai Admin*

### 2.1 — Buka Halaman Employees

> *Klik menu "Employees" di sidebar kiri*

"Ini adalah halaman manajemen data karyawan. Terlihat tabel dengan data karyawan beserta informasi divisi, posisi, status kerja, dan foto profil."

---

### 2.2 — Tambah Karyawan Baru (CREATE)

> *Klik tombol "Add Employee" atau tombol tambah di halaman Employees*

"Kita tambahkan karyawan baru. Saya isi semua field yang wajib diisi."

> *Isi form:*
> - Full Name: `Demo Karyawan Baru`
> - Gender: `Male`
> - Birth Date: `1995-06-15`
> - Email: `demo.karyawan@example.com`
> - Phone: `081234567890`
> - Address: `Jl. Demo No. 1`
> - City: `Jakarta`
> - Province: `DKI Jakarta`
> - Postal Code: `12345`
> - Division: `Teknologi Informasi`
> - Position: `Software Engineer`
> - Salary: `8000000`
> - Join Date: `2024-01-01`
> - Upload foto profil (opsional)

"Perhatikan field salary — sistem memvalidasi nilai tidak boleh negatif. Email juga divalidasi formatnya, dan dicek duplikasi."

> *Klik Save/Submit*

"Karyawan berhasil ditambahkan. Sistem otomatis men-generate **employee code** dengan format `EMP-XXX` secara berurutan."

---

### 2.3 — Lihat Detail Karyawan (READ)

> *Klik nama atau tombol detail pada salah satu karyawan di tabel*

"Halaman detail menampilkan semua informasi lengkap karyawan, termasuk data darurat, pendidikan, status pernikahan, dan informasi akun user yang terhubung."

---

### 2.4 — Edit Data Karyawan (UPDATE)

> *Klik tombol Edit pada karyawan yang baru ditambahkan*

"Kita edit data karyawan tadi. Ubah posisi dari `Software Engineer` menjadi `Senior Software Engineer`."

> *Ubah field Position, klik Save*

"Data berhasil diperbarui. Jika ada foto baru diupload, foto lama otomatis dihapus dari server."

---

### 2.5 — Hapus Karyawan (DELETE)

> *Klik tombol Delete pada karyawan demo yang baru dibuat*

"Saat menghapus karyawan, sistem juga otomatis menghapus file foto profil dari server. Akun user yang terhubung akan di-set `employee_id = NULL` secara otomatis via foreign key constraint."

> *Konfirmasi dialog hapus → karyawan terhapus*

---

### 2.6 — Import Data via Excel/CSV

> *Klik tombol Import di halaman Employees*

"Fitur import memungkinkan upload data massal via file Excel (.xlsx) atau CSV."

> *Upload file CSV/Excel yang sudah disiapkan*

"Sistem melakukan **data cleansing** otomatis: normalisasi format tanggal dari berbagai format (DD/MM/YYYY, Excel serial number, ISO), normalisasi nomor telepon, kapitalisasi nama, dan validasi email. Baris yang error dilaporkan tanpa menghentikan proses import keseluruhan."

> *Tunjukkan hasil import — berapa baris berhasil, berapa dilewati*

---

### 2.7 — Download Template Import

> *Klik tombol "Download Template"*

"Tersedia template Excel yang bisa diunduh sebagai panduan format data yang benar untuk import."

---

### 2.8 — Export Data

> *Klik tombol Export → pilih format Excel atau PDF*

"Data karyawan bisa diekspor ke format Excel maupun PDF, dengan filter yang sama seperti pencarian aktif."

---

## BAGIAN 3 — SEARCH & PAGINATION (±2 menit)

### 3.1 — Search berdasarkan Nama

> *Di halaman Employees, ketik nama di kolom pencarian, contoh: `Budi`*

"Fitur pencarian bekerja secara real-time. Search dilakukan di tiga kolom sekaligus: **nama karyawan**, **email**, dan **employee code**."

---

### 3.2 — Search berdasarkan Email

> *Hapus pencarian sebelumnya, ketik sebagian email: `@gmail`*

"Pencarian berdasarkan email juga berfungsi."

---

### 3.3 — Filter berdasarkan Divisi

> *Gunakan dropdown filter Divisi, pilih salah satu divisi*

"Filter berdasarkan divisi. Daftar divisi diambil dinamis dari database — hanya divisi yang benar-benar ada yang muncul di dropdown."

---

### 3.4 — Filter berdasarkan Status Karyawan

> *Gunakan dropdown filter Status, pilih `Active` atau `Inactive`*

"Filter berdasarkan status kerja: Active, Inactive, atau Resigned."

---

### 3.5 — Kombinasi Filter + Search

> *Aktifkan filter Divisi + ketik nama di search bar bersamaan*

"Filter bisa dikombinasikan. Query dibangun secara dinamis di backend menggunakan parameterized query — aman dari SQL injection."

---

### 3.6 — Pagination

> *Scroll ke bawah tabel, tunjukkan kontrol pagination*

"Pagination server-side. Terlihat informasi total data, halaman saat ini, dan tombol navigasi. Ukuran halaman bisa diubah."

> *Klik halaman 2, halaman 3*

"Setiap pergantian halaman, request baru dikirim ke backend dengan parameter `page` dan `pageSize`."

---

## BAGIAN 4 — DASHBOARD (±1.5 menit)

### 4.1 — Buka Halaman Dashboard

> *Klik menu "Dashboard" di sidebar*

"Dashboard menampilkan ringkasan statistik perusahaan secara real-time."

---

### 4.2 — Tunjukkan Summary Cards

> *Arahkan ke kartu-kartu statistik di bagian atas*

"Ada empat kartu utama:
- **Total Karyawan** — total seluruh karyawan di database
- **Total Divisi** — jumlah divisi unik
- **Total User Aktif** — akun user dengan status Active
- **Karyawan Aktif** — karyawan dengan employment status Active"

---

### 4.3 — Tunjukkan Chart/Grafik

> *Scroll ke bawah, tunjukkan grafik yang ada*

"Dashboard juga menampilkan:
- Distribusi gender karyawan
- Distribusi status kerja (Active/Inactive/Resigned)
- Top 5 divisi berdasarkan jumlah karyawan
- Grafik rekrutmen per bulan
- Rata-rata gaji per divisi (top 6)"

"Semua data ini diambil dalam satu request menggunakan `Promise.all` — query paralel untuk efisiensi."

---

### 4.4 — Tunjukkan Karyawan Terbaru

> *Tunjukkan tabel atau list karyawan terbaru di dashboard*

"Ada juga daftar 5 karyawan yang paling baru bergabung."

---

## BAGIAN 5 — USER MANAGEMENT (±1.5 menit)

### 5.1 — Buka Halaman Users

> *Klik menu "Users" di sidebar*

"Halaman Users hanya bisa diakses oleh Admin. Di sini Admin bisa mengelola akun user sistem."

---

### 5.2 — Tambah User Baru

> *Klik tombol Add User*

"Admin bisa membuat akun user baru dengan role Admin atau Employee, dan menghubungkannya ke data karyawan."

---

### 5.3 — Edit User

> *Klik Edit pada salah satu user*

"Admin bisa mengubah username, email, role, dan status akun user."

---

### 5.4 — Nonaktifkan User (tanpa hapus)

> *Edit user, ubah status dari Active ke Inactive, simpan*

"User yang dinonaktifkan tidak bisa login — sistem mengecek status akun saat proses login."

---

### 5.5 — Hapus User

> *Klik Delete pada user yang ingin dihapus, konfirmasi*

"User bisa dihapus. Data karyawan yang terhubung tidak ikut terhapus."

---

## BAGIAN 6 — ACTIVITY LOGS (±30 detik)

> *Klik menu "Logs" di sidebar*

"Semua aktivitas penting tercatat di log: login sukses, login gagal, logout, tambah/edit/hapus karyawan, dan import data. Log mencatat user ID, action, target, detail, IP address, dan timestamp."

---

## BAGIAN 7 — PROFILE & SETTINGS (±30 detik)

### 7.1 — Halaman Profile

> *Klik menu "Profile" di sidebar*

"User bisa melihat dan mengupdate profil mereka sendiri — username, email, dan password."

---

### 7.2 — Halaman Settings/About

> *Klik menu "About" di sidebar*

"Halaman informasi aplikasi."

---

## BAGIAN 8 — BUKTI KEAMANAN (±1 menit)

### 8.1 — Tunjukkan bcrypt di Kode

> *Buka file `backend/controllers/authController.js`, scroll ke bagian verifikasi password*

"Password di-hash menggunakan **bcrypt** sebelum disimpan ke database. Saat login, password yang diinput dibandingkan dengan hash menggunakan `bcrypt.compare` — password asli tidak pernah disimpan."

---

### 8.2 — Tunjukkan Role-Based Access

> *Login sebagai user dengan role Employee (bukan Admin)*

"User dengan role Employee tidak bisa mengakses menu Users. Jika mencoba akses endpoint admin via API, sistem mengembalikan `403 Forbidden: Akses ditolak: hanya Admin yang diizinkan`."

---

### 8.3 — Tunjukkan Database MySQL

> *Buka MySQL Workbench atau phpMyAdmin, tunjukkan tabel `employees` dan `users`*

"Data tersimpan di MySQL. Terlihat tabel `employees` dan `users` dengan relasi foreign key. Password di kolom `password` tersimpan dalam bentuk hash bcrypt, bukan plaintext."

---

## 🎙️ PENUTUP (±20 detik)

"Demikian demonstrasi aplikasi Sistem Manajemen Karyawan PT Digital Nusantara. Aplikasi ini mengimplementasikan semua requirement UTS: Authentication dengan JWT + Session + CAPTCHA, CRUD data karyawan lengkap, Search & Pagination server-side, Dashboard dengan statistik real-time, User Management, dan keamanan dengan bcrypt serta role-based access control. Terima kasih."

---

## 📁 LAMPIRAN — FILE PENTING UNTUK DITUNJUKKAN

| File | Relevansi |
|------|-----------|
| `backend/middlewares/authMiddleware.js` | JWT + Session hybrid auth, adminOnly |
| `backend/controllers/authController.js` | Login flow, bcrypt, CAPTCHA, JWT generate |
| `backend/controllers/employeeController.js` | CRUD + search + pagination + export |
| `backend/controllers/importController.js` | Import Excel/CSV + data cleansing |
| `backend/controllers/dashboardController.js` | Query paralel Promise.all |
| `backend/routes/employeeRoutes.js` | Protected routes dengan middleware |
| `vuestic-admin/src/components/sidebar/NavigationRoutes.ts` | Navigasi frontend |

---

## ⚠️ PERSIAPAN SEBELUM REKAM

- [ ] Jalankan backend: `cd backend && npm run dev` (port 3000)
- [ ] Jalankan frontend: `cd vuestic-admin && npm run dev` (port 5173)
- [ ] Pastikan MySQL berjalan dan database sudah ter-seed
- [ ] Siapkan file Excel/CSV untuk demo import
- [ ] Siapkan akun Admin dan akun Employee untuk demo role
- [ ] Buka DevTools di browser (untuk tunjukkan JWT/cookie)
- [ ] Resolusi layar: 1920x1080, zoom browser 100%
