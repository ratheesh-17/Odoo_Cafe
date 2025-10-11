const BASE_URL = "http://localhost:8080/api/admin";

// Token management utilities
const getAuthToken = () => localStorage.getItem('authToken');

// Create headers with auth token
const createHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

// Get all users
export async function getAllUsers() {
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: createHeaders()
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch users: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(id) {
  try {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: createHeaders()
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch user: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Update user status (enable/disable)
export async function updateUserStatus(id, enabled) {
  try {
    const res = await fetch(`${BASE_URL}/users/${id}/status`, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'omit',
      headers: createHeaders(),
      body: JSON.stringify({ enabled })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update user status: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

// Update user role
export async function updateUserRole(id, role) {
  try {
    const res = await fetch(`${BASE_URL}/users/${id}/role`, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'omit',
      headers: createHeaders(),
      body: JSON.stringify({ role })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update user role: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// Get pending songs for moderation
export async function getPendingSongs() {
  try {
    const res = await fetch(`${BASE_URL}/songs/pending`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: createHeaders()
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch pending songs: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching pending songs:', error);
    throw error;
  }
}

// Get admin dashboard statistics
export async function getDashboardStats() {
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: createHeaders()
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch dashboard stats: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}