import React from 'react';

export default function MetricCard({ label, value, subtext, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtext && (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {trend && <span style={{ color: 'var(--color-primary)', fontWeight: 600, marginRight: 4 }}>{trend}</span>}
            {subtext}
          </div>
        )}
      </div>
      {Icon && (
        <div className="stat-icon-wrap">
          <Icon size={22} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
