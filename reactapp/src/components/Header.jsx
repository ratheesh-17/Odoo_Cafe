import React from "react";
import { getAllSongs } from "../services/api";

function Header() {
  const testConnection = async () => {
    try {
      console.log("Testing API connection...");
      const songs = await getAllSongs();
      alert(`✅ API Connection successful! Found ${songs.length} songs.`);
    } catch (error) {
      console.error("API test failed:", error);
      alert(`❌ API Connection failed: ${error.message}`);
    }
  };

  return (
    <header>
      <h1>Spotify Playlist Manager</h1>
      <p>Manage your favorite tracks with ease!</p>
      <button 
        onClick={testConnection}
        style={{
          margin: '10px',
          padding: '8px 16px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test API Connection
      </button>
    </header>
  );
}

export default Header;