// JioSaavn API Service
const JIOSAAVN_BASE_URL = "https://jiosaavn-api.kishoresaravanan440.workers.dev/api";

// Helper function to handle API calls
async function jiosaavnApiCall(endpoint) {
  try {
    const response = await fetch(`${JIOSAAVN_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`JioSaavn API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('JioSaavn API returned error response');
    }
    
    return data.data;
  } catch (error) {
    console.error('JioSaavn API Error:', error);
    throw error;
  }
}

// Search for songs
export async function searchJioSaavnSongs(query, page = 0, limit = 12) {
  const endpoint = `/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  return await jiosaavnApiCall(endpoint);
}

// Search for playlists
export async function searchJioSaavnPlaylists(query, page = 0, limit = 12) {
  const endpoint = `/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  return await jiosaavnApiCall(endpoint);
}

// Search for albums
export async function searchJioSaavnAlbums(query, page = 0, limit = 12) {
  const endpoint = `/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  return await jiosaavnApiCall(endpoint);
}

// Search for artists
export async function searchJioSaavnArtists(query, page = 0, limit = 12) {
  const endpoint = `/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
  return await jiosaavnApiCall(endpoint);
}

// Global search (all categories)
export async function globalSearchJioSaavn(query) {
  const endpoint = `/search?query=${encodeURIComponent(query)}`;
  return await jiosaavnApiCall(endpoint);
}

// Get popular content by category
export async function getPopularContent() {
  // Since there's no direct popular endpoint, we'll search for popular terms
  const popularQueries = [
    'bollywood hits',
    'english hits',
    'punjabi hits',
    'tamil hits',
    'hindi songs'
  ];
  
  const results = {};
  
  for (const query of popularQueries.slice(0, 3)) { // Limit to 3 to avoid too many requests
    try {
      const data = await globalSearchJioSaavn(query);
      results[query] = data;
    } catch (error) {
      console.warn(`Failed to fetch popular content for ${query}:`, error);
    }
  }
  
  return results;
}

// Format JioSaavn song data to match local format
export function formatJioSaavnSong(jiosaavnSong) {
  // Try to get the best quality audio URL
  let audioUrl = null;
  if (jiosaavnSong.downloadUrl) {
    // Try different quality levels (highest to lowest)
    const qualityLevels = [4, 3, 2, 1, 0];
    for (const level of qualityLevels) {
      if (jiosaavnSong.downloadUrl[level]?.url) {
        audioUrl = jiosaavnSong.downloadUrl[level].url;
        break;
      }
    }
  }
  
  return {
    id: `jiosaavn_${jiosaavnSong.id}`,
    songTitle: jiosaavnSong.name,
    artist: jiosaavnSong.artists?.primary?.[0]?.name || 'Unknown Artist',
    album: jiosaavnSong.album?.name || 'Unknown Album',
    genre: jiosaavnSong.language || 'Unknown',
    duration: jiosaavnSong.duration || 0,
    image: jiosaavnSong.image?.[2]?.url || jiosaavnSong.image?.[1]?.url || jiosaavnSong.image?.[0]?.url,
    url: jiosaavnSong.url,
    downloadUrl: audioUrl,
    previewUrl: audioUrl, // Same as downloadUrl for now
    playCount: jiosaavnSong.playCount,
    year: jiosaavnSong.year,
    isJioSaavn: true,
    hasAudio: !!audioUrl,
    originalData: jiosaavnSong
  };
}

// Format JioSaavn playlist data
export function formatJioSaavnPlaylist(jiosaavnPlaylist) {
  return {
    id: `jiosaavn_playlist_${jiosaavnPlaylist.id}`,
    name: jiosaavnPlaylist.name,
    image: jiosaavnPlaylist.image?.[2]?.url || jiosaavnPlaylist.image?.[1]?.url || jiosaavnPlaylist.image?.[0]?.url,
    songCount: jiosaavnPlaylist.songCount,
    language: jiosaavnPlaylist.language,
    url: jiosaavnPlaylist.url,
    type: 'playlist',
    isJioSaavn: true,
    originalData: jiosaavnPlaylist
  };
}

// Get trending searches (predefined popular terms)
export function getTrendingSearches() {
  return [
    'Shape of You',
    'Believer',
    'Blinding Lights',
    'Watermelon Sugar',
    'Levitating',
    'Good 4 U',
    'Stay',
    'Industry Baby',
    'Heat Waves',
    'As It Was',
    'Bollywood',
    'Punjabi',
    'Tamil Songs',
    'Hindi Love Songs',
    'English Pop'
  ];
}

// Get sample playlists for display
export async function getSamplePlaylists() {
  const sampleQueries = [
    'bollywood',
    'english hits', 
    'punjabi',
    'romantic songs',
    'workout music'
  ];
  
  const playlists = [];
  
  for (const query of sampleQueries) {
    try {
      const data = await searchJioSaavnPlaylists(query, 0, 4);
      if (data.results && data.results.length > 0) {
        playlists.push(...data.results.map(formatJioSaavnPlaylist));
      }
    } catch (error) {
      console.warn(`Failed to fetch playlists for ${query}:`, error);
    }
  }
  
  return playlists.slice(0, 20); // Limit to 20 playlists
}

// Get sample songs for display
export async function getSampleSongs() {
  const sampleQueries = [
    'shape of you',
    'believer',
    'blinding lights',
    'watermelon sugar',
    'bollywood hits'
  ];
  
  const songs = [];
  
  for (const query of sampleQueries) {
    try {
      const data = await searchJioSaavnSongs(query, 0, 3);
      if (data.results && data.results.length > 0) {
        songs.push(...data.results.map(formatJioSaavnSong));
      }
    } catch (error) {
      console.warn(`Failed to fetch songs for ${query}:`, error);
    }
  }
  
  return songs.slice(0, 15); // Limit to 15 songs
}