import React from "react";
import { useSongForm } from "../hooks/useSongHooks";

function SongFormImproved() {
  const {
    form,
    error,
    loading,
    handleChange,
    handleSubmit,
  } = useSongForm();

  return (
    <form className="song-form" onSubmit={handleSubmit}>
      <input
        name="songTitle"
        placeholder="Song Title"
        value={form.songTitle}
        onChange={handleChange}
        disabled={loading}
      />
      <input
        name="artist"
        placeholder="Artist"
        value={form.artist}
        onChange={handleChange}
        disabled={loading}
      />
      <input
        name="album"
        placeholder="Album"
        value={form.album}
        onChange={handleChange}
        disabled={loading}
      />
      <input
        name="genre"
        placeholder="Genre"
        value={form.genre}
        onChange={handleChange}
        disabled={loading}
      />
      <input
        name="duration"
        placeholder="Duration (seconds)"
        value={form.duration}
        onChange={handleChange}
        type="number"
        min="1"
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Song'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}

export default SongFormImproved;