import React, { useState } from 'react';
import './AuthPage.css';

// Artist-specific upload function
const artistUploadSong = async (songData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:8080/api/songs/artist/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(songData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Upload failed: ${response.status} - ${JSON.stringify(error)}`);
  }
  
  return await response.json();
};

function ArtistSongUpload({ onSongAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.artist || !formData.genre) {
      setError('Title, Artist, and Genre are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const songData = {
        ...formData,
        audioUrl: '', // No audio URL for manual entries
        imageUrl: '', // No image URL for manual entries
        source: 'ARTIST_UPLOAD'
      };

      await artistUploadSong(songData);
      setSuccess('Song added successfully!');
      setFormData({
        title: '',
        artist: '',
        album: '',
        genre: '',
        duration: ''
      });
      
      if (onSongAdded) onSongAdded();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add song');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div className="auth-header">
        <h2>🎤 Add New Song</h2>
        <p>Share your music with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-fields">
        {error && (
          <div className="error-message general-error">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="input-group">
          <label htmlFor="title">Song Title *</label>
          <div className="input-wrapper">
            <span className="input-icon">🎵</span>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter song title"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="artist">Artist Name *</label>
          <div className="input-wrapper">
            <span className="input-icon">🎤</span>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              placeholder="Enter artist name"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="album">Album</label>
          <div className="input-wrapper">
            <span className="input-icon">💿</span>
            <input
              type="text"
              id="album"
              name="album"
              value={formData.album}
              onChange={handleChange}
              placeholder="Enter album name (optional)"
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="genre">Genre *</label>
          <div className="input-wrapper">
            <span className="input-icon">🎼</span>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              placeholder="e.g., Pop, Rock, Jazz"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="duration">Duration</label>
          <div className="input-wrapper">
            <span className="input-icon">⏱️</span>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 3:45 (optional)"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner">🔄</span>
              Adding Song...
            </>
          ) : (
            <>
              <span>✨</span>
              Add Song
            </>
          )}
        </button>
      </form>

      <div className="demo-info">
        <h4>📝 Note:</h4>
        <p>Songs added here will be visible to all users in the music catalog. Only metadata is stored - no audio files are uploaded.</p>
      </div>
    </div>
  );
}

export default ArtistSongUpload;