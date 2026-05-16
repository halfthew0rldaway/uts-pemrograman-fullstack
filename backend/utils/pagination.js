/**
 * @description Menghitung nilai LIMIT dan OFFSET untuk query pagination.
 * @param {number} page - Halaman saat ini (1-indexed)
 * @param {number} pageSize - Jumlah data per halaman
 * @returns {{ limit: number, offset: number, page: number, pageSize: number }}
 */
export const getPagination = (page = 1, pageSize = 10) => {
  const limit = Math.max(1, parseInt(pageSize) || 10)
  const currentPage = Math.max(1, parseInt(page) || 1)
  const offset = (currentPage - 1) * limit
  return { limit: Number(limit), offset: Number(offset), page: currentPage, pageSize: limit }
}

/**
 * @description Membangun objek metadata pagination untuk response API.
 * @param {number} totalItems - Total seluruh data dari query COUNT
 * @param {number} page - Halaman saat ini
 * @param {number} pageSize - Jumlah data per halaman
 * @returns {{ totalItems, totalPages, currentPage, pageSize, hasNextPage, hasPrevPage }}
 */
export const buildPaginationMeta = (totalItems, page, pageSize) => {
  const totalPages = Math.ceil(totalItems / pageSize)
  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
