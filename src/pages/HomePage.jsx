import React from 'react';
import {
  ShieldCheck,
  FolderLock,
  Search,
  TrendingUp,
  ArrowRight,
  Lock,
  CheckCircle2,
  FileText,
  Activity,
  UserPlus,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage({ onGetStarted, onLoginDoctor }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-pill">
          <ShieldCheck size={16} />
          <span>Patient-First Medical Sovereignty & Privacy</span>
        </div>

        <h1 className="hero-title">
          Your Complete Health History in <span className="text-emerald">One Safe Place</span>
        </h1>

        <p className="hero-subtitle">
          Vital Diary enables you to securely store all your medical records, retrieve them instantly,
          search clinical details deterministically, and observe your long-term health trends.
        </p>

        <div className="hero-cta-group">
          <button
            className="btn btn-primary btn-lg"
            onClick={onGetStarted}
          >
            <span>{isAuthenticated ? 'Open Your Dashboard' : 'Get Started with Vital Diary'}</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn btn-secondary btn-lg"
            onClick={onLoginDoctor}
          >
            <Stethoscope size={18} />
            <span>Healthcare Provider Portal</span>
          </button>
        </div>
      </section>

      {/* Trust / Security Strip */}
      <div className="trust-strip">
        <div className="trust-inner">
          <div className="trust-item">
            <Lock size={18} className="trust-icon" />
            <span>Client-Side AES Encryption</span>
          </div>
          <div className="trust-item">
            <ShieldCheck size={18} className="trust-icon" />
            <span>Zero Unwanted AI Scraping</span>
          </div>
          <div className="trust-item">
            <FolderLock size={18} className="trust-icon" />
            <span>Supabase Cloud Storage Backed</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={18} className="trust-icon" />
            <span>Deterministic Record Indexing</span>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars / Features */}
      <section className="home-section" id="features-section">
        <div className="section-header">
          <div className="section-tag">Core Capabilities</div>
          <h2 className="section-heading">Engineered for Lifelong Health Tracking</h2>
          <p className="section-desc">
            A clean, minimal, distraction-free environment built to keep your medical data organized and accessible.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <FolderLock size={24} />
            </div>
            <h3>Unified Medical Vault</h3>
            <p>
              Upload and store lab results, imaging scans, immunization records, doctor notes, and prescriptions with full metadata.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Search size={24} />
            </div>
            <h3>Deterministic Search</h3>
            <p>
              Find exact medical terms, past diagnosis notes, medication dosages, or doctor names with millisecond-speed deterministic queries.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <TrendingUp size={24} />
            </div>
            <h3>Health Trend Tracking</h3>
            <p>
              Observe biomarker trajectories including Blood Pressure, Resting Heart Rate, Fasting Glucose, and Cholesterol with target ranges.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <ShieldCheck size={24} />
            </div>
            <h3>Privacy & Sovereignty</h3>
            <p>
              Your medical data belongs solely to you. Direct Supabase integration gives you full custody of your cloud storage bucket.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Architecture Section */}
      <section className="home-section" id="security-section">
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="section-tag">Security Architecture</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              Built Around Medical-Grade Privacy Principles
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Unlike generic health apps, Vital Diary keeps your medical records organized without unauthorized profiling.
              Every document is strictly cataloged with verified timestamps, categories, and provider tags.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={16} className="text-emerald" />
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Direct Supabase Storage integration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={16} className="text-emerald" />
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Doctor and Patient role separation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={16} className="text-emerald" />
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Zero synthetic medical hallucinations</span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--color-mint-50)',
              border: '1px solid var(--color-mint-200)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <HeartPulse size={24} style={{ color: 'var(--color-primary)' }} />
              <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                Your Health, Your Vault
              </strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Securely store your medical files, review health trends, and retrieve clinical history in seconds with deterministic precision.
            </p>
            <button
              className="btn btn-primary"
              onClick={onGetStarted}
              style={{ width: '100%' }}
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home-section">
        <div className="cta-banner">
          <h2>Take Custody of Your Health Records Today</h2>
          <p>
            Start storing your medical reports, lab tests, and doctor visits in one clean, emerald-accented workspace.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={onGetStarted}
          >
            <span>Launch Vital Diary Now</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
