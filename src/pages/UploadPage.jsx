import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderUp,
  Folder,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Database,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  FilePlus2,
  X,
} from 'lucide-react';
import { useRecords } from '../context/RecordsContext';
import { isSupabaseConfigured } from '../services/supabase';
import RecordDetailModal from '../components/common/RecordDetailModal';
import MedicalReportsGallery from '../components/common/MedicalReportsGallery';

export default function UploadPage({ onUploadComplete }) {
  const { addBatchRecords, records } = useRecords();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [stagedFiles, setStagedFiles] = useState([]);
  const [detectedFolderName, setDetectedFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedBatch, setUploadedBatch] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const supabaseConnected = isSupabaseConfigured();

  // Process incoming files from file picker or folder picker
  const handleFilesSelected = (fileList, defaultFolder = '') => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    let folder = defaultFolder;

    // Check if files have relative path indicating a folder
    const firstWithPath = filesArray.find((f) => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
    if (firstWithPath) {
      folder = firstWithPath.webkitRelativePath.split('/')[0];
    } else if (!folder && filesArray.length > 1) {
      folder = 'Medical Batch';
    } else if (!folder && filesArray.length === 1) {
      folder = 'General Reports';
    }

    setDetectedFolderName(folder || 'General Reports');
    setStagedFiles((prev) => [...prev, ...filesArray]);
    setUploadedBatch(null);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files, 'Uploaded Medical Records');
    }
  };

  const removeStagedFile = (index) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearStaged = () => {
    setStagedFiles([]);
    setDetectedFolderName('');
  };

  const calculateTotalSize = (files) => {
    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    return totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalBytes / 1024)} KB`;
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setLoading(true);

    try {
      const savedRecords = await addBatchRecords(stagedFiles, detectedFolderName);
      setLoading(false);
      setUploadedBatch({
        folderName: detectedFolderName,
        records: savedRecords,
        count: savedRecords.length,
        size: calculateTotalSize(stagedFiles),
      });
      setStagedFiles([]);
      setDetectedFolderName('');
    } catch (err) {
      setLoading(false);
      alert('Failed to upload files: ' + err.message);
    }
  };

  const getFileIcon = (file) => {
    const name = file.name || '';
    const ext = name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon size={18} style={{ color: 'var(--color-primary)' }} />;
    }
    return <FileText size={18} style={{ color: 'var(--color-primary)' }} />;
  };

  return (
    <div className="upload-page-container">
      {/* Header */}
      <div className="upload-header-section">
        <div>
          <h1 className="upload-title">Medical File & Report Upload</h1>
          <p className="upload-subtitle">
            Securely upload diagnostic reports, imaging scans, prescriptions, and lab test results to your health vault.
          </p>
        </div>
      </div>

      {/* Storage Destination Notice Banner */}
      <div className="storage-status-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Database size={16} style={{ color: supabaseConnected ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
          <span>
            Storage Destination:{' '}
            <strong>
              {supabaseConnected
                ? 'Supabase Cloud Vault (Bucket: vital-records)'
                : 'Local Encrypted Vault (Zero-Knowledge)'}
            </strong>
          </span>
        </div>
      </div>

      {/* Hidden File and Folder Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        style={{ display: 'none' }}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        style={{ display: 'none' }}
        webkitdirectory="true"
        directory="true"
        multiple
      />

      {/* Drag and Drop Medical File Upload Area */}
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
      >
        <div className="upload-icon-circle">
          <UploadCloud size={32} />
        </div>

        <h3 className="upload-dropzone-title">
          Drag & Drop Medical Reports or Folders
        </h3>
        <p className="upload-dropzone-desc">
          Supported formats: PDF, PNG, JPG, DOCX, TXT. Documents are encrypted, categorized, and cataloged automatically.
        </p>

        {/* Buttons for File and Folder Selection */}
        <div className="upload-actions-bar" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <FileText size={16} />
            <span>Select Files</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => folderInputRef.current && folderInputRef.current.click()}
          >
            <FolderUp size={16} />
            <span>Upload Folder</span>
          </button>
        </div>
      </div>

      {/* Staged Files Review Panel */}
      {stagedFiles.length > 0 && (
        <div className="folder-summary-card">
          <div className="folder-header-row">
            <div className="folder-title-box">
              <div className="folder-icon-wrap">
                <Folder size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {detectedFolderName || 'Selected Medical Files'}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {stagedFiles.length} {stagedFiles.length === 1 ? 'file ready' : 'files ready'} &bull; {calculateTotalSize(stagedFiles)} total
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={clearStaged}
                disabled={loading}
              >
                Clear Selection
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUploadSubmit}
                disabled={loading}
                style={{ minWidth: 160 }}
              >
                {loading ? (
                  <span>Encrypting & Saving...</span>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Save {stagedFiles.length} Files</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Staged Files Table */}
          <div className="file-table-container">
            <table className="file-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stagedFiles.map((file, idx) => {
                  const ext = file.name.split('.').pop().toUpperCase();
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="file-name-cell">
                          {getFileIcon(file)}
                          <div>
                            <span style={{ display: 'block' }}>{file.name}</span>
                            {file.webkitRelativePath && (
                              <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                                {file.webkitRelativePath}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-mint" style={{ fontSize: '0.75rem' }}>
                          {ext || 'DOC'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                        {file.size > 1024 * 1024
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(file.size / 1024)} KB`}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                          <ShieldCheck size={13} className="text-emerald" />
                          Ready
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem', color: 'var(--color-danger)', borderColor: '#fca5a5' }}
                          onClick={() => removeStagedFile(idx)}
                          title="Remove file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Success Feedback Banner */}
      {uploadedBatch && (
        <div className="upload-success-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="upload-success-icon-wrap">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {uploadedBatch.count} {uploadedBatch.count === 1 ? 'Report' : 'Reports'} Successfully Uploaded & Encrypted
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginTop: '0.15rem' }}>
                All records have been cataloged below in your Medical Reports gallery.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ backgroundColor: '#ffffff' }}
            onClick={() => setUploadedBatch(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Medical Reports Section (Gallery Organized by Year -> Month -> Date) */}
      <MedicalReportsGallery
        records={records}
        onSelectRecord={setSelectedRecord}
      />

      {/* Record Inspection / Details Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
