import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserStatus, updateUserRole } from '../services/admin-api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response.users || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      'LISTENER': 'role-listener',
      'PREMIUM_USER': 'role-premium',
      'ARTIST': 'role-artist',
      'ADMIN': 'role-admin'
    };
    return roleClasses[role] || 'role-default';
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

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'ACTIVE' && user.enabled) ||
                         (filterStatus === 'INACTIVE' && !user.enabled);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>👥 User Management</h2>
        <p>Manage user accounts, roles, and permissions</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌</span>
          <span>{error}</span>
          <button onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="user-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">All Roles</option>
          <option value="LISTENER">Listeners</option>
          <option value="PREMIUM_USER">Premium Users</option>
          <option value="ARTIST">Artists</option>
          <option value="ADMIN">Admins</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button onClick={fetchUsers} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* User Statistics */}
      <div className="user-stats">
        <div className="stat-item">
          <span className="stat-value">{users.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{filteredUsers.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{users.filter(u => u.enabled).length}</span>
          <span className="stat-label">Active Users</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={!user.enabled ? 'user-disabled' : ''}>
                <td className="user-info">
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </td>
                <td>
                  <div className="role-container">
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {getRoleIcon(user.role)} {user.role.replace('_', ' ')}
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="role-select"
                    >
                      <option value="LISTENER">🎧 Listener</option>
                      <option value="PREMIUM_USER">💎 Premium User</option>
                      <option value="ARTIST">🎤 Artist</option>
                      <option value="ADMIN">🛠️ Admin</option>
                    </select>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${user.enabled ? 'status-active' : 'status-inactive'}`}>
                    {user.enabled ? '✅ Active' : '❌ Inactive'}
                  </span>
                </td>
                <td className="date-cell">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="date-cell">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleStatusToggle(user.id, user.enabled)}
                    className={`action-btn ${user.enabled ? 'btn-disable' : 'btn-enable'}`}
                    title={user.enabled ? 'Disable User' : 'Enable User'}
                  >
                    {user.enabled ? '🚫' : '✅'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;