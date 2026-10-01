import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ initialRole = 'patient', onSuccess }) {
  const { login, signup } = useAuth();

  const [role, setRole] = useState(initialRole); // 'patient' or 'doctor'
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        signup(name, email, password, role);
      } else {
        login(email, password, role);
      }
      setLoading(false);
      if (onSuccess) onSuccess(role);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'var(--color-mint-50)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '1px solid var(--color-mint-200)',
            }}
          >
            {role === 'doctor' ? (
              <Stethoscope size={24} strokeWidth={2.2} />
            ) : (
              <ShieldCheck size={24} strokeWidth={2.2} />
            )}
          </div>
          <h2>{role === 'doctor' ? 'Provider Portal' : 'Patient Access'}</h2>
          <p>
            {role === 'doctor'
              ? 'Access patient medical records and clinical test histories'
              : 'Sign in to access your secure medical vault & health trends'}
          </p>
        </div>

        {/* Role Selector Tabs (Patient vs Doctor) */}
        <div className="role-toggle-group">
          <button
            type="button"
            className={`role-toggle-btn ${role === 'patient' ? 'active' : ''}`}
            onClick={() => {
              setRole('patient');
              setError('');
            }}
          >
            <User size={16} />
            <span>Patient</span>
          </button>

          <button
            type="button"
            className={`role-toggle-btn ${role === 'doctor' ? 'active' : ''}`}
            onClick={() => {
              setRole('doctor');
              setError('');
            }}
          >
            <Stethoscope size={16} />
            <span>Doctor</span>
          </button>
        </div>

        {/* Tab switch for Login vs Sign Up */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(false);
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(true);
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-alert-error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="authName">Full Name</label>
              <input
                id="authName"
                type="text"
                placeholder={role === 'doctor' ? 'e.g. Dr. Jane Smith' : 'e.g. Jane Smith'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="authEmail">Email Address</label>
            <input
              id="authEmail"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="authPassword">Password</label>
            <input
              id="authPassword"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
            disabled={loading}
          >
            <span>
              {loading
                ? 'Authenticating...'
                : isSignUp
                ? role === 'doctor'
                  ? 'Create Doctor Account'
                  : 'Create Patient Account'
                : role === 'doctor'
                ? 'Sign In as Doctor'
                : 'Sign In to Dashboard'}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
