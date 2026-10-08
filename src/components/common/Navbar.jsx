import React, { useState } from 'react';
import { Activity, LogOut, Menu, X, LayoutDashboard, UploadCloud, TrendingUp, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div
          className="brand-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNavClick(isAuthenticated ? 'dashboard' : 'home')}
        >
          <div className="logo-icon-wrap">
            <img src="/logo.png" alt="Vital Diary Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <span>Vital</span>
            <span className="highlight">Diary</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          {!isAuthenticated ? (
            <>
              <span
                className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                Overview
              </span>
              <span
                className={`nav-link ${activePage === 'features' ? 'active' : ''}`}
                onClick={() => {
                  handleNavClick('home');
                  setTimeout(() => {
                    const el = document.getElementById('features-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
              >
                Features
              </span>
              <span
                className={`nav-link ${activePage === 'security' ? 'active' : ''}`}
                onClick={() => {
                  handleNavClick('home');
                  setTimeout(() => {
                    const el = document.getElementById('security-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
              >
                Privacy & Security
              </span>
            </>
          ) : user?.role === 'doctor' ? (
            <>
              <span
                className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                Dashboard
              </span>
              <span
                className={`nav-link ${activePage === 'patients' ? 'active' : ''}`}
                onClick={() => handleNavClick('patients')}
              >
                Patients
              </span>
              <span
                className={`nav-link ${activePage === 'activity' ? 'active' : ''}`}
                onClick={() => handleNavClick('activity')}
              >
                Access Activity
              </span>
              <span
                className={`nav-link ${activePage === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('profile')}
              >
                Profile
              </span>
            </>
          ) : null}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {!isAuthenticated ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleNavClick('login')}
            >
              Sign In
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                className="user-profile-badge"
                title={`${user.name} (${user.role === 'doctor' ? 'Doctor' : 'Patient'})`}
              >
                <div className="user-avatar-circle">
                  {user.avatar || (user.name ? user.name[0].toUpperCase() : 'U')}
                </div>
                <div className="user-meta-wrap">
                  <span className="user-meta-name">{user.name}</span>
                  <span className="user-meta-role">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm logout-btn"
                onClick={() => {
                  logout();
                  handleNavClick('home');
                }}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'features' ? 'active' : ''}`}
                onClick={() => {
                  handleNavClick('home');
                  setTimeout(() => {
                    const el = document.getElementById('features-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Features
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'security' ? 'active' : ''}`}
                onClick={() => {
                  handleNavClick('home');
                  setTimeout(() => {
                    const el = document.getElementById('security-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Privacy & Security
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm mobile-auth-btn"
                onClick={() => handleNavClick('login')}
              >
                Sign In / Access Portal
              </button>
            </>
          ) : user?.role === 'doctor' ? (
            <>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'patients' ? 'active' : ''}`}
                onClick={() => handleNavClick('patients')}
              >
                <Users size={18} />
                <span>Patients</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'activity' ? 'active' : ''}`}
                onClick={() => handleNavClick('activity')}
              >
                <Activity size={18} />
                <span>Access Activity</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('profile')}
              >
                <ShieldCheck size={18} />
                <span>Doctor Profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'upload' ? 'active' : ''}`}
                onClick={() => handleNavClick('upload')}
              >
                <UploadCloud size={18} />
                <span>Upload Record</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'insights' ? 'active' : ''}`}
                onClick={() => handleNavClick('insights')}
              >
                <TrendingUp size={18} />
                <span>Get Insight</span>
              </button>
              <button
                type="button"
                className={`mobile-nav-item ${activePage === 'search' ? 'active' : ''}`}
                onClick={() => handleNavClick('search')}
              >
                <Search size={18} />
                <span>Search Records</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
