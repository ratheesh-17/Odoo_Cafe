import { SEARCH_CONFIG } from '../constants';

/**
 * Filter songs based on multiple criteria
 * @param {Array} songs - Array of song objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered songs
 */
export function applySongFilters(songs = [], filters = {}) {
  let filteredSongs = [...songs];

  // Genre filter
  if (filters.genre && filters.genre !== 'all') {
    filteredSongs = filteredSongs.filter(song => 
      song.genre?.toLowerCase() === filters.genre.toLowerCase()
    );
  }

  // Search query filter
  if (filters.searchQuery && filters.searchQuery.length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
    const query = filters.searchQuery.toLowerCase().trim();
    filteredSongs = filteredSongs.filter(song => {
      return (
        song.songTitle?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query) ||
        song.album?.toLowerCase().includes(query) ||
        song.genre?.toLowerCase().includes(query)
      );
    });
  }

  // Duration range filter
  if (filters.minDuration || filters.maxDuration) {
    filteredSongs = filteredSongs.filter(song => {
      const duration = song.duration || 0;
      const min = filters.minDuration || 0;
      const max = filters.maxDuration || Infinity;
      return duration >= min && duration <= max;
    });
  }

  // Artist filter (multiple artists)
  if (filters.artists && filters.artists.length > 0) {
    filteredSongs = filteredSongs.filter(song =>
      filters.artists.includes(song.artist)
    );
  }

  return filteredSongs;
}

/**
 * Sort songs based on specified criteria
 * @param {Array} songs - Array of song objects
 * @param {string} sortOrder - Sort criteria
 * @returns {Array} Sorted songs
 */
export function applySongSort(songs = [], sortOrder = 'default') {
  if (!sortOrder || sortOrder === 'default') {
    return songs;
  }

  const sortedSongs = [...songs];
  
  switch (sortOrder) {
    case 'title_asc':
      return sortedSongs.sort((a, b) => 
        (a.songTitle || '').localeCompare(b.songTitle || '')
      );
    
    case 'title_desc':
      return sortedSongs.sort((a, b) => 
        (b.songTitle || '').localeCompare(a.songTitle || '')
      );
    
    case 'artist_asc':
      return sortedSongs.sort((a, b) => 
        (a.artist || '').localeCompare(b.artist || '')
      );
    
    case 'artist_desc':
      return sortedSongs.sort((a, b) => 
        (b.artist || '').localeCompare(a.artist || '')
      );
    
    case 'album_asc':
      return sortedSongs.sort((a, b) => 
        (a.album || '').localeCompare(b.album || '')
      );
    
    case 'album_desc':
      return sortedSongs.sort((a, b) => 
        (b.album || '').localeCompare(a.album || '')
      );
    
    case 'duration_asc':
      return sortedSongs.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    
    case 'duration_desc':
      return sortedSongs.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    case 'genre_asc':
      return sortedSongs.sort((a, b) => 
        (a.genre || '').localeCompare(b.genre || '')
      );
    
    case 'genre_desc':
      return sortedSongs.sort((a, b) => 
        (b.genre || '').localeCompare(a.genre || '')
      );
    
    default:
      return sortedSongs;
  }
}

/**
 * Get unique values from songs for filter options
 * @param {Array} songs - Array of song objects
 * @param {string} field - Field to extract unique values from
 * @returns {Array} Array of unique values
 */
export function getUniqueValues(songs = [], field) {
  const values = songs
    .map(song => song[field])
    .filter(value => value && value.trim())
    .map(value => value.trim());
  
  return [...new Set(values)].sort();
}

/**
 * Get duration statistics for songs
 * @param {Array} songs - Array of song objects
 * @returns {Object} Duration statistics
 */
export function getDurationStats(songs = []) {
  if (songs.length === 0) {
    return { min: 0, max: 0, average: 0, total: 0 };
  }

  const durations = songs.map(song => song.duration || 0).filter(d => d > 0);
  
  if (durations.length === 0) {
    return { min: 0, max: 0, average: 0, total: 0 };
  }

  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  const average = total / durations.length;

  return { min, max, average, total };
}

/**
 * Format duration from seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "3:45", "1:23:45")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create filter summary text
 * @param {Object} filters - Applied filters
 * @param {number} totalResults - Number of results after filtering
 * @returns {string} Filter summary text
 */
export function createFilterSummary(filters = {}, totalResults = 0) {
  const activeFilters = [];
  
  if (filters.genre && filters.genre !== 'all') {
    activeFilters.push(`Genre: ${filters.genre}`);
  }
  
  if (filters.searchQuery && filters.searchQuery.length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
    activeFilters.push(`Search: "${filters.searchQuery}"`);
  }
  
  if (filters.minDuration || filters.maxDuration) {
    const min = filters.minDuration ? formatDuration(filters.minDuration) : '0:00';
    const max = filters.maxDuration ? formatDuration(filters.maxDuration) : '∞';
    activeFilters.push(`Duration: ${min} - ${max}`);
  }
  
  if (filters.artists && filters.artists.length > 0) {
    if (filters.artists.length === 1) {
      activeFilters.push(`Artist: ${filters.artists[0]}`);
    } else {
      activeFilters.push(`Artists: ${filters.artists.length} selected`);
    }
  }
  
  if (activeFilters.length === 0) {
    return `Showing all ${totalResults} songs`;
  }
  
  const filterText = activeFilters.join(', ');
  return `${totalResults} songs found with filters: ${filterText}`;
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}