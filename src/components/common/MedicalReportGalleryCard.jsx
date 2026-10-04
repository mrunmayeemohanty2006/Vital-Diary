import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Building2,
  Download,
  Eye,
  Trash2,
  FileSpreadsheet,
  HardDrive,
} from 'lucide-react';
import { useRecords } from '../../context/RecordsContext';
import { renderPdfFirstPageThumbnail } from '../../lib/ocr';

export default function MedicalReportGalleryCard({ record, onSelectRecord }) {
  const { deleteRecord } = useRecords();

  const isImage =
    record?.fileType === 'image' ||
    (record?.fileName && /\.(png|jpe?g|webp|gif|svg)$/i.test(record.fileName)) ||
    (record?.fileUrl && record.fileUrl.startsWith('data:image'));

  const isPdf =
    record?.fileType === 'pdf' ||
    (record?.fileName && /\.pdf$/i.test(record.fileName));

  const [coverUrl, setCoverUrl] = useState(
    record?.thumbnailUrl || (isImage && record?.fileUrl ? record.fileUrl : null)
  );

  useEffect(() => {
    if (!record) return;
    if (record.thumbnailUrl) {
      setCoverUrl(record.thumbnailUrl);
    } else if (isImage && record.fileUrl) {
      setCoverUrl(record.fileUrl);
    } else if (isPdf && record.fileUrl) {
      let isCancelled = false;
      renderPdfFirstPageThumbnail(record.fileUrl, 450).then((thumb) => {
        if (!isCancelled && thumb) {
          setCoverUrl(thumb);
        }
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [record, record?.thumbnailUrl, record?.fileUrl, isImage, isPdf]);

  if (!record) return null;

  const getFormatBadge = () => {
    if (record.fileName) {
      const ext = record.fileName.split('.').pop().toUpperCase();
      if (ext && ext.length <= 4) return ext;
    }
    if (isImage) return 'IMG';
    if (isPdf) return 'PDF';
    return 'DOC';
  };

  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'Lab Results':
        return 'badge-mint';
      case 'Imaging':
        return 'badge-emerald';
      case 'Cardiology':
        return 'badge-mint';
      case 'Vaccination':
        return 'badge-mint';
      case 'Prescription':
        return 'badge-mint';
      default:
        return 'badge-gray';
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (record.fileUrl) {
      const a = document.createElement('a');
      a.href = record.fileUrl;
      a.download = record.fileName || `${record.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      let metricsText = '';
      if (record.extractedMetrics && record.extractedMetrics.length > 0) {
        metricsText = '\n\nExtracted Clinical Measurements:\n' +
          record.extractedMetrics.map(m => `• ${m.name}: ${m.displayValue}`).join('\n');
      }
      const content = `VITAL DIARY - MEDICAL REPORT\n\nTitle: ${record.title}\nCategory: ${record.category}\nDate: ${record.date}\nProvider: ${record.provider || 'N/A'}\nDoctor: ${record.doctor || 'N/A'}\n\nClinical Summary:\n${record.notes || 'No remarks.'}${metricsText}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${record.title}" from your diary?`)) {
      deleteRecord(record.id);
    }
  };

  // Only display non-automated user notes on the card to keep the initial interface clean
  const hasUserCustomNotes = record.notes && !record.notes.startsWith('Extracted ');

  return (
    <div
      className="gallery-report-card"
      onClick={() => onSelectRecord(record)}
      title="Click to inspect extracted vitals and document details"
    >
      {/* Visual Preview Header (First page of PDF or Image as cover) */}
      <div className="gallery-card-preview">
        {coverUrl ? (
          <div className="gallery-card-img-wrap">
            <img
              src={coverUrl}
              alt={record.title}
              className="gallery-card-img"
              loading="lazy"
            />
            <div className="gallery-preview-overlay">
              <span className="gallery-preview-btn">
                <Eye size={15} />
                <span>Inspect</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="gallery-card-doc-preview">
            <div className="gallery-doc-sheet">
              <div className="gallery-doc-lines">
                <div className="doc-line line-1" />
                <div className="doc-line line-2" />
                <div className="doc-line line-3" />
              </div>
              <div className="gallery-doc-icon-center">
                {isPdf ? <FileText size={26} /> : <FileSpreadsheet size={26} />}
              </div>
            </div>
            <div className="gallery-preview-overlay">
              <span className="gallery-preview-btn">
                <Eye size={15} />
                <span>Inspect</span>
              </span>
            </div>
          </div>
        )}

        {/* Floating Badges */}
        <div className="gallery-top-badges">
          <span className={`badge ${getCategoryClass(record.category)}`}>
            {record.category || 'General'}
          </span>
          <span className="gallery-format-chip">{getFormatBadge()}</span>
        </div>
      </div>

      {/* Card Info Body (Clean & Minimalist) */}
      <div className="gallery-card-body">
        <h4 className="gallery-card-title" title={record.title}>
          {record.title}
        </h4>

        <div className="gallery-card-meta">
          <div className="gallery-meta-item">
            <Calendar size={13} className="text-emerald" />
            <span>{record.date}</span>
          </div>

          {(record.provider || record.doctor) && (
            <div className="gallery-meta-item">
              <Building2 size={13} className="text-emerald" />
              <span className="truncate-text">{record.provider || record.doctor}</span>
            </div>
          )}
        </div>

        {hasUserCustomNotes && (
          <p className="gallery-card-notes">
            {record.notes}
          </p>
        )}

        {record.tags && record.tags.length > 0 && (
          <div className="gallery-card-tags">
            {record.tags.slice(0, 2).map((t, idx) => (
              <span key={idx} className="gallery-tag-pill">
                #{t}
              </span>
            ))}
            {record.tags.length > 2 && (
              <span className="gallery-tag-pill">+{record.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="gallery-card-footer">
        <div className="gallery-card-fileinfo">
          <HardDrive size={12} />
          <span>{record.fileSize || 'Encrypted'}</span>
        </div>

        <div className="gallery-card-btn-group" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="gallery-action-btn download-btn"
            onClick={handleDownload}
            title="Download report"
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            className="gallery-action-btn view-btn"
            onClick={() => onSelectRecord(record)}
            title="View details & extracted metrics"
          >
            <Eye size={13} />
            <span>View</span>
          </button>
          <button
            type="button"
            className="gallery-action-btn delete-btn"
            onClick={handleDelete}
            title="Permanently delete report"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
