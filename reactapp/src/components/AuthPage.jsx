import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'LISTENER',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isSignup && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (isSignup && formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (isSignup && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (isSignup && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      if (isSignup) {
        await signUp(formData);
      } else {
        await signIn({ email: formData.email, password: formData.password });
      }
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'LISTENER',
    });
    setErrors({});
  };

  return (
    <div className="auth-page">
      {/* Background Design */}
      <div className="auth-background">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-gradient-3"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-icon">🎼</span>
              <h1 className="logo-text">MusicHub</h1>
              <span className="logo-subtitle">Pro</span>
            </div>
            
            <div className="brand-description">
              <h2>Your Ultimate Music Experience</h2>
              <p>Discover, manage, and enjoy your favorite music all in one place. Connect with millions of songs and create your perfect playlist.</p>
              
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">🎵</span>
                  <span>Unlimited Music Library</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <span>JioSaavn Integration</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Advanced Analytics</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎨</span>
                  <span>Beautiful Interface</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-form">
              <div className="auth-header">
                <h2>{isSignup ? 'Join MusicHub' : 'Welcome Back'}</h2>
                <p>
                  {isSignup 
                    ? 'Create your account and start your music journey' 
                    : 'Sign in to continue your music experience'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form-fields">
                {errors.general && (
                  <div className="error-message general-error">
                    {errors.general}
                  </div>
                )}

                {isSignup && (
                  <div className="input-group">
                    <label htmlFor="name">Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                    </div>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>
                )}

                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? 'error' : ''}
                      placeholder={isSignup ? "Create a password (min 6 characters)" : "Enter your password"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                    />
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                {isSignup && (
                  <div className="input-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔐</span>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={errors.confirmPassword ? 'error' : ''}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                  </div>
                )}

                {isSignup && (
                  <div className="input-group">
                    <label htmlFor="role">Account Type</label>
                    <div className="custom-dropdown">
                      <div 
                        className="dropdown-trigger"
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      >
                        <span className="input-icon">🎭</span>
                        <div className="selected-role">
                          <span className="role-icon">
                            {{
                              'LISTENER': '🎧',
                              'PREMIUM_USER': '💎', 
                              'ARTIST': '🎤',
                              'ADMIN': '🛠️'
                            }[formData.role]}
                          </span>
                          <span className="role-text">
                            {{
                              'LISTENER': 'Listener',
                              'PREMIUM_USER': 'Premium User',
                              'ARTIST': 'Artist', 
                              'ADMIN': 'Admin'
                            }[formData.role]}
                          </span>
                        </div>
                        <span className={`dropdown-arrow ${isRoleDropdownOpen ? 'open' : ''}`}>▼</span>
                      </div>
                      
                      {isRoleDropdownOpen && (
                        <div className="dropdown-menu">
                          {[
                            { value: 'LISTENER', icon: '🎧', title: 'Listener', desc: 'Free music access' },
                            { value: 'PREMIUM_USER', icon: '💎', title: 'Premium User', desc: 'Ad-free experience' },
                            { value: 'ARTIST', icon: '🎤', title: 'Artist', desc: 'Upload and manage music' },
                            { value: 'ADMIN', icon: '🛠️', title: 'Admin', desc: 'Full system access' }
                          ].map((role) => (
                            <div
                              key={role.value}
                              className={`dropdown-item ${formData.role === role.value ? 'selected' : ''}`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, role: role.value }));
                                setIsRoleDropdownOpen(false);
                              }}
                            >
                              <div className="role-icon">{role.icon}</div>
                              <div className="role-info">
                                <div className="role-title">{role.title}</div>
                                <div className="role-desc">{role.desc}</div>
                              </div>
                              {formData.role === role.value && <span className="check-mark">✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner">🔄</span>
                      {isSignup ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      <span>{isSignup ? '✨' : '🚀'}</span>
                      {isSignup ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    type="button" 
                    className="switch-btn" 
                    onClick={switchMode}
                  >
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>

              {/* Demo Info */}
              <div className="demo-info">
                <h4>📝 Demo Information:</h4>
                <p>This is a demo app. Your data will be stored locally in your browser. Feel free to create an account with any email and password!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;