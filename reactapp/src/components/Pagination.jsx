import React from 'react';
import { useSongs } from '../context/SongContext';
import { generatePageNumbers, formatPaginationText, getItemsPerPageOptions } from '../utils/pagination';
import { PAGINATION_MESSAGES } from '../constants';
import './Pagination.css';

function Pagination() {
  const {
    paginationData,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
  } = useSongs();

  if (!paginationData || paginationData.totalItems === 0) {
    return null;
  }

  const { totalPages, startItem, endItem, totalItems, hasNextPage, hasPreviousPage } = paginationData;
  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  const itemsPerPageOptions = getItemsPerPageOptions();

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
  };

  return (
    <div className="pagination-container">
      {/* Items per page selector */}
      <div className="items-per-page">
        <label htmlFor="items-per-page-select">Items per page:</label>
        <select
          id="items-per-page-select"
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="items-per-page-select"
        >
          {itemsPerPageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination info */}
      <div className="pagination-info">
        {formatPaginationText(startItem, endItem, totalItems)}
      </div>

      {/* Pagination controls */}
      <div className="pagination-controls">
        {/* First page button */}
        <button
          onClick={goToFirstPage}
          disabled={!hasPreviousPage}
          className="pagination-btn first-btn"
          title={PAGINATION_MESSAGES.FIRST_PAGE}
        >
          &#171;
        </button>

        {/* Previous page button */}
        <button
          onClick={goToPreviousPage}
          disabled={!hasPreviousPage}
          className="pagination-btn prev-btn"
          title={PAGINATION_MESSAGES.PREVIOUS_PAGE}
        >
          &#8249;
        </button>

        {/* Page number buttons */}
        {pageNumbers.map(pageNumber => (
          <button
            key={pageNumber}
            onClick={() => setCurrentPage(pageNumber)}
            className={`pagination-btn page-btn ${
              pageNumber === currentPage ? 'active' : ''
            }`}
          >
            {pageNumber}
          </button>
        ))}

        {/* Next page button */}
        <button
          onClick={goToNextPage}
          disabled={!hasNextPage}
          className="pagination-btn next-btn"
          title={PAGINATION_MESSAGES.NEXT_PAGE}
        >
          &#8250;
        </button>

        {/* Last page button */}
        <button
          onClick={goToLastPage}
          disabled={!hasNextPage}
          className="pagination-btn last-btn"
          title={PAGINATION_MESSAGES.LAST_PAGE}
        >
          &#187;
        </button>
      </div>
    </div>
  );
}

export default Pagination;