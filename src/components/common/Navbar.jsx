import React from 'react';
import { Activity, ShieldCheck, User, LogOut, FileText, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';

export default function Navbar({ activePage, setActivePage, onOpenSupabaseModal }) {
  const { user, isAuthenticated, logout } = useAuth();
  const supabaseConnected = isSupabaseConfigured();

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div
          className="brand-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'home')}
        >
          <div className="logo-icon-wrap">
            <Activity size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <span>Vital</span>
            <span className="highlight">Diary</span>
            <span className="brand-badge">Health</span>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <nav className="nav-links">
          {!isAuthenticated ? (
            <>
              <span
                className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => setActivePage('home')}
              >
                Overview
              </span>
              <span
                className={`nav-link ${activePage === 'features' ? 'active' : ''}`}
                onClick={() => {
                  setActivePage('home');
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
                  setActivePage('home');
                  setTimeout(() => {
                    const el = document.getElementById('security-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
              >
                Privacy & Security
              </span>
            </>
          ) : (
            <>
              <span
                className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('dashboard')}
              >
                Dashboard
              </span>
              <span
                className={`nav-link ${activePage === 'upload' ? 'active' : ''}`}
                onClick={() => setActivePage('upload')}
              >
                Upload Record
              </span>
              <span
                className={`nav-link ${activePage === 'insights' ? 'active' : ''}`}
                onClick={() => setActivePage('insights')}
              >
                Insights
              </span>
              <span
                className={`nav-link ${activePage === 'search' ? 'active' : ''}`}
                onClick={() => setActivePage('search')}
              >
                Search Records
              </span>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Supabase Status indicator button */}
          <button
            onClick={onOpenSupabaseModal}
            className="btn btn-outline btn-sm"
            title="Supabase Storage & Database Settings"
            style={{ fontSize: '0.78rem', gap: '0.4rem' }}
          >
            <Database size={14} className={supabaseConnected ? 'text-emerald' : ''} />
            <span>{supabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: supabaseConnected ? 'var(--color-success)' : '#f59e0b',
                display: 'inline-block',
              }}
            />
          </button>

          {!isAuthenticated ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActivePage('login')}
            >
              Sign In / Access
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                className="user-profile-badge"
                title={`${user.name} (${user.role === 'doctor' ? 'Doctor' : 'Patient'})`}
              >
                <div className="user-avatar-circle">
                  {user.avatar || (user.name ? user.name[0].toUpperCase() : 'U')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="user-meta-name">{user.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-dark)', textTransform: 'capitalize' }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  logout();
                  setActivePage('home');
                }}
                title="Sign Out"
                style={{ padding: '0.4rem 0.65rem' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
