import { PAGINATION_CONFIG } from '../constants';

/**
 * Calculate pagination data for a given dataset
 * @param {Array} items - Array of items to paginate
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Pagination data and methods
 */
export function calculatePagination(items = [], currentPage = 1, itemsPerPage = PAGINATION_CONFIG.DEFAULT_ITEMS_PER_PAGE) {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, totalItems);
  
  return {
    items: paginatedItems,
    currentPage: validCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startItem,
    endItem,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
    isFirstPage: validCurrentPage === 1,
    isLastPage: validCurrentPage === totalPages,
  };
}

/**
 * Generate page numbers array for pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum visible page numbers
 * @returns {Array} Array of page numbers to display
 */
export function generatePageNumbers(currentPage, totalPages, maxVisible = PAGINATION_CONFIG.MAX_VISIBLE_PAGES) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Format pagination display text
 * @param {number} startItem - First item number on current page
 * @param {number} endItem - Last item number on current page
 * @param {number} totalItems - Total number of items
 * @returns {string} Formatted display text
 */
export function formatPaginationText(startItem, endItem, totalItems) {
  if (totalItems === 0) {
    return "No items to display";
  }
  
  return `Showing ${startItem} to ${endItem} of ${totalItems} items`;
}

/**
 * Get items per page options with labels
 * @returns {Array} Array of options for items per page selector
 */
export function getItemsPerPageOptions() {
  return PAGINATION_CONFIG.ITEMS_PER_PAGE_OPTIONS.map(value => ({
    value,
    label: `${value} per page`,
  }));
}