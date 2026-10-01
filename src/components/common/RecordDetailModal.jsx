import React from 'react';
import {
  X,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  Tag,
  ShieldCheck,
  Download,
  Trash2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useRecords } from '../../context/RecordsContext';

export default function RecordDetailModal({ record, onClose }) {
  const { deleteRecord } = useRecords();

  if (!record) return null;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove "${record.title}" from your diary?`)) {
      deleteRecord(record.id);
      onClose();
    }
  };

  const handleDownload = () => {
    if (record.fileUrl) {
      const a = document.createElement('a');
      a.href = record.fileUrl;
      a.download = record.fileName || 'medical_record.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a deterministic formatted text export of the record
      const content = `VITAL DIARY - MEDICAL RECORD EXPORT\n\nTitle: ${record.title}\nCategory: ${record.category}\nDate of Service: ${record.date}\nHealthcare Provider: ${record.provider}\nAttending Doctor: ${record.doctor}\nVerification: ${record.status || 'Verified'}\n\nClinical Summary & Notes:\n${record.notes || 'No notes provided.'}\n\nTags: ${(record.tags || []).join(', ')}\nFile Reference: ${record.fileName} (${record.fileSize || 'Standard'})\nStorage: ${record.storageType || 'Encrypted'}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.title.replace(/\s+/g, '_')}_Summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="badge badge-mint">{record.category}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              ID: {record.id}
            </span>
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
          <h2 style={{ fontSize: '1.45rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            {record.title}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Date of Service
              </span>
              <strong style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                <Calendar size={14} className="text-emerald" />
                {record.date}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Healthcare Provider
              </span>
              <strong style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                <Building2 size={14} className="text-emerald" />
                {record.provider || 'Not specified'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Attending Physician
              </span>
              <strong style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                <UserCheck size={14} className="text-emerald" />
                {record.doctor || 'Not specified'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Storage Backend
              </span>
              <strong style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2, textTransform: 'capitalize' }}>
                <Database size={14} className="text-emerald" />
                {record.storageType === 'supabase' ? 'Supabase Cloud Vault' : 'Secure Local Vault'}
              </strong>
            </div>
          </div>

          {/* Clinical Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
              Clinical Summary & Findings
            </h4>
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                color: 'var(--color-text-secondary)',
              }}
            >
              {record.notes || 'No additional clinical remarks documented.'}
            </div>
          </div>

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Indexed Tags for Search:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {record.tags.map((tag, idx) => (
                  <span key={idx} className="badge badge-mint" style={{ fontSize: '0.8rem' }}>
                    <Tag size={11} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attached Document info card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-mint-50)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-mint-200)',
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--color-text-primary)' }}>
                  {record.fileName || `${record.title}.pdf`}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {record.fileSize || 'Document'} &bull; AES-256 Encrypted
                </span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={handleDelete}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
          >
            <Trash2 size={14} />
            <span>Delete Record</span>
          </button>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
