// Direct URL to backend - no security restrictions
const BASE_URL = "http://localhost:8080/api/songs";

// Token management utilities
const getAuthToken = () => localStorage.getItem('authToken');

// Create headers with optional auth token
const createHeaders = (includeAuth = false) => {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Function to add a new song
export async function addSong(song) {
 console.log("Attempting to add song:", song);
 console.log("API URL:", `${BASE_URL}/addSong`);
 
 try {
  const res = await fetch(`${BASE_URL}/addSong`, {
   method: "POST",
   mode: 'cors',
   credentials: 'omit',
   headers: createHeaders(true), // Include auth token
   body: JSON.stringify(song),
  });
  
  console.log("Response status:", res.status);
  console.log("Response ok:", res.ok);
  
  if (!res.ok) {
   const errorText = await res.text();
   console.error("API Error:", errorText);
   throw new Error(`Add song failed: ${res.status} - ${errorText}`);
  }
  
  const result = await res.json();
  console.log("Song added successfully:", result);
  return result;
 } catch (error) {
  console.error("Network error:", error);
  throw error;
 }
}

// Function to retrieve all songs
export async function getAllSongs() {
 try {
  console.log('Fetching all songs from:', `${BASE_URL}/allSongs`);
  const res = await fetch(`${BASE_URL}/allSongs`, {
   method: 'GET',
   mode: 'cors',
   credentials: 'omit',
   headers: createHeaders(true) // Include auth token
  });
  
  if (!res.ok) {
   const errorText = await res.text();
   console.error('Fetch failed:', res.status, errorText);
   throw new Error(`Failed to fetch all songs: ${res.status}`);
  }
  
  const result = await res.json();
  console.log('Fetched songs:', result);
  return result;
 } catch (error) {
   console.error('Error in getAllSongs:', error);
  throw error;
 }
}

// Function to retrieve songs by genre
export async function getSongsByGenre(genre) {
 try {
  const res = await fetch(`${BASE_URL}/byGenre?genre=${encodeURIComponent(genre)}`, {
   method: 'GET',
   mode: 'cors',
   credentials: 'omit',
   headers: createHeaders(true) // Include auth token
  });
  if (!res.ok) throw new Error("Genre fetch failed");
  return await res.json();
 } catch (error) {
  console.error('Error in getSongsByGenre:', error);
  throw error;
 }
}

export async function getSongsSortedByArtist() {
 const res = await fetch(`${BASE_URL}/sortedByArtist`, {
  method: 'GET',
  mode: 'cors',
  credentials: 'omit',
  headers: createHeaders(true) // Include auth token
 });
 if (!res.ok) throw new Error("Sort fetch failed");
 return await res.json();
}

export async function deleteSong(id) {
 console.log(`Attempting to delete song with ID: ${id}`);
 console.log(`Delete URL: ${BASE_URL}/${id}`);
 
 try {
  const res = await fetch(`${BASE_URL}/${id}`, { 
   method: "DELETE",
   mode: 'cors',
   credentials: 'omit',
   headers: createHeaders(true) // Include auth token
  });
  
  console.log(`Delete response status: ${res.status}`);
  
  if (res.status === 404) {
   // Song already deleted or doesn't exist
   console.warn("Song not found for deletion");
   return { message: "Song not found - may have been already deleted" };
  }
  
  if (res.status === 403) {
   const errorText = await res.text();
   console.error("Permission denied for delete:", errorText);
   throw new Error(`Permission denied: You don't have permission to delete this song`);
  }
  
  if (!res.ok) {
   const errorText = await res.text();
   console.error(`Delete failed with status ${res.status}:`, errorText);
   throw new Error(`Delete failed: ${res.status} - ${errorText}`);
  }
  
  // For 204 No Content, return success message
  if (res.status === 204) {
   console.log("Song deleted successfully");
   return { message: "Song deleted successfully" };
  }
  
  return await res.json();
 } catch (error) {
  console.error("Error in deleteSong:", error);
  throw error;
 }
}
