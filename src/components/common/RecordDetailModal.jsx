import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  Tag,
  Download,
  Trash2,
  Database,
  Activity,
  AlertTriangle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useRecords } from '../../context/RecordsContext';
import { useNotification } from '../../context/NotificationContext';
import { getSignedFileUrl } from '../../lib/supabase';

export default function RecordDetailModal({ record, onClose, isReadOnly = false }) {
  const { deleteRecord } = useRecords();
  const notify = useNotification();
  const [resolvedUrl, setResolvedUrl] = useState(record?.fileUrl || '');

  useEffect(() => {
    let isMounted = true;
    if (record?.fileUrl) {
      setResolvedUrl(record.fileUrl);
    } else if (record?.filePath || record?.file_path) {
      getSignedFileUrl(record.filePath || record.file_path, 3600)
        .then((url) => {
          if (isMounted && url) setResolvedUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [record]);

  if (!record) return null;

  const handleDelete = async () => {
    const confirmed = await notify.confirm({
      title: 'Remove Medical Record',
      message: `Are you sure you want to remove "${record.title}" from your diary?`,
      confirmText: 'Remove Record',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      deleteRecord(record.id);
      notify.info(`"${record.title}" removed from your diary.`);
      onClose();
    }
  };

  const handleViewPdf = () => {
    const urlToOpen = resolvedUrl || record.fileUrl;
    if (urlToOpen) {
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    const urlToDownload = resolvedUrl || record.fileUrl;
    if (urlToDownload) {
      const a = document.createElement('a');
      a.href = urlToDownload;
      a.download = record.fileName || 'medical_record.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a deterministic formatted text export of the record
      let metricsText = '';
      if (record.extractedMetrics && record.extractedMetrics.length > 0) {
        metricsText = '\n\nExtracted Clinical Measurements:\n' +
          record.extractedMetrics.map(m => `• ${m.name}: ${m.displayValue || m.value} (Ref: ${m.referenceRange?.rawText || 'Standard'}) [Status: ${m.status || 'Normal'}]`).join('\n');
      }

      const content = `VITAL DIARY - MEDICAL RECORD EXPORT\n\nTitle: ${record.title}\nCategory: ${record.category}\nDate of Service: ${record.date}\nHealthcare Provider: ${record.provider || 'N/A'}\nAttending Doctor: ${record.doctor || 'N/A'}\nVerification: ${record.status || 'Verified'}\n\nClinical Summary & Notes:\n${record.notes || 'No notes provided.'}${metricsText}\n\nTags: ${(record.tags || []).join(', ')}\nFile Reference: ${record.fileName} (${record.fileSize || 'Standard'})\nStorage: ${record.storageType || 'Encrypted'}`;
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

  const renderStatusBadge = (status, needsVerification) => {
    if (needsVerification) {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            fontSize: '0.725rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <AlertTriangle size={11} />
          Verify
        </span>
      );
    }

    switch (status) {
      case 'high':
        return (
          <span
            className="badge"
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              fontSize: '0.725rem',
            }}
          >
            High
          </span>
        );
      case 'low':
        return (
          <span
            className="badge"
            style={{
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              fontSize: '0.725rem',
            }}
          >
            Low
          </span>
        );
      case 'normal':
      default:
        return (
          <span
            className="badge badge-mint"
            style={{
              fontSize: '0.725rem',
            }}
          >
            Normal
          </span>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
                {record.date || 'Undated'}
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
                {record.storageType === 'supabase' ? 'Supabase Cloud Vault' : 'Encrypted Vault'}
              </strong>
            </div>
          </div>

          {/* Extracted Clinical Measurements Table */}
          {Array.isArray(record.extractedMetrics) && record.extractedMetrics.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <h4 style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Activity size={16} className="text-emerald" />
                  Extracted Clinical Measurements ({record.extractedMetrics.length})
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Validated Clinical Biomarkers
                </span>
              </div>

              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Biomarker / Test</th>
                      <th style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Result Value</th>
                      <th style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Reference Range</th>
                      <th style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.extractedMetrics.map((metric, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx === record.extractedMetrics.length - 1 ? 'none' : '1px solid var(--color-border)',
                          backgroundColor: metric.needsVerification ? '#fffbeb' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {metric.name}
                          {metric.rawName && metric.rawName !== metric.name && (
                            <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                              Report: {metric.rawName}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {metric.value} <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>{metric.unit}</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                          {metric.referenceRange?.rawText ||
                            (metric.referenceRange?.low !== undefined && metric.referenceRange?.high !== undefined
                              ? `${metric.referenceRange.low} - ${metric.referenceRange.high} ${metric.unit}`
                              : 'Standard')}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right' }}>
                          {renderStatusBadge(metric.status, metric.needsVerification)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation Notice if non-lab or unsupported */}
          {record.isMedicalReport === false && record.validationMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.825rem',
                color: '#92400e',
              }}
            >
              <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Document Notice:</strong> {record.validationMessage}
              </div>
            </div>
          )}

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
                Indexed Tags:
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
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: '1 1 200px' }}>
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
                  flexShrink: 0,
                }}
              >
                <FileText size={20} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
                  {record.fileName || `${record.title}.pdf`}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {record.fileSize || 'Document'} &bull; AES-256 Encrypted
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={handleViewPdf}
                className="btn btn-outline btn-sm"
                style={{ gap: '0.35rem', backgroundColor: '#ffffff' }}
              >
                <Eye size={14} />
                <span>View PDF</span>
                <ExternalLink size={12} />
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-primary btn-sm"
                style={{ gap: '0.35rem' }}
              >
                <Download size={14} />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {!isReadOnly && (
            <button
              onClick={handleDelete}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--color-danger)', borderColor: '#fca5a5' }}
            >
              <Trash2 size={14} />
              <span>Delete Record</span>
            </button>
          )}
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
