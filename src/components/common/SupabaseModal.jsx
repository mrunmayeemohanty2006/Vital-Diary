import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Key,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
} from '../../services/supabase';

export default function SupabaseModal({ isOpen, onClose }) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();

  const handleSave = (e) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const sqlSchema = `-- Supabase SQL Setup for Vital Diary
-- 1. Create medical_records table
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  category text not null,
  provider text,
  doctor text,
  record_date date,
  file_name text,
  file_size text,
  file_url text,
  tags text[],
  notes text,
  user_id uuid references auth.users(id) on delete cascade
);

-- 2. Enable Row Level Security (RLS)
alter table public.medical_records enable row level security;

-- 3. Create Storage bucket for medical files
insert into storage.buckets (id, name, public) 
values ('vital-records', 'vital-records', true)
on conflict (id) do nothing;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'var(--color-mint-50)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Supabase Storage & Database Settings
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Connect your real Supabase project or use local encrypted vault
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.35rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.1rem',
              backgroundColor: isConnected ? 'var(--color-mint-50)' : '#fffbeb',
              border: `1px solid ${isConnected ? 'var(--color-mint-200)' : '#fde68a'}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {isConnected ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-primary)' }} />
              ) : (
                <AlertCircle size={18} style={{ color: '#d97706' }} />
              )}
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isConnected ? 'var(--color-primary-dark)' : '#92400e' }}>
                {isConnected
                  ? 'Supabase Backend Connected & Ready for Uploads'
                  : 'Operating in Local Storage Vault (Offline Ready)'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="supabaseUrl">Supabase Project URL</label>
              <input
                id="supabaseUrl"
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="supabaseAnonKey">Supabase Anon Public API Key</label>
              <input
                id="supabaseAnonKey"
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            {savedSuccess && (
              <div style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                ✓ Supabase credentials saved successfully!
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={14} />
                <span>Save Credentials</span>
              </button>
              {url && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setUrl('');
                    setAnonKey('');
                    saveSupabaseConfig('', '');
                  }}
                >
                  Clear & Revert to Local
                </button>
              )}
            </div>
          </form>

          {/* Optional SQL Setup helper */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Supabase SQL Setup Snippet (Optional)
              </span>
              <button
                type="button"
                onClick={copySql}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', gap: '0.35rem' }}
              >
                <Copy size={12} />
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre
              style={{
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                overflowX: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {sqlSchema}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
