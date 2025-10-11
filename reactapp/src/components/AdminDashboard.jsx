import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/admin-api';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      setStats(response);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'content', label: 'Content Moderation', icon: '🎵' }
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛠️ Admin Dashboard</h1>
        <p>Manage users, content, and platform settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="admin-error">
          <span>❌</span>
          <span>{error}</span>
          <button onClick={fetchDashboardStats}>Retry</button>
        </div>
      )}

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <h2>Platform Overview</h2>
            
            {stats && (
              <>
                {/* User Statistics */}
                <div className="stats-section">
                  <h3>👥 User Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{stats.userStats.totalUsers}</div>
                      <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.userStats.activeUsers}</div>
                      <div className="stat-label">Active Users</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.userStats.premiumUsers}</div>
                      <div className="stat-label">Premium Users</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.userStats.artists}</div>
                      <div className="stat-label">Artists</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.userStats.admins}</div>
                      <div className="stat-label">Admins</div>
                    </div>
                  </div>
                </div>

                {/* Content Statistics */}
                <div className="stats-section">
                  <h3>🎵 Content Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{stats.contentStats.totalSongs}</div>
                      <div className="stat-label">Total Songs</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.contentStats.recentSongs}</div>
                      <div className="stat-label">Recent Uploads</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('users')} className="action-btn">
                  <span>👥</span>
                  Manage Users
                </button>
                <button onClick={() => setActiveTab('content')} className="action-btn">
                  <span>🎵</span>
                  Review Content
                </button>
                <button onClick={fetchDashboardStats} className="action-btn">
                  <span>🔄</span>
                  Refresh Stats
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'content' && <ContentModeration />}
      </div>
    </div>
  );
}

export default AdminDashboard;