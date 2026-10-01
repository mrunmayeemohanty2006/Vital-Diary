import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  TrendingUp,
  Search,
  Database,
  Shield,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';
import { useRecords } from '../../context/RecordsContext';
import { isSupabaseConfigured } from '../../services/supabase';

export default function Sidebar({ activeTab, setActiveTab, onOpenSupabaseModal }) {
  const { records } = useRecords();
  const supabaseConnected = isSupabaseConfigured();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'upload',
      label: 'Upload Record',
      icon: UploadCloud,
      badge: 'New',
    },
    {
      id: 'insights',
      label: 'Get Insights',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'search',
      label: 'Search Records',
      icon: Search,
      badge: records.length ? `${records.length}` : null,
    },
  ];

  return (
    <aside className="dashboard-sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ padding: '0 0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Patient Portal
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        {/* Security badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
          <Shield size={14} className="text-emerald" style={{ color: 'var(--color-primary)' }} />
          <span>AES-256 Encrypted Vault</span>
        </div>

        {/* Supabase Status button */}
        <button
          className="supabase-status-btn"
          onClick={onOpenSupabaseModal}
          title="Click to configure Supabase storage connection"
        >
          <span className={`status-dot ${supabaseConnected ? '' : 'offline'}`} />
          <span style={{ flex: 1 }}>
            {supabaseConnected ? 'Supabase Storage: Active' : 'Storage: Local Fallback'}
          </span>
          <Database size={13} />
        </button>
      </div>
    </aside>
  );
}
