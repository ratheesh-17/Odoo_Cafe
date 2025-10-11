// Authentication API Service
const AUTH_BASE_URL = "http://localhost:8080/api/auth";

// Token management utilities
export const tokenUtils = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
};

// Create headers with auth token
const createAuthHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (includeAuth) {
    const token = tokenUtils.getToken();
    if (token && !tokenUtils.isTokenExpired(token)) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

// Authentication API functions
export const authAPI = {
  // User signup
  signup: async (userData) => {
    console.log("Attempting signup with:", { ...userData, password: '[HIDDEN]' });
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/signup`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(false),
        body: JSON.stringify(userData)
      });
      
      const result = await handleResponse(response);
      console.log("Signup successful:", { ...result, token: '[HIDDEN]' });
      
      // Store token if provided
      if (result.token) {
        tokenUtils.setToken(result.token);
      }
      
      return result;
    } catch (error) {
      console.error("Signup failed:", error.message);
      throw error;
    }
  },

  // User login
  login: async (credentials) => {
    console.log("Attempting login with email:", credentials.email);
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/login`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(false),
        body: JSON.stringify(credentials)
      });
      
      const result = await handleResponse(response);
      console.log("Login successful:", { ...result, token: '[HIDDEN]' });
      
      // Store token if provided
      if (result.token) {
        tokenUtils.setToken(result.token);
      }
      
      return result;
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    console.log("Fetching user profile...");
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/profile`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(true)
      });
      
      const result = await handleResponse(response);
      console.log("Profile fetched successfully");
      return result;
    } catch (error) {
      console.error("Failed to fetch profile:", error.message);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (updates) => {
    console.log("Updating user profile...");
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/profile`, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(true),
        body: JSON.stringify(updates)
      });
      
      const result = await handleResponse(response);
      console.log("Profile updated successfully");
      
      // Update token if provided
      if (result.token) {
        tokenUtils.setToken(result.token);
      }
      
      return result;
    } catch (error) {
      console.error("Failed to update profile:", error.message);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    console.log("Changing password...");
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/change-password`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(true),
        body: JSON.stringify(passwordData)
      });
      
      const result = await handleResponse(response);
      console.log("Password changed successfully");
      return result;
    } catch (error) {
      console.error("Failed to change password:", error.message);
      throw error;
    }
  },

  // Validate token
  validateToken: async () => {
    const token = tokenUtils.getToken();
    if (!token || tokenUtils.isTokenExpired(token)) {
      throw new Error('No valid token found');
    }
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/validate-token`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(true)
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error("Token validation failed:", error.message);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    console.log("Logging out...");
    
    try {
      // Call backend logout endpoint if token exists
      const token = tokenUtils.getToken();
      if (token && !tokenUtils.isTokenExpired(token)) {
        await fetch(`${AUTH_BASE_URL}/logout`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: createAuthHeaders(true)
        });
      }
    } catch (error) {
      console.warn("Backend logout failed, continuing with client-side logout:", error.message);
    } finally {
      // Always remove token from client
      tokenUtils.removeToken();
      console.log("Logout completed");
    }
  },

  // Delete account
  deleteAccount: async () => {
    console.log("Deleting account...");
    
    try {
      const response = await fetch(`${AUTH_BASE_URL}/account`, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'omit',
        headers: createAuthHeaders(true)
      });
      
      const result = await handleResponse(response);
      
      // Remove token after successful deletion
      tokenUtils.removeToken();
      
      console.log("Account deleted successfully");
      return result;
    } catch (error) {
      console.error("Failed to delete account:", error.message);
      throw error;
    }
  }
};

// Default export for backward compatibility
export default authAPI;