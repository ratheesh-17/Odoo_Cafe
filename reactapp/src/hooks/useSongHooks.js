import { useState, useCallback } from 'react';
import { useSongs } from '../context/SongContext';
import { INITIAL_FORM_STATE, VALIDATION_MESSAGES, FILTER_OPTIONS } from '../constants';

// Custom hook for form management
export function useSongForm() {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState(null);
  const { addNewSong, loading } = useSongs();

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM_STATE);
    setError(null);
  }, []);

  const validateForm = useCallback(() => {
    const { songTitle, artist, genre, duration } = form;
    
    if (!songTitle.trim()) {
      setError(VALIDATION_MESSAGES.SONG_TITLE_REQUIRED);
      return false;
    }
    if (!artist.trim()) {
      setError(VALIDATION_MESSAGES.ARTIST_REQUIRED);
      return false;
    }
    if (!genre.trim()) {
      setError(VALIDATION_MESSAGES.GENRE_REQUIRED);
      return false;
    }
    if (!duration || duration <= 0) {
      setError(VALIDATION_MESSAGES.DURATION_INVALID);
      return false;
    }
    
    return true;
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    const { songTitle, artist, album, genre, duration } = form;
    
    try {
      await addNewSong({
        songTitle: songTitle.trim(),
        artist: artist.trim(),
        album: album.trim(),
        genre: genre.trim(),
        duration: Number(duration),
      });
      resetForm();
    } catch (err) {
      console.error("Detailed error in SongForm:", err);
      setError(`Failed to add song: ${err.message}. Please check the browser console for details.`);
    }
  }, [form, validateForm, addNewSong, resetForm]);

  return {
    form,
    error,
    loading,
    handleChange,
    handleSubmit,
    resetForm,
  };
}

// Custom hook for filter management
export function useFilters() {
  const {
    filter,
    setFilter,
    loading,
    sortOrder,
    searchQuery,
    activeFilters,
    setSortOrder,
    setSearchQuery,
    applyFilters,
    clearAllFilters,
  } = useSongs();

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, [setFilter]);

  const handleSortChange = useCallback((newSortOrder) => {
    setSortOrder(newSortOrder);
  }, [setSortOrder]);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    const newFilters = { ...activeFilters, searchQuery: query };
    applyFilters(newFilters);
  }, [setSearchQuery, applyFilters, activeFilters]);

  const handleGenreChange = useCallback((genre) => {
    const newFilters = { ...activeFilters, genre };
    applyFilters(newFilters);
  }, [applyFilters, activeFilters]);

  return {
    // State
    currentFilter: filter,
    filters: FILTER_OPTIONS,
    sortOrder,
    searchQuery,
    activeFilters,
    loading,
    
    // Actions
    handleFilterChange,
    handleSortChange,
    handleSearchChange,
    handleGenreChange,
    clearAllFilters,
  };
}

// Custom hook for song operations
export function useSongOperations() {
  const { songs, removeSong, loading } = useSongs();

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      await removeSong(id);
    }
  }, [removeSong]);

  return {
    songs,
    loading,
    handleDelete,
  };
}

// Custom hook for pagination
export function usePagination() {
  const {
    paginationData,
    currentPage,
    itemsPerPage,
    totalItems,
    setCurrentPage,
    setItemsPerPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
  } = useSongs();

  const canGoNext = paginationData?.hasNextPage || false;
  const canGoPrevious = paginationData?.hasPreviousPage || false;
  const totalPages = paginationData?.totalPages || 0;
  
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [setCurrentPage, totalPages]);

  const changeItemsPerPage = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
  }, [setItemsPerPage]);

  return {
    // State
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    canGoNext,
    canGoPrevious,
    paginationData,
    
    // Actions
    goToPage,
    changeItemsPerPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
  };
}