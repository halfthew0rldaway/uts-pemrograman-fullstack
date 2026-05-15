<template>
  <div class="dashboard flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-bold mb-0" style="font-size: 1.375rem; letter-spacing: -0.03em">Dashboard</h1>
        <p class="text-secondary" style="font-size: 0.75rem">{{ today }}</p>
      </div>
      <VaButton preset="secondary" icon="mso-refresh" size="small" :loading="isLoading" @click="loadData">
        Refresh
      </VaButton>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <VaCard class="lg:col-span-3">
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Karyawan per Divisi</div>
            <div class="chart-sub">Headcount tiap divisi</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart
            v-else
            :key="'div-' + chartKey"
            type="bar"
            height="220"
            :options="divisionOpts"
            :series="divisionSeries"
          />
        </VaCardContent>
      </VaCard>

      <VaCard class="lg:col-span-2">
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Status Kerja</div>
            <div class="chart-sub">Komposisi status karyawan</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart
            v-else
            :key="'sta-' + chartKey"
            type="donut"
            height="260"
            :options="statusOpts"
            :series="statusSeries"
          />
        </VaCardContent>
      </VaCard>
    </div>

    <!-- Row 2: Rekrutmen + Gaji (equal 3-col) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <VaCard>
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Distribusi Gender</div>
            <div class="chart-sub">Komposisi jenis kelamin</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart
            v-else
            :key="'gen-' + chartKey"
            type="radialBar"
            height="260"
            :options="genderOpts"
            :series="genderSeries"
          />
        </VaCardContent>
      </VaCard>

      <VaCard>
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Tren Rekrutmen</div>
            <div class="chart-sub">Historis karyawan bergabung per bulan</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart
            v-else
            :key="'rec-' + chartKey"
            type="area"
            height="220"
            :options="recruitmentOpts"
            :series="recruitmentSeries"
          />
        </VaCardContent>
      </VaCard>

      <VaCard>
        <VaCardContent class="py-3">
          <div class="mb-2">
            <div class="chart-title">Rata-rata Gaji per Divisi</div>
            <div class="chart-sub">Perbandingan gaji min, avg, max tiap divisi</div>
          </div>
          <div v-if="isLoading" class="chart-loader"><VaProgressCircle indeterminate size="28px" /></div>
          <apexchart
            v-else
            :key="'sal-' + chartKey"
            type="line"
            height="220"
            :options="salaryOpts"
            :series="salarySeries"
          />
        </VaCardContent>
      </VaCard>
    </div>

    <!-- Row 3: Karyawan Terbaru full width -->
    <VaCard>
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
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { apiClient } from '../../../services/apiClient'
import { useAuthStore } from '../../../stores/auth'
import { useColors } from 'vuestic-ui'

const authStore = useAuthStore()
const { currentPresetName } = useColors()
const isDark = computed(() => currentPresetName.value === 'dark')
const isLoading = ref(true)
const stats = ref<any>(null)

const today = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const recentEmployees = computed(() => stats.value?.recentEmployees || [])

const kpiCards = computed(() => [
  {
    label: 'Total Karyawan',
    value: stats.value?.summary?.totalEmployees ?? 0,
    icon: 'mso-groups',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.1)',
    sub: 'Seluruh karyawan',
  },
  {
    label: 'Karyawan Aktif',
    value: stats.value?.summary?.activeEmployees ?? 0,
    icon: 'mso-person_check',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
    sub: 'Status Active',
  },
  {
    label: 'Total Divisi',
    value: stats.value?.summary?.totalDivisions ?? 0,
    icon: 'mso-account_tree',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    sub: 'Divisi aktif',
  },
  {
    label: 'Total User',
    value: stats.value?.summary?.totalUsers ?? 0,
    icon: 'mso-manage_accounts',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    sub: 'Akun sistem',
  },
])

const chartKey = ref(0)

// Apply window.Apex global defaults — this is the ONLY reliable way to set
// ApexCharts text color. It runs before chart render so foreColor is respected.
const applyApexDefaults = () => {
  const dark = isDark.value
  ;(window as any).Apex = {
    chart: {
      foreColor: dark ? '#94A3B8' : '#373d3f',
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
    },
    grid: {
      borderColor: dark ? 'rgba(148,163,184,0.07)' : 'rgba(0,0,0,0.06)',
    },
  }
}

watch(isDark, () => {
  applyApexDefaults()
  chartKey.value++
})

// Shared theme-aware helpers
const labelColor = computed(() => (isDark.value ? '#94A3B8' : '#64748B'))
const labelColorSec = computed(() => (isDark.value ? '#CBD5E1' : '#374151'))
const gridColor = computed(() => (isDark.value ? 'rgba(148,163,184,0.07)' : 'rgba(0,0,0,0.06)'))
// Segment separator — must match new card bg (#161F2E) so gaps between segments are invisible
const segmentStroke = computed(() => (isDark.value ? '#161F2E' : '#ffffff'))
// Marker stroke for line/area charts
const strokeColor = computed(() => (isDark.value ? '#161F2E' : '#ffffff'))
// Responsive center value fontSize for donut/radial charts
const centerValueFontSize = computed(() => {
  if (typeof window === 'undefined') return '22px'
  const width = window.innerWidth
  if (width < 640) return '18px'
  if (width < 1024) return '20px'
  return '22px'
})

// Belt-and-suspenders DOM patch for center labels and all chart text.
// Uses setProperty('fill','...','important') so it doesn't wipe other inline styles.
const patchChartLabels = () => {
  if (!isDark.value) return
  setTimeout(() => {
    // Donut/radial center label ("Total", "Gender")
    document.querySelectorAll('.apexcharts-datalabel-label').forEach((el) => {
      ;(el as SVGElement).style.setProperty('fill', '#CBD5E1', 'important')
    })
    // Donut/radial center value (the number)
    document.querySelectorAll('.apexcharts-datalabel-value').forEach((el) => {
      ;(el as SVGElement).style.setProperty('fill', '#F8FAFC', 'important')
    })
    // All SVG text nodes — set fill to light color
    document.querySelectorAll('.apexcharts-canvas text').forEach((el) => {
      ;(el as SVGElement).style.setProperty('fill', '#94A3B8', 'important')
    })
    // Re-apply value color on top (more specific pass)
    document.querySelectorAll('.apexcharts-datalabel-value').forEach((el) => {
      ;(el as SVGElement).style.setProperty('fill', '#F8FAFC', 'important')
    })
    // Legend text (HTML, uses color not fill)
    document.querySelectorAll('.apexcharts-legend-text').forEach((el) => {
      ;(el as HTMLElement).style.setProperty('color', '#CBD5E1', 'important')
    })
  }, 600)
}

// Division vertical bar — 8 distinct cool-tone colors (blue/teal/indigo/cyan family)
const BAR_PALETTE = ['#2EC4B6', '#6366F1', '#38BDF8', '#3B82F6', '#34D399', '#818CF8', '#22D3EE', '#60A5FA']

const divisionSeries = computed(() => [
  {
    name: 'Karyawan',
    data: (stats.value?.divisionStats || []).map((d: any) => d.total),
  },
])

const divisionOpts = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    foreColor: labelColor.value,
    animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 80 } },
    events: { mounted: () => patchChartLabels(), updated: () => patchChartLabels() },
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      borderRadiusApplication: 'end',
      columnWidth: '52%',
      distributed: true,
      dataLabels: { position: 'top' },
    },
  },
  colors: BAR_PALETTE,
  dataLabels: {
    enabled: true,
    offsetY: -18,
    style: { fontSize: '11px', fontWeight: 700, colors: BAR_PALETTE },
    formatter: (v: number) => `${v}`,
    background: { enabled: false },
  },
  xaxis: {
    categories: (stats.value?.divisionStats || []).map((d: any) => d.division),
    labels: { style: { fontSize: '10px', fontFamily: 'Inter, sans-serif', colors: Array(8).fill(labelColor.value) } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    min: 0,
    labels: { style: { fontSize: '11px', fontFamily: 'Inter, sans-serif', colors: [labelColor.value] } },
  },
  grid: {
    borderColor: gridColor.value,
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    padding: { top: 0, right: 4, bottom: 0, left: 4 },
  },
  legend: { show: false },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    y: { formatter: (v: number) => `${v} karyawan` },
    style: { fontFamily: 'Inter, sans-serif' },
  },
  theme: { mode: isDark.value ? 'dark' : 'light' },
}))

// Status donut
const statusSeries = computed(() => (stats.value?.statusStats || []).map((d: any) => d.total))
const statusOpts = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    // Do NOT set foreColor here — it overrides explicit label colors below
    animations: { speed: 500 },
    events: { mounted: () => patchChartLabels(), updated: () => patchChartLabels() },
  },
  labels: (stats.value?.statusStats || []).map((d: any) => d.status),
  colors: ['#10B981', '#F59E0B', '#EF4444'],
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      expandOnClick: false,
      donut: {
        size: '68%',
        background: 'transparent',
        labels: {
          show: true,
          name: {
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            offsetY: -2,
            color: isDark.value ? '#94A3B8' : '#64748B',
          },
          value: {
            fontSize: centerValueFontSize.value,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            offsetY: 8,
            color: isDark.value ? '#F8FAFC' : '#111827',
            formatter: (v: string) => v,
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: isDark.value ? '#CBD5E1' : '#374151',
            formatter: () => String(stats.value?.summary?.totalEmployees ?? 0),
          },
        },
      },
    },
  },
  legend: {
    position: 'bottom',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    markers: { width: 8, height: 8, radius: 4 },
    labels: { colors: [labelColorSec.value, labelColorSec.value, labelColorSec.value] },
  },
  // width:0 in dark = no white ring; light keeps 2px white gap
  stroke: { width: isDark.value ? 0 : 2, colors: [segmentStroke.value] },
  tooltip: { theme: isDark.value ? 'dark' : 'light', style: { fontFamily: 'Inter, sans-serif' } },
  // No theme.mode — prevents ApexCharts from overriding our explicit label colors
}))

// Gender — radialBar
const genderSeries = computed(() => {
  const d = stats.value?.genderStats || []
  const male = d.find((x: any) => x.gender === 'Male')?.total || 0
  const female = d.find((x: any) => x.gender === 'Female')?.total || 0
  const total = male + female || 1
  return [Math.round((male / total) * 100), Math.round((female / total) * 100)]
})

const genderOpts = computed(() => ({
  chart: {
    type: 'radialBar',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    // Do NOT set foreColor — it overrides explicit label colors below
    animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 150 } },
    events: { mounted: () => patchChartLabels(), updated: () => patchChartLabels() },
  },
  colors: ['#6366F1', '#EC4899'],
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: 0,
      endAngle: 360,
      hollow: {
        margin: 4,
        size: '45%',
        background: 'transparent',
        dropShadow: { enabled: false },
      },
      track: {
        background: isDark.value ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.05)',
        strokeWidth: '100%',
        margin: 5,
        dropShadow: { enabled: false },
      },
      dataLabels: {
        name: {
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          color: isDark.value ? '#94A3B8' : '#64748B',
          offsetY: -2,
        },
        value: {
          fontSize: centerValueFontSize.value,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          color: isDark.value ? '#F8FAFC' : '#111827',
          offsetY: 8,
          formatter: (v: number) => `${v}%`,
        },
        total: {
          show: true,
          label: 'Gender',
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          color: isDark.value ? '#CBD5E1' : '#374151',
          formatter: () => '100%',
        },
      },
    },
  },
  // stroke width 0 kills white arc outlines on radial bar entirely
  stroke: { lineCap: 'round', width: 0 },
  labels: ['Laki-laki', 'Perempuan'],
  legend: {
    show: true,
    floating: true,
    position: 'bottom',
    offsetY: 8,
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    markers: { width: 7, height: 7, radius: 3 },
    labels: { colors: [labelColorSec.value, labelColorSec.value] },
    itemMargin: { horizontal: 8 },
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    y: { formatter: (v: number) => `${v}%` },
    style: { fontFamily: 'Inter, sans-serif' },
  },
  // No theme.mode — prevents ApexCharts from overriding our explicit label colors
}))

const statusColor = (s: string) => ({ Active: 'success', Inactive: 'warning', Resigned: 'danger' })[s] || 'secondary'

// Recruitment area chart
const recruitmentSeries = computed(() => [
  {
    name: 'Rekrutmen',
    data: (stats.value?.recruitmentByMonth || []).map((d: any) => d.total),
  },
])

const recruitmentOpts = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    foreColor: labelColor.value,
    animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 100 } },
  },
  colors: ['#2EC4B6'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: isDark.value ? 0.3 : 0.45,
      opacityTo: 0.02,
      stops: [0, 90, 100],
      colorStops: [
        {
          offset: 0,
          color: '#2EC4B6',
          opacity: isDark.value ? 0.3 : 0.45,
        },
        {
          offset: 100,
          color: '#2EC4B6',
          opacity: 0.02,
        },
      ],
    },
  },
  stroke: { curve: 'smooth', width: 2.5, colors: ['#2EC4B6'] },
  dataLabels: { enabled: false },
  xaxis: {
    categories: (stats.value?.recruitmentByMonth || []).map((d: any) => d.month),
    labels: {
      rotate: -45,
      rotateAlways: true,
      style: { fontSize: '9px', fontFamily: 'Inter, sans-serif', colors: Array(20).fill(labelColor.value) },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    min: 0,
    tickAmount: 3,
    labels: {
      style: { fontSize: '10px', fontFamily: 'Inter, sans-serif', colors: [labelColor.value] },
      formatter: (v: number) => `${v}`,
    },
  },
  grid: {
    borderColor: gridColor.value,
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    padding: { top: 0, right: 8, bottom: 10, left: 8 },
  },
  markers: { size: 3, colors: ['#2EC4B6'], strokeColors: strokeColor.value, strokeWidth: 2, hover: { size: 5 } },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    y: { formatter: (v: number) => `${v} orang` },
    style: { fontFamily: 'Inter, sans-serif' },
  },
  theme: { mode: isDark.value ? 'dark' : 'light' },
}))

// Salary line chart (min, avg, max per divisi)
const salarySeries = computed(() => [
  {
    name: 'Rata-rata',
    data: (stats.value?.avgSalaryByDivision || []).map((d: any) => d.avg_salary),
  },
  {
    name: 'Minimum',
    data: (stats.value?.avgSalaryByDivision || []).map((d: any) => d.min_salary),
  },
  {
    name: 'Maximum',
    data: (stats.value?.avgSalaryByDivision || []).map((d: any) => d.max_salary),
  },
])

const salaryOpts = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    foreColor: labelColor.value,
    animations: { enabled: true, speed: 700, animateGradually: { enabled: true, delay: 120 } },
  },
  colors: ['#3B82F6', '#F59E0B', '#10B981'],
  stroke: { curve: 'smooth', width: [3, 2, 2], dashArray: [0, 5, 5] },
  dataLabels: { enabled: false },
  markers: {
    size: [5, 4, 4],
    colors: ['#3B82F6', '#F59E0B', '#10B981'],
    strokeColors: strokeColor.value,
    strokeWidth: 2,
    hover: { size: 7 },
  },
  xaxis: {
    categories: (stats.value?.avgSalaryByDivision || []).map((d: any) => d.division),
    labels: { style: { fontSize: '10px', fontFamily: 'Inter, sans-serif', colors: Array(8).fill(labelColor.value) } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '10px', fontFamily: 'Inter, sans-serif', colors: [labelColor.value] },
      formatter: (v: number) => `${(v / 1_000_000).toFixed(1)}M`,
    },
  },
  grid: {
    borderColor: gridColor.value,
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    padding: { top: 0, right: 8, bottom: 0, left: 8 },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    markers: { width: 8, height: 8, radius: 4 },
    labels: { colors: [labelColorSec.value, labelColorSec.value, labelColorSec.value] },
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    y: { formatter: (v: number) => `Rp ${v.toLocaleString('id-ID')}` },
    style: { fontFamily: 'Inter, sans-serif' },
  },
  theme: { mode: isDark.value ? 'dark' : 'light' },
}))

const loadData = async () => {
  isLoading.value = true
  try {
    const { data } = await apiClient.get('/dashboard/stats')
    stats.value = data.data
  } finally {
    isLoading.value = false
  }
}

watch(
  () => stats.value,
  () => {
    setTimeout(patchChartLabels, 400)
  },
)

onMounted(async () => {
  // Set window.Apex BEFORE charts render — this is the global default foreColor
  applyApexDefaults()
  await loadData()
  // Patch center labels after charts finish animating
  setTimeout(patchChartLabels, 500)
})
</script>

<style scoped>
.kpi-card {
  transition: transform 0.15s;
}
.kpi-card:hover {
  transform: translateY(-2px);
}

/* Compact padding for KPI cards */
.kpi-content-sm {
  padding: 0.75rem !important;
}

.kpi-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  /* Use var so dark mode can override without specificity fight */
  opacity: var(--kpi-label-opacity, 0.5);
  color: var(--kpi-label-color, inherit);
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
  opacity: var(--kpi-sub-opacity, 0.4);
  color: var(--kpi-sub-color, inherit);
}

.chart-title {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--chart-title-color, inherit);
}

.chart-sub {
  font-size: 0.65rem;
  opacity: var(--chart-sub-opacity, 0.45);
  color: var(--chart-sub-color, inherit);
  margin-top: 1px;
}

.chart-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 220px;
}
</style>
