import React, { useState, useEffect } from 'react';
import { 
  searchJioSaavnSongs, 
  searchJioSaavnPlaylists, 
  formatJioSaavnSong, 
  formatJioSaavnPlaylist,
  getTrendingSearches 
} from '../services/jiosaavn-api';
import './JioSaavnExplorer.css';

// JioSaavn Song Card Component
function JioSaavnSongCard({ song, onAddToLocal }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  
  const handleAddToLocal = () => {
    const localSong = {
      title: song.songTitle,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      duration: song.duration,
      audioUrl: song.downloadUrl || song.previewUrl || ""
    };
    onAddToLocal(localSong);
  };
  
  const handlePlayPause = () => {
    if (!song.hasAudio && !song.downloadUrl && !song.previewUrl) {
      alert('🚫 Audio preview not available for this song. You can still add it to your collection and listen on JioSaavn!');
      return;
    }
    
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio) {
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Resume play failed:', error);
          alert('⚠️ Unable to resume playback. Try clicking play again.');
          setIsPlaying(false);
        });
      } else {
        // Create new audio instance
        const audioUrl = song.downloadUrl || song.previewUrl;
        if (!audioUrl) {
          alert('🚫 Audio URL not available for this song.');
          return;
        }
        
        const newAudio = new Audio(audioUrl);
        
        // Set up event listeners
        newAudio.addEventListener('ended', () => {
          setIsPlaying(false);
        });
        
        newAudio.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          alert('⚠️ Unable to play this song. The audio source may be restricted or unavailable.');
          setIsPlaying(false);
        });
        
        newAudio.addEventListener('loadstart', () => {
          console.log('Audio loading started...');
        });
        
        // Try to play
        newAudio.play().then(() => {
          setIsPlaying(true);
          setAudio(newAudio);
          console.log('Audio playback started successfully');
        }).catch((error) => {
          console.error('Play failed:', error);
          if (error.name === 'NotAllowedError') {
            alert('🔇 Playback blocked by browser. Please interact with the page first, then try again.');
          } else if (error.name === 'NotSupportedError') {
            alert('⚠️ Audio format not supported by your browser.');
          } else {
            alert('⚠️ Unable to play this song. The audio may be restricted or unavailable.');
          }
          setIsPlaying(false);
        });
      }
    }
  };
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="jiosaavn-song-card">
      <div className="song-image-container">
        {song.image && (
          <img 
            src={song.image} 
            alt={song.songTitle}
            className="song-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="song-overlay">
          <button 
            className={`play-btn ${isPlaying ? 'playing' : ''} ${!song.hasAudio ? 'no-audio' : ''}`}
            onClick={handlePlayPause}
            title={
              !song.hasAudio 
                ? 'Audio preview not available' 
                : isPlaying 
                  ? 'Pause Preview' 
                  : 'Play Preview'
            }
          >
            {!song.hasAudio ? '🚫' : isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>
      
      <div className="song-info">
        <h3 className="song-title" title={song.songTitle}>
          {song.songTitle}
        </h3>
        <p className="song-artist" title={song.artist}>
          🎤 {song.artist}
        </p>
        <p className="song-album" title={song.album}>
          💿 {song.album}
        </p>
        <div className="song-details">
          <span className="song-duration">
            ⏱️ {formatDuration(song.duration)}
          </span>
          {song.year && (
            <span className="song-year">
              📅 {song.year}
            </span>
          )}
          {song.playCount && (
            <span className="song-plays">
              📊 {song.playCount.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="song-actions">
          <button 
            className="add-to-local-btn"
            onClick={handleAddToLocal}
            title="Add to your collection"
          >
            ➕ Add to My Songs
          </button>
          {song.url && (
            <a 
              href={song.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="jiosaavn-link"
              title="Open in JioSaavn"
            >
              🎵 JioSaavn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// JioSaavn Playlist Card Component
function JioSaavnPlaylistCard({ playlist }) {
  return (
    <div className="jiosaavn-playlist-card">
      <div className="playlist-image-container">
        {playlist.image && (
          <img 
            src={playlist.image} 
            alt={playlist.name}
            className="playlist-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="playlist-overlay">
          <span className="song-count">
            {playlist.songCount} songs
          </span>
        </div>
      </div>
      
      <div className="playlist-info">
        <h3 className="playlist-title" title={playlist.name}>
          {playlist.name}
        </h3>
        <div className="playlist-details">
          <span className="playlist-language">
            🌐 {playlist.language}
          </span>
          <span className="playlist-songs">
            🎵 {playlist.songCount} tracks
          </span>
        </div>
        
        <div className="playlist-actions">
          {playlist.url && (
            <a 
              href={playlist.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="jiosaavn-link"
              title="Open playlist in JioSaavn"
            >
              🎵 Open Playlist
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Main JioSaavn Explorer Component
function JioSaavnExplorer({ onAddSong }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('songs');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const trendingSearches = getTrendingSearches();
  
  useEffect(() => {
    // Load some initial content
    handleTrendingSearch('bollywood hits');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearch = async (query = searchQuery, page = 0, append = false) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let data;
      const limit = 12;
      
      if (searchType === 'songs') {
        data = await searchJioSaavnSongs(query, page, limit);
        const formattedResults = data.results.map(formatJioSaavnSong);
        setSearchResults(append ? prev => [...prev, ...formattedResults] : formattedResults);
      } else if (searchType === 'playlists') {
        data = await searchJioSaavnPlaylists(query, page, limit);
        const formattedResults = data.results.map(formatJioSaavnPlaylist);
        setSearchResults(append ? prev => [...prev, ...formattedResults] : formattedResults);
      }
      
      setHasMore(data.results.length === limit);
      setCurrentPage(page);
    } catch (err) {
      setError(`Failed to search JioSaavn: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTrendingSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(0);
    handleSearch(query, 0, false);
  };
  
  const loadMore = () => {
    if (!loading && hasMore) {
      handleSearch(searchQuery, currentPage + 1, true);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    handleSearch(searchQuery, 0, false);
  };
  
  const handleAddToLocal = async (song) => {
    try {
      await onAddSong(song);
    } catch (error) {
      console.error('Failed to add song to local collection:', error);
    }
  };
  
  return (
    <div className="jiosaavn-explorer">
      <div className="jiosaavn-header">
        <h2>🎵 Music Explorer</h2>
        <p>Discover and add songs from various sources to your collection</p>
      </div>
      
      {/* Search Controls */}
      <div className="search-controls">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists, albums..."
              className="search-input"
            />
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-type-select"
            >
              <option value="songs">🎵 Songs</option>
              <option value="playlists">📋 Playlists</option>
            </select>
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? '🔄' : '🔍'} Search
            </button>
          </div>
        </form>
      </div>
      
      {/* Trending Searches */}
      <div className="trending-searches">
        <h3>🔥 Trending Searches</h3>
        <div className="trending-tags">
          {trendingSearches.slice(0, 10).map((trend, index) => (
            <button
              key={index}
              className="trending-tag"
              onClick={() => handleTrendingSearch(trend)}
            >
              {trend}
            </button>
          ))}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="jiosaavn-error">
          ❌ {error}
        </div>
      )}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>
            {searchType === 'songs' ? '🎵' : '📋'} 
            {searchType === 'songs' ? 'Songs' : 'Playlists'} 
            ({searchResults.length} results)
          </h3>
          
          <div className={`results-grid ${searchType}-grid`}>
            {searchResults.map((item, index) => (
              searchType === 'songs' ? (
                <JioSaavnSongCard 
                  key={`${item.id}_${index}`} 
                  song={item} 
                  onAddToLocal={handleAddToLocal}
                />
              ) : (
                <JioSaavnPlaylistCard 
                  key={`${item.id}_${index}`} 
                  playlist={item}
                />
              )
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="load-more-container">
              <button onClick={loadMore} className="load-more-btn">
                📥 Load More {searchType}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="jiosaavn-loading">
          <div className="loading-spinner">🎵</div>
          <p>Searching JioSaavn...</p>
        </div>
      )}
      
      {/* No Results */}
      {!loading && searchResults.length === 0 && searchQuery && (
        <div className="no-results">
          <h3>😔 No Results Found</h3>
          <p>Try searching for different terms or check your spelling.</p>
        </div>
      )}
    </div>
  );
}

export default JioSaavnExplorer;