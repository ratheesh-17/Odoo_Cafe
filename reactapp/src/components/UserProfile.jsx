import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthForms.css';

function UserProfile() {
  const { user, signOut, updateProfile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      'LISTENER': '🎧',
      'PREMIUM_USER': '💎',
      'ARTIST': '🎤',
      'ADMIN': '🛠️'
    };
    return roleIcons[role] || '👤';
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'LISTENER': 'Listener',
      'PREMIUM_USER': 'Premium User',
      'ARTIST': 'Artist',
      'ADMIN': 'Admin'
    };
    return roleLabels[role] || 'User';
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    setIsDropdownOpen(false);
  };

  if (!user) return null;

  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      <button 
        className="profile-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="user-avatar">
          {getUserInitials(user.name)}
        </div>
        <span className="user-name">{user.name}</span>
        <span className="dropdown-arrow">
          {isDropdownOpen ? '▲' : '▼'}
        </span>
      </button>

      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <h4>{user.name}</h4>
            <p>{user.email}</p>
            <div className="user-role-badge" data-role={user.role}>
              {getRoleIcon(user.role)} {getRoleLabel(user.role)}
            </div>
          </div>

          {isEditingProfile ? (
            <div className="profile-edit-form">
              <form onSubmit={handleProfileUpdate}>
                {error && (
                  <div className="error-message">{error}</div>
                )}
                {success && (
                  <div className="success-message">{success}</div>
                )}
                
                <div className="input-group">
                  <label htmlFor="profile-name">Name</label>
                  <input
                    type="text"
                    id="profile-name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    type="email"
                    id="profile-email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="profile-form-actions">
                  <button 
                    type="submit" 
                    className="save-btn"
                    disabled={loading}
                  >
                    {loading ? '🔄' : '💾'} Save
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="profile-dropdown-menu">
              <button 
                className="profile-menu-item"
                onClick={() => setIsEditingProfile(true)}
              >
                <span>✏️</span>
                Edit Profile
              </button>
              
              <button 
                className="profile-menu-item"
                onClick={() => {
                  alert('Settings feature coming soon!');
                  setIsDropdownOpen(false);
                }}
              >
                <span>⚙️</span>
                Settings
              </button>
              
              <button 
                className="profile-menu-item danger"
                onClick={handleSignOut}
              >
                <span>🚪</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;