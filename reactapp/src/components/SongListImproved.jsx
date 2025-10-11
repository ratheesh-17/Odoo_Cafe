import React, { useState } from "react";
import { useSongOperations, usePagination } from "../hooks/useSongHooks";
import { UI_MESSAGES } from "../constants";

function SongListImproved() {
  const { songs, loading, handleDelete } = useSongOperations();
  const { totalItems } = usePagination();
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  
  const handlePlay = (song) => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
      setCurrentlyPlaying(null);
    }
    
    if (currentlyPlaying === song.id) {
      return;
    }
    
    if (song.audioUrl) {
      const audio = new Audio(song.audioUrl);
      
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setCurrentlyPlaying(null);
      });
      
      audio.addEventListener('error', () => {
        alert('⚠️ Unable to play this song.');
        setPlayingAudio(null);
        setCurrentlyPlaying(null);
      });
      
      audio.play().then(() => {
        setPlayingAudio(audio);
        setCurrentlyPlaying(song.id);
      }).catch(() => {
        alert('⚠️ Unable to play this song.');
      });
    } else {
      alert('🚫 No audio available for this song.');
    }
  };

  if (loading) {
    return <div className="loading-spinner">{UI_MESSAGES.LOADING}</div>;
  }

  if (totalItems === 0) {
    return <div className="no-songs">{UI_MESSAGES.NO_SONGS}</div>;
  }

  if (!songs || songs.length === 0) {
    return <div className="no-songs">No songs on this page. Try a different page or filter.</div>;
  }

  return (
    <div className="song-list">
      {songs.map((song) => (
        <div className="song-card" key={song.id}>
          <div className="song-info">
            <h2>{song.title || song.songTitle}</h2>
            <p><strong>Artist:</strong> {song.artist}</p>
            <p><strong>Album:</strong> {song.album || 'N/A'}</p>
            <p><strong>Genre:</strong> {song.genre}</p>
            <p><strong>Duration:</strong> {song.duration} seconds</p>
          </div>
          <div className="song-actions">
            <button 
              onClick={() => handlePlay(song)}
              className={`play-button ${currentlyPlaying === song.id ? 'playing' : ''}`}
              title={currentlyPlaying === song.id ? 'Stop' : 'Play'}
            >
              {currentlyPlaying === song.id ? '⏸️' : '▶️'}
            </button>
            <button 
              onClick={() => handleDelete(song.id)}
              className="delete-button"
              disabled={loading}
              title="Delete from collection"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SongListImproved;