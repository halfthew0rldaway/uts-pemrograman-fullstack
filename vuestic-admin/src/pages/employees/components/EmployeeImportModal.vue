<template>
  <VaModal
    v-model="isOpen"
    title="Import Data Karyawan"
    size="medium"
    hide-default-actions
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-4 py-2">
      <!-- Info -->
      <VaAlert color="info" border="left" class="text-sm">
        Upload file <strong>Excel (.xlsx/.xls)</strong> atau <strong>CSV (.csv)</strong> berisi data karyawan.
        Pastikan format kolom sesuai template.
      </VaAlert>

      <!-- Download Template -->
      <div class="flex items-center justify-between p-3 rounded-lg border border-backgroundBorder bg-backgroundElement">
        <div>
          <div class="font-semibold text-sm">Template Import</div>
          <div class="text-xs text-secondary mt-0.5">Download template Excel dengan contoh data</div>
        </div>
        <VaButton preset="secondary" size="small" icon="mso-download" @click="downloadTemplate">
          Download
        </VaButton>
      </div>

      <!-- Upload Area -->
      <div
        class="upload-area"
        :class="{ 'upload-area--dragover': isDragging, 'upload-area--has-file': selectedFile }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv"
          class="hidden"
          @change="onFileChange"
        />
        <div v-if="!selectedFile" class="flex flex-col items-center gap-2 text-secondary">
          <VaIcon name="mso-upload_file" size="36px" />
          <div class="text-sm font-medium">Klik atau drag & drop file di sini</div>
          <div class="text-xs">Excel (.xlsx, .xls) atau CSV (.csv) — maks 5MB</div>
        </div>
        <div v-else class="flex items-center gap-3">
          <VaIcon name="mso-description" size="28px" color="success" />
          <div>
            <div class="font-semibold text-sm">{{ selectedFile.name }}</div>
            <div class="text-xs text-secondary">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
          <VaButton
            preset="plain"
            icon="mso-close"
            size="small"
            color="danger"
            class="ml-auto"
            @click.stop="clearFile"
          />
        </div>
      </div>

      <!-- Result -->
      <div v-if="result" class="flex flex-col gap-2">
        <VaAlert :color="resultAlertColor" border="left" class="text-sm">
          {{ result.message }}
        </VaAlert>

        <!-- Stats grid -->
        <div v-if="result.data" class="grid grid-cols-3 gap-2 text-center text-sm">
          <div class="stat-box stat-box--success">
            <div class="stat-value">{{ result.data.inserted }}</div>
            <div class="stat-label">Berhasil</div>
          </div>
          <div class="stat-box stat-box--warning">
            <div class="stat-value">{{ result.data.skipped?.length ?? 0 }}</div>
            <div class="stat-label">Dilewati</div>
          </div>
          <div class="stat-box stat-box--danger">
            <div class="stat-value">{{ result.data.errors?.length ?? 0 }}</div>
            <div class="stat-label">Error</div>
          </div>
        </div>

        <!-- Error details -->
        <div v-if="result.data?.errors?.length" class="detail-list detail-list--danger">
          <div class="detail-list__title">
            <VaIcon name="mso-cancel" size="14px" /> Detail Error
          </div>
          <div v-for="err in result.data.errors" :key="err" class="detail-list__item">
            {{ err }}
          </div>
        </div>

        <!-- Skipped details -->
        <div v-if="result.data?.skipped?.length" class="detail-list detail-list--warning">
          <div class="detail-list__title">
            <VaIcon name="mso-info" size="14px" /> Data Dilewati (Duplikat)
          </div>
          <div v-for="s in result.data.skipped" :key="s" class="detail-list__item">
            {{ s }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <VaButton preset="secondary" @click="$emit('close')">
          {{ result?.data?.inserted ? 'Tutup' : 'Batal' }}
        </VaButton>
        <VaButton
          v-if="!result"
          :loading="isUploading"
          :disabled="!selectedFile"
          icon="mso-upload"
          @click="doImport"
        >
          Import Data
        </VaButton>
        <VaButton v-if="result?.data?.inserted" color="primary" @click="onDone">
          Selesai & Refresh
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useToast } from 'vuestic-ui'
import { apiClient } from '../../../services/apiClient'

const emit = defineEmits<{ close: []; imported: [] }>()

const { init: toast } = useToast()
const isOpen = ref(true)
const isDragging = ref(false)
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const result = ref<any>(null)

const resultAlertColor = computed(() => {
  if (!result.value) return 'info'
  if (!result.value.success) return 'danger'
  if (result.value.data?.inserted === 0) return 'warning'
  return 'success'
})

const triggerFileInput = () => fileInput.value?.click()

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setFile(file)
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

const setFile = (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
    toast({ message: 'Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv', color: 'warning' })
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast({ message: 'Ukuran file maksimal 5MB', color: 'warning' })
    return
  }
  selectedFile.value = file
  result.value = null
}

const clearFile = () => {
  selectedFile.value = null
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const downloadTemplate = async () => {
  try {
    const res = await apiClient.get('/employees/import/template', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_karyawan.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast({ message: 'Gagal download template', color: 'danger' })
  }
}

const doImport = async () => {
  if (!selectedFile.value) return
  isUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    const { data } = await apiClient.post('/employees/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    result.value = data

    const inserted = data.data?.inserted ?? 0
    const skipped = data.data?.skipped?.length ?? 0
    const errors = data.data?.errors?.length ?? 0

    if (inserted > 0) {
      toast({ message: `${inserted} data berhasil diimport!`, color: 'success' })
    } else if (skipped > 0 && inserted === 0 && errors === 0) {
      // Semua data duplikat
      toast({
        message: `⚠️ Semua ${skipped} data sudah ada di sistem (duplikat). Tidak ada data baru yang diimport.`,
        color: 'warning',
      })
      result.value = {
        ...data,
        message: `Tidak ada data baru — semua ${skipped} baris sudah terdaftar di sistem.`,
      }
    } else if (inserted === 0) {
      toast({ message: 'Tidak ada data yang berhasil diimport. Periksa detail error.', color: 'danger' })
    }
  } catch (e: any) {
    result.value = {
      success: false,
      message: e.response?.data?.message || 'Gagal mengimport data',
    }
  } finally {
    isUploading.value = false
  }
}

const onDone = () => {
  emit('imported')
  emit('close')
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--va-background-border);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--va-background-element);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.upload-area:hover,
.upload-area--dragover {
  border-color: var(--va-primary);
  background: rgba(99, 102, 241, 0.04);
}

.upload-area--has-file {
  border-style: solid;
  border-color: var(--va-success);
  background: rgba(16, 185, 129, 0.04);
  justify-content: flex-start;
  padding: 1rem 1.25rem;
}

/* Stat boxes */
.stat-box {
  padding: 10px 8px;
  border-radius: 10px;
  background: var(--va-background-element);
  border: 1px solid var(--va-background-border);
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 0.7rem;
  opacity: 0.55;
  margin-top: 2px;
}
.stat-box--success .stat-value { color: var(--va-success); }
.stat-box--warning .stat-value { color: #92400e; }
.stat-box--danger  .stat-value { color: #991b1b; }

/* Detail lists */
.detail-list {
  border-radius: 8px;
  padding: 10px 12px;
  max-height: 120px;
  overflow-y: auto;
  font-size: 0.75rem;
  line-height: 1.5;
}
.detail-list--danger {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.detail-list--warning {
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.detail-list__title {
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.75;
}
.detail-list--danger .detail-list__title { color: #b91c1c; }
.detail-list--warning .detail-list__title { color: #92400e; }
.detail-list__item {
  padding: 2px 0;
  opacity: 0.8;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.detail-list--danger .detail-list__item { color: #7f1d1d; }
.detail-list--warning .detail-list__item { color: #78350f; }
.detail-list__item:last-child { border-bottom: none; }
</style>
