import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, tokenUtils } from '../services/auth-api';

// Initial auth state
const initialAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create auth context
const AuthContext = createContext();

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialAuthState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = tokenUtils.getToken();
        
        if (token && !tokenUtils.isTokenExpired(token)) {
          // Validate token with backend
          try {
            const profileResponse = await authAPI.getProfile();
            setAuthState({
              user: profileResponse.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (error) {
            console.warn('Token validation failed:', error.message);
            // Token is invalid, remove it
            tokenUtils.removeToken();
          }
        }
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  // Sign up function
  const signUp = async (userData) => {
    const { name, email, password, confirmPassword, role } = userData;

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      throw new Error('All fields are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!isValidPassword(password)) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      // Call backend API
      const response = await authAPI.signup({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        confirmPassword,
        role: role || 'LISTENER'
      });

      // Update auth state
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.user;
    } catch (error) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (credentials) => {
    const { email, password } = credentials;

    // Client-side validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    try {
      // Call backend API
      const response = await authAPI.login({
        email: email.toLowerCase().trim(),
        password
      });

      // Update auth state
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.user;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Call backend logout API
      await authAPI.logout();
    } catch (error) {
      console.warn('Backend logout error:', error.message);
    } finally {
      // Always update local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    if (!authState.isAuthenticated) {
      throw new Error('Must be logged in to update profile');
    }

    const { name, email } = updates;
    
    if (email && !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    try {
      // Call backend API
      const response = await authAPI.updateProfile({
        name: name?.trim(),
        email: email?.toLowerCase().trim()
      });

      // Update auth state
      setAuthState({
        ...authState,
        user: response.user,
      });

      return response.user;
    } catch (error) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    if (!authState.isAuthenticated) {
      throw new Error('Must be logged in to change password');
    }

    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new Error('All password fields are required');
    }

    if (!isValidPassword(newPassword)) {
      throw new Error('New password must be at least 6 characters long');
    }

    if (newPassword !== confirmNewPassword) {
      throw new Error('New passwords do not match');
    }

    try {
      // Call backend API
      await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });

      return true;
    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  };

  const value = {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}