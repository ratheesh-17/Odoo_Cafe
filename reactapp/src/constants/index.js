// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: "https://8080-eddebfebcdbabfaaaedbaeffffdfcbddfacbbd.premiumproject.examly.io/api/songs",
  ADD_SONG: "/addSong",
  ALL_SONGS: "/allSongs",
  BY_GENRE: "/byGenre",
  SORTED_BY_ARTIST: "/sortedByArtist",
};

// Filter options
export const FILTER_OPTIONS = [
  { value: 'all', label: 'All Songs' },
  { value: 'Pop', label: 'Pop' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Jazz', label: 'Jazz' },
  { value: 'Hip Hop', label: 'Hip Hop' },
  { value: 'Classical', label: 'Classical' },
  { value: 'Electronic', label: 'Electronic' },
  { value: 'Country', label: 'Country' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'default', label: 'Default Order' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'artist_asc', label: 'Artist (A-Z)' },
  { value: 'artist_desc', label: 'Artist (Z-A)' },
  { value: 'album_asc', label: 'Album (A-Z)' },
  { value: 'album_desc', label: 'Album (Z-A)' },
  { value: 'duration_asc', label: 'Duration (Shortest First)' },
  { value: 'duration_desc', label: 'Duration (Longest First)' },
  { value: 'genre_asc', label: 'Genre (A-Z)' },
  { value: 'genre_desc', label: 'Genre (Z-A)' },
];

// Action types for the reducer
export const SONG_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SONGS: 'SET_SONGS',
  SET_FILTER: 'SET_FILTER',
  SET_MESSAGE: 'SET_MESSAGE',
  SET_ERROR: 'SET_ERROR',
  ADD_SONG_SUCCESS: 'ADD_SONG_SUCCESS',
  DELETE_SONG_SUCCESS: 'DELETE_SONG_SUCCESS',
  CLEAR_MESSAGE: 'CLEAR_MESSAGE',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  SET_ITEMS_PER_PAGE: 'SET_ITEMS_PER_PAGE',
  SET_TOTAL_ITEMS: 'SET_TOTAL_ITEMS',
  SET_SORT_ORDER: 'SET_SORT_ORDER',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  APPLY_FILTERS: 'APPLY_FILTERS',
};

// Form field validation messages
export const VALIDATION_MESSAGES = {
  SONG_TITLE_REQUIRED: "Song title is required.",
  ARTIST_REQUIRED: "Artist name is required.",
  GENRE_REQUIRED: "Genre is required.",
  DURATION_INVALID: "Duration must be a positive number.",
};

// UI Messages
export const UI_MESSAGES = {
  SUCCESS_ADD: "Song added successfully! Showing all songs below.",
  ERROR_FETCH: "Failed to fetch songs",
  ERROR_ADD: "Failed to add song",
  ERROR_DELETE: "Failed to delete song",
  LOADING: "Loading...",
  NO_SONGS: "No songs available. Add some!",
  CONFIRM_DELETE: "Are you sure you want to delete this song?",
};

// Form initial state
export const INITIAL_FORM_STATE = {
  songTitle: "",
  artist: "",
  album: "",
  genre: "",
  duration: "",
};

// Pagination constants
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_ITEMS_PER_PAGE: 6,
  ITEMS_PER_PAGE_OPTIONS: [6, 12, 24, 48],
  MAX_VISIBLE_PAGES: 5,
};

// Pagination messages
export const PAGINATION_MESSAGES = {
  SHOWING_RESULTS: "Showing {start} to {end} of {total} songs",
  NO_RESULTS: "No songs found for the current filter",
  FIRST_PAGE: "First",
  LAST_PAGE: "Last",
  PREVIOUS_PAGE: "Previous",
  NEXT_PAGE: "Next",
};

// Search and filtering constants
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_SEARCH_HISTORY: 10,
};

// Filter and sort messages
export const FILTER_MESSAGES = {
  NO_RESULTS: "No songs match your current filters",
  CLEAR_FILTERS: "Clear all filters",
  SEARCH_PLACEHOLDER: "Search songs, artists, albums...",
  FILTERS_APPLIED: "filters applied",
  SHOWING_FILTERED: "Showing filtered results",
};