<template>
  <div class="about-page">

    <!-- Hero -->
    <div class="hero">
      <div class="hero__identity">
        <div class="hero__icon">
          <VaIcon name="mso-corporate_fare" size="20px" color="primary" />
        </div>
        <div>
          <h1 class="hero__title">
            <span>{{ displayedTitle }}</span><span class="cursor" :class="{ blink: doneTying }">|</span>
          </h1>
          <p class="hero__sub">Human Resource Management System</p>
        </div>
      </div>
      <div class="hero__meta">
        <span class="meta-chip">UTS Pemrograman Fullstack</span>
        <span class="meta-chip">2026</span>
        <span class="meta-chip meta-chip--green">Production Ready</span>
      </div>
    </div>

    <div class="page-divider" />

    <!-- Main grid -->
    <div class="main-grid">

      <!-- Left column -->
      <div class="col-left">

        <!-- About card -->
        <VaCard class="info-card">
          <VaCardContent>
            <div class="card-label">Tentang Proyek</div>
            <p class="card-body">
              Proyek ini dibangun sebagai pemenuhan tugas UTS mata kuliah Pemrograman Fullstack.
              Sistem dirancang untuk mengelola data karyawan secara terpusat — mencakup autentikasi
              berbasis JWT dan session, manajemen CRUD karyawan lengkap, pencarian, pagination,
              ekspor data, serta import massal via Excel dan CSV dengan data cleansing otomatis.
              Seluruh stack dibangun menggunakan Node.js, Express.js, MySQL dengan query manual,
              dan Vue.js sebagai antarmuka yang responsif dengan dukungan dark mode.
            </p>
          </VaCardContent>
        </VaCard>

        <!-- Tech stack card -->
        <VaCard class="info-card">
          <VaCardContent>
            <div class="card-label">Tech Stack</div>
            <div class="chip-grid">
              <div v-for="tech in techStack" :key="tech.name" class="tech-chip">
                <VaIcon :name="tech.icon" size="13px" color="primary" />
                <span>{{ tech.name }}</span>
              </div>
            </div>
          </VaCardContent>
        </VaCard>

      </div>

      <!-- Right column -->
      <div class="col-right">

        <!-- Author card -->
        <VaCard class="info-card">
          <VaCardContent>
            <div class="card-label">Dibuat Oleh</div>
            <div class="author-block">
              <div class="author-avatar">W</div>
              <div class="author-details">
                <div class="author-name">Wisnu Widya Pradana</div>
                <div class="author-nim">411231088</div>
                <div class="author-email">wisnuwidyapradana1@gmail.com</div>
              </div>
            </div>
            <div class="author-actions">
              <a href="https://github.com/halfthew0rldaway" target="_blank" rel="noopener noreferrer" class="action-link">
                <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/wisnu-widya-pradana-2167253aa/" target="_blank" rel="noopener noreferrer" class="action-link">
                <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </VaCardContent>
        </VaCard>

        <!-- Features card -->
        <VaCard class="info-card">
          <VaCardContent>
            <div class="card-label">Fitur Utama</div>
            <ul class="feature-list">
              <li v-for="feat in features" :key="feat" class="feature-item">
                <VaIcon name="mso-check_circle" size="13px" color="success" class="feature-icon" />
                <span>{{ feat }}</span>
              </li>
            </ul>
          </VaCardContent>
        </VaCard>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const fullTitle = 'PT Digital Nusantara'
const displayedTitle = ref('')
const doneTying = ref(false)

onMounted(() => {
  let i = 0
  const iv = setInterval(() => {
    displayedTitle.value = fullTitle.slice(0, ++i)
    if (i >= fullTitle.length) { clearInterval(iv); doneTying.value = true }
  }, 60)
})

const techStack = [
  { name: 'Node.js', icon: 'mso-dns' },
  { name: 'Express.js', icon: 'mso-route' },
  { name: 'MySQL', icon: 'mso-storage' },
  { name: 'Vue.js', icon: 'mso-web' },
  { name: 'JWT & Session', icon: 'mso-lock' },
  { name: 'bcrypt', icon: 'mso-shield' },
  { name: 'Multer', icon: 'mso-upload_file' },
  { name: 'ApexCharts', icon: 'mso-bar_chart' },
  { name: 'Vuestic UI', icon: 'mso-palette' },
]

const features = [
  'Autentikasi JWT dan session dengan CAPTCHA',
  'CRUD karyawan lengkap dengan upload foto profil',
  'Import massal Excel / CSV dengan data cleansing otomatis',
  'Ekspor data ke Excel dan PDF',
  'Pencarian multi-kolom dan pagination server-side',
  'Sorting ascending / descending pada semua kolom',
  'Dashboard analitik dengan grafik interaktif',
  'Manajemen user dengan role Admin dan Employee',
  'Activity log untuk monitoring aktivitas sistem',
  'Forgot password dengan token berbatas waktu',
  'Dark mode dan antarmuka responsif',
]
</script>

<style scoped>
/* ── Page shell ─────────────────────────────────────── */
.about-page {
  padding: 0 0 24px;
}

/* ── Main grid ──────────────────────────────────────── */
.main-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Hero ───────────────────────────────────────────── */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 4px;
}

.hero__identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero__title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
  margin: 0;
}

.cursor {
  display: inline-block;
  margin-left: 1px;
  font-weight: 300;
  opacity: 1;
}
.cursor.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.hero__sub {
  font-size: 0.75rem;
  opacity: 0.45;
  margin: 2px 0 0;
}

.hero__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-chip {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 3px 9px;
  border-radius: 4px;
  background: var(--va-background-element);
  border: 1px solid var(--va-background-border);
  color: inherit;
  opacity: 0.7;
}

.meta-chip--green {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  color: #059669;
  opacity: 1;
}

/* ── Divider ────────────────────────────────────────── */
.page-divider {
  height: 1px;
  background: var(--va-background-border);
  margin: 14px 0 16px;
}

/* ── Grid ───────────────────────────────────────────── */
.main-grid {
  align-items: start;
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Cards ──────────────────────────────────────────── */
.info-card {
  border: 1px solid var(--va-background-border) !important;
  box-shadow: none !important;
}

.info-card :deep(.va-card__content) {
  padding: 14px 16px !important;
}

.card-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  opacity: 0.38;
  margin-bottom: 10px;
}

.card-body {
  font-size: 0.8125rem;
  line-height: 1.7;
  opacity: 0.72;
  margin: 0;
  text-align: justify;
}

/* ── Tech chips ─────────────────────────────────────── */
.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 5px;
  background: var(--va-background-secondary);
  border: 1px solid var(--va-background-border);
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
}

/* ── Author ─────────────────────────────────────────── */
.author-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--va-primary);
  flex-shrink: 0;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.author-nim,
.author-email {
  font-size: 0.7rem;
  opacity: 0.48;
  margin-top: 2px;
}

.author-actions {
  display: flex;
  gap: 8px;
  padding-top: 2px;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--va-primary);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 5px;
  border: 1px solid rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.04);
  transition: background 0.15s, border-color 0.15s;
}

.action-link:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.5);
}

.action-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

/* ── Features ───────────────────────────────────────── */
.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 0.775rem;
  line-height: 1.45;
  opacity: 0.75;
}

.feature-icon {
  flex-shrink: 0;
  margin-top: 1px;
}
</style>
