import React, { useState, useCallback, useEffect } from "react";
import { SongProvider, useSongs } from "./context/SongContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./components/AuthPage";
import UserProfile from "./components/UserProfile";
import SongListImproved from "./components/SongListImproved";
import Pagination from "./components/Pagination";
import JioSaavnExplorer from './components/JioSaavnExplorer';
import ArtistSongUpload from './components/ArtistSongUpload';
import AdminDashboard from './components/AdminDashboard';
import './components/AdminDashboard.css';
import { 
  getUniqueValues,
  getDurationStats,
  formatDuration,
  createFilterSummary,
  debounce
} from "./utils/filtering";
import { 
  generatePageNumbers
} from "./utils/pagination";
import { 
  SORT_OPTIONS, 
  UI_MESSAGES, 
  SEARCH_CONFIG 
} from "./constants";
import "./App.css";

// Modern Navigation Component
function ModernNavbar({ viewMode, setViewMode, showAdvancedFeatures, setShowAdvancedFeatures }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const baseNavItems = [
    { id: 'jiosaavn', label: 'Music Hub', icon: '🎵', color: '#10b981' },
    { id: 'advanced', label: 'My Collection', icon: '📚', color: '#6366f1' },
    { 
      id: 'statistics', 
      label: user?.role === 'PREMIUM_USER' || user?.role === 'ARTIST' || user?.role === 'ADMIN' 
        ? 'Analytics' 
        : 'Analytics 🔒', 
      icon: '📊', 
      color: '#ef4444',
      premium: user?.role !== 'PREMIUM_USER' && user?.role !== 'ARTIST' && user?.role !== 'ADMIN'
    },
  ];
  
  // Add admin dashboard for admin users
  if (user?.role === 'ADMIN') {
    baseNavItems.push({
      id: 'admin',
      label: 'Admin Dashboard',
      icon: '🛠️',
      color: '#8b5cf6'
    });
  }
  
  const navItems = user?.role === 'ARTIST' 
    ? [...baseNavItems, { id: 'upload', label: 'Upload Song', icon: '🎤', color: '#f59e0b' }]
    : baseNavItems;
  
  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        {/* Brand/Logo */}
        <div className="navbar-brand">
          <div className="brand-icon">🎼</div>
          <div className="brand-text">
            <span className="brand-name">MusicHub</span>
            <span className="brand-subtitle">Pro</span>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`nav-item ${viewMode === item.id ? 'active' : ''}`}
              style={{ '--item-color': item.color }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <UserProfile />
              <button
                onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                className={`action-btn ${showAdvancedFeatures ? 'active' : ''}`}
                title="Toggle Advanced Features"
              >
                <span>⚙️</span>
              </button>
            </>
          ) : (
            !isLoading && (
              <>
                <button
                  onClick={() => setViewMode('auth')}
                  className="action-btn login-btn"
                  title="Sign In / Sign Up"
                >
                  <span>🔐</span>
                  <span className="btn-text">Account</span>
                </button>
              </>
            )
          )}
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mobile-menu-toggle"
          >
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
      

      
      {/* Mobile Navigation */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setViewMode(item.id);
              setIsMenuOpen(false);
            }}
            className={`mobile-nav-item ${viewMode === item.id ? 'active' : ''}`}
            style={{ '--item-color': item.color }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Advanced Statistics Component
function SongStatistics() {
  const { allSongs, filteredSongs, activeFilters } = useSongs();
  
  const stats = getDurationStats(filteredSongs);
  const totalSongs = allSongs.length;
  const filteredCount = filteredSongs.length;
  const uniqueArtists = getUniqueValues(filteredSongs, 'artist');
  const uniqueGenres = getUniqueValues(filteredSongs, 'genre');
  
  return (
    <div className="song-statistics">
      <h3>📊 Collection Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{totalSongs}</span>
          <span className="stat-label">Total Songs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{filteredCount}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{uniqueArtists.length}</span>
          <span className="stat-label">Unique Artists</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{uniqueGenres.length}</span>
          <span className="stat-label">Genres</span>
        </div>
        {stats.total > 0 && (
          <>
            <div className="stat-item">
              <span className="stat-value">{formatDuration(stats.average)}</span>
              <span className="stat-label">Avg Duration</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatDuration(stats.total)}</span>
              <span className="stat-label">Total Duration</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Advanced Filter Controls Component
function AdvancedFilters() {
  const { 
    activeFilters, 
    allSongs, 
    applyFilters, 
    clearAllFilters,
    setSortOrder,
    sortOrder 
  } = useSongs();
  
  const [localFilters, setLocalFilters] = useState(activeFilters);
  const [durationRange, setDurationRange] = useState({
    min: activeFilters.minDuration || '',
    max: activeFilters.maxDuration || ''
  });
  
  const uniqueArtists = getUniqueValues(allSongs, 'artist');
  
  // Debounced filter application
  const debouncedApplyFilters = useCallback(
    debounce((filters) => {
      applyFilters(filters);
    }, SEARCH_CONFIG.SEARCH_DEBOUNCE_MS),
    [applyFilters]
  );
  
  const handleDurationChange = (type, value) => {
    const newDurationRange = { ...durationRange, [type]: value };
    setDurationRange(newDurationRange);
    
    const newFilters = {
      ...localFilters,
      minDuration: newDurationRange.min ? parseInt(newDurationRange.min) : null,
      maxDuration: newDurationRange.max ? parseInt(newDurationRange.max) : null,
    };
    
    setLocalFilters(newFilters);
    debouncedApplyFilters(newFilters);
  };
  
  const handleArtistSelection = (artist) => {
    const currentArtists = localFilters.artists || [];
    const newArtists = currentArtists.includes(artist)
      ? currentArtists.filter(a => a !== artist)
      : [...currentArtists, artist];
    
    const newFilters = { ...localFilters, artists: newArtists };
    setLocalFilters(newFilters);
    applyFilters(newFilters);
  };
  
  const resetAdvancedFilters = () => {
    setDurationRange({ min: '', max: '' });
    setLocalFilters({
      genre: 'all',
      searchQuery: '',
      minDuration: null,
      maxDuration: null,
      artists: [],
    });
    clearAllFilters();
  };
  
  return (
    <div className="advanced-filters">
      <h4>🔧 Advanced Filters</h4>
      
      {/* Duration Range */}
      <div className="filter-section">
        <label>Duration Range (seconds):</label>
        <div className="duration-inputs">
          <input
            type="number"
            placeholder="Min"
            value={durationRange.min}
            onChange={(e) => handleDurationChange('min', e.target.value)}
            min="0"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={durationRange.max}
            onChange={(e) => handleDurationChange('max', e.target.value)}
            min="0"
          />
        </div>
      </div>
      
      {/* Artist Multi-Select */}
      {uniqueArtists.length > 0 && (
        <div className="filter-section">
          <label>Artists ({localFilters.artists?.length || 0} selected):</label>
          <div className="artist-checkboxes">
            {uniqueArtists.slice(0, 10).map(artist => (
              <label key={artist} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={(localFilters.artists || []).includes(artist)}
                  onChange={() => handleArtistSelection(artist)}
                />
                {artist}
              </label>
            ))}
            {uniqueArtists.length > 10 && (
              <span className="more-artists">... and {uniqueArtists.length - 10} more</span>
            )}
          </div>
        </div>
      )}
      
      {/* Sort Options */}
      <div className="filter-section">
        <label>Sort Order:</label>
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          className="sort-select-advanced"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <button onClick={resetAdvancedFilters} className="reset-filters-btn">
        🗑️ Reset All Filters
      </button>
    </div>
  );
}

// Main App Component with All Functions
function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [viewMode, setViewMode] = useState('jiosaavn'); // 'advanced', 'statistics', 'jiosaavn'
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  
  // Get all context functions and state
  const {
    songs,
    allSongs,
    filteredSongs,
    loading,
    error,
    message,
    currentPage,
    totalItems,
    paginationData,
    activeFilters,
    // Core functions
    fetchSongs,
    addNewSong,
    clearMessage,
    // Pagination functions
    goToFirstPage,
    goToLastPage,
    // Filtering and sorting functions
    applyFilters,
    clearAllFilters,
  } = useSongs();
  
  // Utility function demonstrations
  const handleBulkOperations = useCallback(() => {
    console.log('🎵 All Songs:', allSongs);
    console.log('🔍 Filtered Songs:', filteredSongs);
    console.log('📄 Current Page Songs:', songs);
    console.log('📊 Duration Stats:', getDurationStats(filteredSongs));
    console.log('🏷️ Unique Artists:', getUniqueValues(allSongs, 'artist'));
    console.log('🎼 Unique Genres:', getUniqueValues(allSongs, 'genre'));
    console.log('📝 Filter Summary:', createFilterSummary(activeFilters, totalItems));
    console.log('📖 Page Numbers:', generatePageNumbers(currentPage, paginationData?.totalPages || 0));
  }, [allSongs, filteredSongs, songs, activeFilters, totalItems, currentPage, paginationData]);
  
  // Demo function to showcase all API functions
  const demonstrateAllFunctions = useCallback(async () => {
    console.log('🚀 Demonstrating all available functions...');
    
    // API Functions
    console.log('📡 API Functions Available:');
    console.log('- getAllSongs()');
    console.log('- addSong(song)');
    console.log('- getSongsByGenre(genre)');
    console.log('- getSongsSortedByArtist()');
    console.log('- deleteSong(id)');
    
    // Context Functions
    console.log('🔄 Context Functions Available:');
    console.log('- fetchSongs(), addNewSong(), removeSong()');
    console.log('- setFilter(), clearMessage()');
    console.log('- Pagination: setCurrentPage(), goToNextPage(), etc.');
    console.log('- Filtering: setSortOrder(), applyFilters(), clearAllFilters()');
    
    // Utility Functions
    console.log('🛠️ Utility Functions Available:');
    console.log('- applySongFilters(), applySongSort()');
    console.log('- getUniqueValues(), getDurationStats()');
    console.log('- formatDuration(), createFilterSummary()');
    console.log('- calculatePagination(), generatePageNumbers()');
    
    // Hook Functions
    console.log('🎣 Custom Hooks Available:');
    console.log('- useSongForm(), useFilters()');
    console.log('- useSongOperations(), usePagination()');
    
    handleBulkOperations();
  }, [handleBulkOperations]);
  
  // Auto-demonstrate functions on mount
  useEffect(() => {
    const timer = setTimeout(demonstrateAllFunctions, 2000);
    return () => clearTimeout(timer);
  }, [demonstrateAllFunctions]);
  
  // Show auth page if not authenticated and not loading
  if (!isLoading && !isAuthenticated) {
    return <AuthPage />;
  }
  
  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="loading-content">
          <div className="loading-logo">
            <span className="logo-icon">🎼</span>
            <h1>MusicHub</h1>
          </div>
          <div className="loading-spinner-container">
            <div className="loading-spinner-auth"></div>
            <p>Loading your music experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${user?.role === 'PREMIUM_USER' ? 'premium-theme' : ''}`}>
      {/* Modern Navigation */}
      <ModernNavbar 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        showAdvancedFeatures={showAdvancedFeatures}
        setShowAdvancedFeatures={setShowAdvancedFeatures}
      />
      
      {/* Main Content Container */}
      <div className="app-container">
      
      {/* Global Status Messages */}
      {message && (
        <div className="global-message success">
          ✅ {message}
          <button onClick={clearMessage} className="close-btn">×</button>
        </div>
      )}
      
      {error && (
        <div className="global-message error">
          ❌ {error}
          <button onClick={clearMessage} className="close-btn">×</button>
        </div>
      )}
      
      {loading && (
        <div className="global-loading">
          🔄 {UI_MESSAGES.LOADING}
        </div>
      )}
      
      {/* Main Content Based on View Mode */}
      

      
      {viewMode === 'jiosaavn' && <JioSaavnExplorer onAddSong={addNewSong} />}
      
      {viewMode === 'upload' && (
        <div className="upload-view">
          <ArtistSongUpload onSongAdded={() => fetchSongs('all')} />
        </div>
      )}
      
      {viewMode === 'admin' && user?.role === 'ADMIN' && (
        <div className="admin-view">
          <AdminDashboard />
        </div>
      )}
      
      {viewMode === 'advanced' && (
        <div className="collection-view">
          <div className="collection-header">
            <h2>📚 My Music Collection</h2>
            <p>Manage and organize your saved songs</p>
          </div>
          <div className="collection-grid">
            <div className="collection-filters">
              <AdvancedFilters />
            </div>
            <div className="collection-content">
              <SongListImproved />
              <Pagination />
            </div>
          </div>
        </div>
      )}
      
      {viewMode === 'statistics' && (
        <div className="statistics-view">
          {user?.role === 'PREMIUM_USER' || user?.role === 'ARTIST' || user?.role === 'ADMIN' ? (
            <>
              <SongStatistics />
              <div className="filter-summary">
                <h3>🔍 Current Filters</h3>
                <p>{createFilterSummary(activeFilters, totalItems)}</p>
              </div>
              <SongListImproved />
            </>
          ) : (
            <div className="premium-gate">
              <div className="premium-gate-content">
                <div className="premium-gate-icon">📊</div>
                <h2>Premium Analytics</h2>
                <p>Unlock detailed music analytics and insights with Premium!</p>
                <div className="premium-features">
                  <div className="premium-feature">
                    <span className="feature-icon">📈</span>
                    <span>Detailed listening statistics</span>
                  </div>
                  <div className="premium-feature">
                    <span className="feature-icon">🎵</span>
                    <span>Top artists and genres</span>
                  </div>
                  <div className="premium-feature">
                    <span className="feature-icon">⏱️</span>
                    <span>Listening time tracking</span>
                  </div>
                  <div className="premium-feature">
                    <span className="feature-icon">📉</span>
                    <span>Music discovery insights</span>
                  </div>
                </div>
                <button className="upgrade-btn" onClick={() => alert('Upgrade to Premium feature coming soon!')}>
                  <span>💎</span>
                  Upgrade to Premium
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Advanced Features Panel */}
      {showAdvancedFeatures && (
        <div className="advanced-features-panel">
          <h3>🚀 Advanced Features & Functions</h3>
          <div className="feature-buttons">
            <button onClick={demonstrateAllFunctions}>
              📝 Log All Functions
            </button>
            <button onClick={handleBulkOperations}>
              🔍 Show Current Data
            </button>
            <button onClick={() => fetchSongs('all')}>
              🔄 Refresh All Songs
            </button>
            <button onClick={() => fetchSongs('sorted')}>
              📊 Fetch Sorted by Artist
            </button>
            <button onClick={clearAllFilters}>
              🗑️ Clear All Filters
            </button>
            <button onClick={goToFirstPage}>
              ⏮️ First Page
            </button>
            <button onClick={goToLastPage}>
              ⏭️ Last Page
            </button>

            <button onClick={() => setViewMode('jiosaavn')}>
              🔍 Music Explorer
            </button>
          </div>
          
          <div className="function-showcase">
            <h4>🎯 Available Functions:</h4>
            <div className="function-categories">
              <div className="function-category">
                <h5>📡 API Services</h5>
                <ul>
                  <li>getAllSongs() - Fetch all songs</li>
                  <li>addSong(song) - Add new song</li>
                  <li>getSongsByGenre(genre) - Filter by genre</li>
                  <li>getSongsSortedByArtist() - Get sorted songs</li>
                  <li>deleteSong(id) - Delete song by ID</li>
                </ul>
              </div>
              
              <div className="function-category">
                <h5>🔄 Context Actions</h5>
                <ul>
                  <li>fetchSongs() - Refresh song list</li>
                  <li>addNewSong() - Add song with validation</li>
                  <li>removeSong() - Delete with confirmation</li>
                  <li>setFilter() - Change filter</li>
                  <li>clearMessage() - Clear notifications</li>
                </ul>
              </div>
              
              <div className="function-category">
                <h5>📄 Pagination</h5>
                <ul>
                  <li>setCurrentPage() - Navigate to page</li>
                  <li>setItemsPerPage() - Change page size</li>
                  <li>goToNextPage() - Next page</li>
                  <li>goToPreviousPage() - Previous page</li>
                  <li>goToFirstPage() - First page</li>
                  <li>goToLastPage() - Last page</li>
                </ul>
              </div>
              
              <div className="function-category">
                <h5>🔍 Filtering & Sorting</h5>
                <ul>
                  <li>setSortOrder() - Change sort criteria</li>
                  <li>setSearchQuery() - Set search text</li>
                  <li>applyFilters() - Apply filter set</li>
                  <li>clearAllFilters() - Reset all filters</li>
                  <li>applySongFilters() - Filter utility</li>
                  <li>applySongSort() - Sort utility</li>
                </ul>
              </div>
              
              <div className="function-category">
                <h5>🛠️ Utilities</h5>
                <ul>
                  <li>getUniqueValues() - Extract unique field values</li>
                  <li>getDurationStats() - Calculate duration statistics</li>
                  <li>formatDuration() - Format seconds to readable time</li>
                  <li>createFilterSummary() - Generate filter description</li>
                  <li>calculatePagination() - Pagination calculations</li>
                  <li>generatePageNumbers() - Page number array</li>
                  <li>debounce() - Debounce function calls</li>
                </ul>
              </div>
              
              <div className="function-category">
                <h5>🎵 Music Integration</h5>
                <ul>
                  <li>searchJioSaavnSongs() - Search JioSaavn songs</li>
                  <li>searchJioSaavnPlaylists() - Search JioSaavn playlists</li>
                  <li>globalSearchJioSaavn() - Search all categories</li>
                  <li>getSamplePlaylists() - Get featured playlists</li>
                  <li>getSampleSongs() - Get trending songs</li>
                  <li>formatJioSaavnSong() - Format JioSaavn data</li>
                  <li>getTrendingSearches() - Popular search terms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer with Quick Stats */}
      <footer className="app-footer">
        <div className="quick-stats">
          <span>📚 Total: {allSongs.length}</span>
          <span>🔍 Filtered: {filteredSongs.length}</span>
          <span>📄 Current Page: {songs.length}</span>
          <span>📖 Page {currentPage} of {paginationData?.totalPages || 0}</span>
        </div>
      </footer>
      
      </div> {/* Close app-container */}
    </div>
  );
}

// Main App Wrapper
function App() {
  return (
    <AuthProvider>
      <SongProvider>
        <AppContent />
      </SongProvider>
    </AuthProvider>
  );
}

export default App;