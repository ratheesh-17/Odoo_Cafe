import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  getAllSongs,
  addSong,
  getSongsByGenre,
  getSongsSortedByArtist,
  deleteSong,
} from '../services/api';
import { SONG_ACTIONS, UI_MESSAGES, PAGINATION_CONFIG } from '../constants';
import { calculatePagination } from '../utils/pagination';
import { applySongFilters, applySongSort } from '../utils/filtering';

// Initial state
const initialState = {
  songs: [],
  allSongs: [], // Store all fetched songs
  filteredSongs: [], // Store filtered and sorted songs
  filter: 'all',
  loading: false,
  message: '',
  error: null,
  // Pagination state
  currentPage: PAGINATION_CONFIG.DEFAULT_PAGE,
  itemsPerPage: PAGINATION_CONFIG.DEFAULT_ITEMS_PER_PAGE,
  totalItems: 0,
  paginationData: null,
  // Filtering and sorting state
  sortOrder: 'default',
  searchQuery: '',
  activeFilters: {
    genre: 'all',
    searchQuery: '',
    minDuration: null,
    maxDuration: null,
    artists: [],
  },
};

// Reducer function
function songReducer(state, action) {
  switch (action.type) {
    case SONG_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case SONG_ACTIONS.SET_SONGS:
      const allSongs = action.payload;
      // Apply current filters and sorting
      const filteredAndSorted = applySongSort(
        applySongFilters(allSongs, state.activeFilters),
        state.sortOrder
      );
      const paginationData = calculatePagination(filteredAndSorted, state.currentPage, state.itemsPerPage);
      return { 
        ...state, 
        allSongs,
        filteredSongs: filteredAndSorted,
        songs: paginationData.items,
        totalItems: paginationData.totalItems,
        paginationData,
        error: null 
      };
    case SONG_ACTIONS.SET_FILTER:
      return { 
        ...state, 
        filter: action.payload, 
        currentPage: PAGINATION_CONFIG.DEFAULT_PAGE // Reset to first page when filter changes
      };
    case SONG_ACTIONS.SET_MESSAGE:
      return { ...state, message: action.payload, error: null };
    case SONG_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, message: '' };
    case SONG_ACTIONS.ADD_SONG_SUCCESS:
      return { 
        ...state, 
        filter: 'all',
        currentPage: PAGINATION_CONFIG.DEFAULT_PAGE,
        message: UI_MESSAGES.SUCCESS_ADD,
        error: null 
      };
    case SONG_ACTIONS.DELETE_SONG_SUCCESS:
      return { ...state, message: '', error: null };
    case SONG_ACTIONS.CLEAR_MESSAGE:
      return { ...state, message: '' };
    case SONG_ACTIONS.SET_CURRENT_PAGE:
      const newPaginationData = calculatePagination(state.filteredSongs, action.payload, state.itemsPerPage);
      return {
        ...state,
        currentPage: action.payload,
        songs: newPaginationData.items,
        paginationData: newPaginationData,
      };
    case SONG_ACTIONS.SET_ITEMS_PER_PAGE:
      const updatedPaginationData = calculatePagination(state.filteredSongs, 1, action.payload);
      return {
        ...state,
        itemsPerPage: action.payload,
        currentPage: 1, // Reset to first page when changing items per page
        songs: updatedPaginationData.items,
        paginationData: updatedPaginationData,
      };
    case SONG_ACTIONS.SET_SORT_ORDER:
      const sortedSongs = applySongSort(state.filteredSongs, action.payload);
      const sortPaginationData = calculatePagination(sortedSongs, 1, state.itemsPerPage);
      return {
        ...state,
        sortOrder: action.payload,
        currentPage: 1,
        filteredSongs: sortedSongs,
        songs: sortPaginationData.items,
        paginationData: sortPaginationData,
      };
    case SONG_ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
        activeFilters: {
          ...state.activeFilters,
          searchQuery: action.payload,
        },
      };
    case SONG_ACTIONS.APPLY_FILTERS:
      const newFilteredSongs = applySongSort(
        applySongFilters(state.allSongs, action.payload),
        state.sortOrder
      );
      const filterPaginationData = calculatePagination(newFilteredSongs, 1, state.itemsPerPage);
      return {
        ...state,
        activeFilters: action.payload,
        filteredSongs: newFilteredSongs,
        songs: filterPaginationData.items,
        currentPage: 1,
        totalItems: filterPaginationData.totalItems,
        paginationData: filterPaginationData,
      };
    default:
      return state;
  }
}

// Create context
const SongContext = createContext();

// Custom hook to use the song context
export function useSongs() {
  const context = useContext(SongContext);
  if (!context) {
    throw new Error('useSongs must be used within a SongProvider');
  }
  return context;
}

// Provider component
export function SongProvider({ children }) {
  const [state, dispatch] = useReducer(songReducer, initialState);

  // Fetch songs based on filter
  const fetchSongs = useCallback(async (activeFilter = state.filter) => {
    dispatch({ type: SONG_ACTIONS.SET_LOADING, payload: true });
    try {
      let data = [];
      if (activeFilter === 'all') {
        data = await getAllSongs();
      } else if (activeFilter === 'sorted') {
        data = await getSongsSortedByArtist();
      } else {
        data = await getSongsByGenre(activeFilter);
      }
      dispatch({ type: SONG_ACTIONS.SET_SONGS, payload: data });
    } catch (error) {
      dispatch({ type: SONG_ACTIONS.SET_ERROR, payload: UI_MESSAGES.ERROR_FETCH });
      dispatch({ type: SONG_ACTIONS.SET_SONGS, payload: [] });
    }
    dispatch({ type: SONG_ACTIONS.SET_LOADING, payload: false });
  }, [state.filter]);

  // Add a new song
  const addNewSong = async (song) => {
    try {
      await addSong(song);
      dispatch({ type: SONG_ACTIONS.ADD_SONG_SUCCESS });
      await fetchSongs('all');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        dispatch({ type: SONG_ACTIONS.CLEAR_MESSAGE });
      }, 3000);
      
      return true;
    } catch (error) {
      dispatch({ type: SONG_ACTIONS.SET_ERROR, payload: `${UI_MESSAGES.ERROR_ADD}: ${error.message}` });
      throw error;
    }
  };

  // Delete a song
  const removeSong = async (id) => {
    try {
      console.log(`Removing song with ID: ${id}`);
      await deleteSong(id);
      dispatch({ type: SONG_ACTIONS.DELETE_SONG_SUCCESS });
      await fetchSongs();
      dispatch({ type: SONG_ACTIONS.SET_MESSAGE, payload: 'Song deleted successfully' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        dispatch({ type: SONG_ACTIONS.CLEAR_MESSAGE });
      }, 3000);
    } catch (error) {
      console.error('Error removing song:', error);
      const errorMessage = error.message.includes('Permission denied') 
        ? 'You do not have permission to delete this song'
        : error.message.includes('404') 
        ? 'Song not found - it may have already been deleted'
        : `Failed to delete song: ${error.message}`;
      dispatch({ type: SONG_ACTIONS.SET_ERROR, payload: errorMessage });
    }
  };

  // Set filter
  const setFilter = (filter) => {
    dispatch({ type: SONG_ACTIONS.SET_FILTER, payload: filter });
  };

  // Clear messages
  const clearMessage = () => {
    dispatch({ type: SONG_ACTIONS.CLEAR_MESSAGE });
  };

  // Pagination functions
  // Pagination functions
  const setCurrentPage = (page) => {
    dispatch({ type: SONG_ACTIONS.SET_CURRENT_PAGE, payload: page });
  };

  const setItemsPerPage = (itemsPerPage) => {
    dispatch({ type: SONG_ACTIONS.SET_ITEMS_PER_PAGE, payload: itemsPerPage });
  };

  const goToNextPage = () => {
    if (state.paginationData?.hasNextPage) {
      setCurrentPage(state.currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (state.paginationData?.hasPreviousPage) {
      setCurrentPage(state.currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    if (state.paginationData?.totalPages) {
      setCurrentPage(state.paginationData.totalPages);
    }
  };

  // Filtering and sorting functions
  const setSortOrder = (sortOrder) => {
    dispatch({ type: SONG_ACTIONS.SET_SORT_ORDER, payload: sortOrder });
  };

  const setSearchQuery = (query) => {
    dispatch({ type: SONG_ACTIONS.SET_SEARCH_QUERY, payload: query });
  };

  const applyFilters = (filters) => {
    dispatch({ type: SONG_ACTIONS.APPLY_FILTERS, payload: filters });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      genre: 'all',
      searchQuery: '',
      minDuration: null,
      maxDuration: null,
      artists: [],
    };
    dispatch({ type: SONG_ACTIONS.APPLY_FILTERS, payload: clearedFilters });
    dispatch({ type: SONG_ACTIONS.SET_SORT_ORDER, payload: 'default' });
    dispatch({ type: SONG_ACTIONS.SET_SEARCH_QUERY, payload: '' });
  };

  // Load songs when filter changes
  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const value = {
    // State
    songs: state.songs,
    allSongs: state.allSongs,
    filteredSongs: state.filteredSongs,
    filter: state.filter,
    loading: state.loading,
    message: state.message,
    error: state.error,
    
    // Pagination state
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    totalItems: state.totalItems,
    paginationData: state.paginationData,
    
    // Filtering and sorting state
    sortOrder: state.sortOrder,
    searchQuery: state.searchQuery,
    activeFilters: state.activeFilters,
    
    // Actions
    fetchSongs,
    addNewSong,
    removeSong,
    setFilter,
    clearMessage,
    
    // Pagination actions
    setCurrentPage,
    setItemsPerPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    
    // Filtering and sorting actions
    setSortOrder,
    setSearchQuery,
    applyFilters,
    clearAllFilters,
  };

  return (
    <SongContext.Provider value={value}>
      {children}
    </SongContext.Provider>
  );
}