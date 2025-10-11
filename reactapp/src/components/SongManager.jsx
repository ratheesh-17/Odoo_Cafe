import React, { useState } from 'react';
import { useSongs } from '../context/SongContext';
import SongFormImproved from './SongFormImproved';
import SongListImproved from './SongListImproved';
import Pagination from './Pagination';
import { FILTER_OPTIONS, SORT_OPTIONS, FILTER_MESSAGES } from '../constants';
import './SongManager.css';

function SongManager() {
  const {
    message,
    error,
    sortOrder,
    searchQuery,
    activeFilters,
    setSortOrder,
    setSearchQuery,
    applyFilters,
    clearAllFilters,
  } = useSongs();
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    setSearchQuery(query);
    const newFilters = { ...activeFilters, searchQuery: query };
    applyFilters(newFilters);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const handleGenreChange = (e) => {
    const newFilters = { ...activeFilters, genre: e.target.value };
    applyFilters(newFilters);
  };

  const hasActiveFilters = (
    activeFilters.genre !== 'all' ||
    activeFilters.searchQuery ||
    sortOrder !== 'default'
  );

  return (
    <div className="song-manager">
      {/* Enhanced Filter Controls */}
      <div className="filter-controls">
        <div className="main-filters">
          {/* Search Input */}
          <div className="search-container">
            <input
              type="text"
              placeholder={FILTER_MESSAGES.SEARCH_PLACEHOLDER}
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Genre Filter */}
          <select
            value={activeFilters.genre}
            onChange={handleGenreChange}
            className="filter-select"
            data-testid="filter-dropdown"
          >
            {FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="sort-select"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="clear-filters">
              Clear All
            </button>
          )}
        </div>
      </div>
      
      <SongFormImproved />
      
      {message && (
        <div className="success-message" style={{
          background: '#d4edda',
          color: '#155724',
          padding: '10px',
          borderRadius: '8px',
          margin: '10px 0',
          textAlign: 'center',
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '8px',
          margin: '10px 0',
          textAlign: 'center',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}
      
      <SongListImproved />
      <Pagination />
    </div>
  );
}

export default SongManager;