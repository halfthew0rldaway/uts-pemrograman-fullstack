<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div>
        <h1 class="font-bold mb-0" style="font-size:1.375rem;letter-spacing:-0.03em">Dashboard</h1>
        <p class="text-secondary" style="font-size:0.75rem">{{ today }}</p>
      </div>
      <VaButton preset="secondary" icon="mso-refresh" size="small" :loading="isLoading" @click="loadData">
        Refresh
      </VaButton>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <VaCard v-for="card in kpiCards" :key="card.label" class="kpi-card">
        <VaCardContent class="kpi-content-sm">
          <div class="flex items-start justify-between mb-2">
            <span class="kpi-label">{{ card.label }}</span>
            <div class="kpi-icon" :style="{ background: card.bg, color: card.color }">
              <VaIcon :name="card.icon" size="14px" />
            </div>
          </div>
          <div class="kpi-value" :style="{ color: card.color }">
            {{ isLoading ? '—' : card.value.toLocaleString('id-ID') }}
          </div>
          <div class="kpi-sub">{{ card.sub }}</div>
        </VaCardContent>
      </VaCard>
    </div>

    <!-- Row 1: Division Bar (3/5) + Status Donut (2/5) -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
      <VaCard class="lg:col-span-3">
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Karyawan per Divisi</div>
            <div class="chart-sub">Headcount tiap divisi</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart v-else :key="'div-' + chartKey" type="bar" height="175" :options="divisionOpts" :series="divisionSeries" />
        </VaCardContent>
      </VaCard>

      <VaCard class="lg:col-span-2">
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Status Kerja</div>
            <div class="chart-sub">Komposisi status karyawan</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart v-else :key="'sta-' + chartKey" type="donut" height="175" :options="statusOpts" :series="statusSeries" />
        </VaCardContent>
      </VaCard>
    </div>

    <!-- Row 2: Gender Pie + Recent Employees -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
      <VaCard class="lg:col-span-2">
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Distribusi Gender</div>
            <div class="chart-sub">Komposisi jenis kelamin</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart v-else :key="'gen-' + chartKey" type="pie" height="165" :options="genderOpts" :series="genderSeries" />
        </VaCardContent>
      </VaCard>

      <VaCard class="lg:col-span-3">
        <VaCardContent class="p-0">
          <div class="px-4 pt-3 pb-1">
            <div class="chart-title">Karyawan Terbaru</div>
            <div class="chart-sub">5 karyawan terakhir bergabung</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <table v-else class="va-table va-table--hoverable w-full">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Divisi</th>
                <th>Jabatan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in recentEmployees" :key="emp.id">
                <td>
                  <div class="flex items-center gap-2">
                    <VaAvatar :fallback-text="emp.full_name.charAt(0)" size="small" color="primary" />
                    <span class="font-medium text-sm">{{ emp.full_name }}</span>
                  </div>
                </td>
                <td class="text-sm">{{ emp.division }}</td>
                <td class="text-sm">{{ emp.position }}</td>
                <td>
                  <VaBadge :text="emp.employment_status" :color="statusColor(emp.employment_status)" />
                </td>
              </tr>
            </tbody>
          </table>
        </VaCardContent>
      </VaCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { apiClient } from '../../../services/apiClient'
import { useAuthStore } from '../../../stores/auth'

const authStore = useAuthStore()
const isLoading = ref(true)
const stats = ref<any>(null)

const today = new Date().toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const recentEmployees = computed(() => stats.value?.recentEmployees || [])

const kpiCards = computed(() => [
  { label: 'Total Karyawan',  value: stats.value?.summary?.totalEmployees  ?? 0, icon: 'mso-groups',          color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  sub: 'Seluruh karyawan' },
  { label: 'Karyawan Aktif',  value: stats.value?.summary?.activeEmployees ?? 0, icon: 'mso-person_check',    color: '#10B981', bg: 'rgba(16,185,129,0.1)',  sub: 'Status Active' },
  { label: 'Total Divisi',    value: stats.value?.summary?.totalDivisions  ?? 0, icon: 'mso-account_tree',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  sub: 'Divisi aktif' },
  { label: 'Total User',      value: stats.value?.summary?.totalUsers      ?? 0, icon: 'mso-manage_accounts', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  sub: 'Akun sistem' },
])

const isDark = ref(false)
const chartKey = ref(0)
const checkDark = () => {
  isDark.value = document.documentElement.classList.contains('va-dark')
}

watch(isDark, () => { chartKey.value++ })

// Shared theme-aware helpers
const labelColor = computed(() => isDark.value ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)')
const gridColor  = computed(() => isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')

// Division vertical bar
const divisionSeries = computed(() => [{
  name: 'Karyawan',
  data: (stats.value?.divisionStats || []).map((d: any) => d.total),
}])

const divisionOpts = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', background: 'transparent', animations: { speed: 500 }, foreColor: labelColor.value },
  plotOptions: { bar: { borderRadius: 5, columnWidth: '50%', dataLabels: { position: 'top' } } },
  colors: ['#6366F1'],
  dataLabels: {
    enabled: true, offsetY: -18,
    style: { fontSize: '11px', fontWeight: 600, colors: ['#6366F1'] },
    formatter: (v: number) => `${v}`,
  },
  xaxis: {
    categories: (stats.value?.divisionStats || []).map((d: any) => d.division),
    labels: { style: { fontSize: '11px', fontFamily: 'Inter, sans-serif', colors: labelColor.value } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: { min: 0, labels: { style: { fontSize: '11px', fontFamily: 'Inter, sans-serif', colors: labelColor.value } } },
  grid: { borderColor: gridColor.value, strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
  tooltip: { theme: isDark.value ? 'dark' : 'light', y: { formatter: (v: number) => `${v} karyawan` }, style: { fontFamily: 'Inter, sans-serif' } },
  theme: { mode: isDark.value ? 'dark' : 'light' },
}))

// Status donut
const statusSeries = computed(() => (stats.value?.statusStats || []).map((d: any) => d.total))
const statusOpts = computed(() => ({
  chart: { type: 'donut', fontFamily: 'Inter, sans-serif', background: 'transparent', animations: { speed: 500 }, foreColor: labelColor.value },
  labels: (stats.value?.statusStats || []).map((d: any) => d.status),
  colors: ['#10B981', '#F59E0B', '#EF4444'],
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          name: { fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 600, offsetY: -4, color: labelColor.value },
          value: { fontSize: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 700, offsetY: 4, color: isDark.value ? '#fff' : '#111' },
          total: { show: true, label: 'Total', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: labelColor.value, formatter: () => String(stats.value?.summary?.totalEmployees ?? 0) },
        },
      },
    },
  },
  legend: { position: 'bottom', fontFamily: 'Inter, sans-serif', fontSize: '12px', markers: { width: 8, height: 8, radius: 4 }, labels: { colors: labelColor.value } },
  stroke: { width: 2 },
  tooltip: { theme: isDark.value ? 'dark' : 'light', style: { fontFamily: 'Inter, sans-serif' } },
  theme: { mode: isDark.value ? 'dark' : 'light' },
}))

// Gender pie
const genderSeries = computed(() => {
  const d = stats.value?.genderStats || []
  return [
    d.find((x: any) => x.gender === 'Male')?.total || 0,
    d.find((x: any) => x.gender === 'Female')?.total || 0,
  ]
})
const genderOpts = computed(() => ({
  chart: { type: 'pie', fontFamily: 'Inter, sans-serif', background: 'transparent', animations: { speed: 500 }, foreColor: labelColor.value },
  labels: ['Laki-laki', 'Perempuan'],
  colors: ['#6366F1', '#EC4899'],
  dataLabels: {
    enabled: true,
    style: { fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600 },
    formatter: (v: number) => `${Math.round(v)}%`,
  },
  legend: { position: 'bottom', fontFamily: 'Inter, sans-serif', fontSize: '12px', markers: { width: 8, height: 8, radius: 4 }, labels: { colors: labelColor.value } },
  stroke: { width: 2 },
  tooltip: { theme: isDark.value ? 'dark' : 'light', y: { formatter: (v: number) => `${v} orang` }, style: { fontFamily: 'Inter, sans-serif' } },
  theme: { mode: isDark.value ? 'dark' : 'light' },
}))

const statusColor = (s: string) => ({ Active: 'success', Inactive: 'warning', Resigned: 'danger' }[s] || 'secondary')

const loadData = async () => {
  isLoading.value = true
  try {
    const { data } = await apiClient.get('/dashboard/stats')
    stats.value = data.data
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  checkDark()
  new MutationObserver(checkDark).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  await loadData()
})
</script>

<style scoped>
.kpi-card { transition: transform 0.15s; }
.kpi-card:hover { transform: translateY(-2px); }

/* Compact padding for KPI cards */
.kpi-content-sm {
  padding: 0.75rem !important;
}

.kpi-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.5;
}

.kpi-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 2px;
}

.kpi-sub {
  font-size: 0.65rem;
  opacity: 0.4;
}

.chart-title {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.chart-sub {
  font-size: 0.65rem;
  opacity: 0.45;
  margin-top: 1px;
}

.chart-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 160px;
}
</style>
