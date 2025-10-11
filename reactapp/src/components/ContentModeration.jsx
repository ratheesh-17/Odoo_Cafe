import React, { useState, useEffect } from 'react';
import { getPendingSongs } from '../services/admin-api';
import { deleteSong } from '../services/api';

function ContentModeration() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('ALL');

  useEffect(() => {
    fetchPendingSongs();
  }, []);

  const fetchPendingSongs = async () => {
    try {
      setLoading(true);
      const response = await getPendingSongs();
      setSongs(response.songs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = async (songId, songTitle) => {
    if (window.confirm(`Are you sure you want to delete "${songTitle}"?`)) {
      try {
        await deleteSong(songId);
        await fetchPendingSongs(); // Refresh the list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getGenres = () => {
    const genres = [...new Set(songs.map(song => song.genre))];
    return genres.sort();
  };

  // Filter songs based on search and filters
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.album?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = filterGenre === 'ALL' || song.genre === filterGenre;
    
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div className="content-moderation-loading">
        <div className="loading-spinner"></div>
        <p>Loading content for moderation...</p>
      </div>
    );
  }

  return (
    <div className="content-moderation">
      <div className="content-moderation-header">
        <h2>🎵 Content Moderation</h2>
        <p>Review and manage platform content</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌</span>
          <span>{error}</span>
          <button onClick={fetchPendingSongs}>Retry</button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="content-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search songs by title, artist, or album..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <select
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">All Genres</option>
          {getGenres().map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>

        <button onClick={fetchPendingSongs} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Content Statistics */}
      <div className="content-stats">
        <div className="stat-item">
          <span className="stat-value">{songs.length}</span>
          <span className="stat-label">Total Songs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{filteredSongs.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{getGenres().length}</span>
          <span className="stat-label">Unique Genres</span>
        </div>
      </div>

      {/* Songs Grid */}
      <div className="songs-grid">
        {filteredSongs.map(song => (
          <div key={song.id} className="song-moderation-card">
            <div className="song-header">
              <h3 className="song-title">{song.title || song.songTitle}</h3>
              <div className="song-actions">
                <button
                  onClick={() => handleDeleteSong(song.id, song.title || song.songTitle)}
                  className="action-btn btn-delete"
                  title="Delete Song"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="song-details">
              <div className="detail-row">
                <span className="detail-label">Artist:</span>
                <span className="detail-value">{song.artist}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Album:</span>
                <span className="detail-value">{song.album || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Genre:</span>
                <span className="detail-value">
                  <span className="genre-badge">{song.genre}</span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{song.duration}s</span>
              </div>
              {song.audioUrl && (
                <div className="detail-row">
                  <span className="detail-label">Audio:</span>
                  <span className="detail-value">
                    <a 
                      href={song.audioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="audio-link"
                    >
                      🎵 Preview
                    </a>
                  </span>
                </div>
              )}
            </div>

            <div className="moderation-actions">
              <button className="mod-btn btn-approve" disabled>
                ✅ Approved
              </button>
              <button 
                onClick={() => handleDeleteSong(song.id, song.title || song.songTitle)}
                className="mod-btn btn-reject"
              >
                ❌ Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div className="no-content">
          <div className="no-content-icon">🎵</div>
          <h3>No Content Found</h3>
          <p>No songs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ContentModeration;