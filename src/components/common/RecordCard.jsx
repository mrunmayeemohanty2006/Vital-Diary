import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  UserCheck,
  Building2,
  Download,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export default function RecordCard({ record, onSelectRecord }) {
  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Lab Results':
        return 'badge-mint';
      case 'Imaging':
        return 'badge-emerald';
      case 'Cardiology':
        return 'badge-mint';
      case 'Vaccination':
        return 'badge-mint';
      default:
        return 'badge-gray';
    }
  };

  const isImage = record.fileType === 'image';

  return (
    <div
      className="record-card"
      onClick={() => onSelectRecord(record)}
    >
      <div>
        <div className="record-card-top">
          <div className="record-file-icon">
            {isImage ? (
              <ImageIcon size={20} strokeWidth={2} />
            ) : (
              <FileText size={20} strokeWidth={2} />
            )}
          </div>
          <span className={`badge ${getCategoryBadgeClass(record.category)}`}>
            {record.category}
          </span>
        </div>

        <div className="record-card-body">
          <h4>{record.title}</h4>

          <div className="record-meta-row">
            <span className="record-meta-item">
              <Calendar size={13} />
              {record.date}
            </span>
            <span className="record-meta-item">
              <Building2 size={13} />
              {record.provider}
            </span>
          </div>

          {record.tags && record.tags.length > 0 && (
            <div className="record-tags-list">
              {record.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="record-tag-pill">
                  {tag}
                </span>
              ))}
              {record.tags.length > 3 && (
                <span className="record-tag-pill">+{record.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="record-card-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
          <ShieldCheck size={14} className="text-emerald" />
          <span>{record.doctor || record.provider || 'Verified Record'}</span>
        </div>

        <button
          className="btn btn-outline btn-sm"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectRecord(record);
          }}
        >
          <Eye size={13} />
          <span>View</span>
        </button>
      </div>
    </div>
  );
}
