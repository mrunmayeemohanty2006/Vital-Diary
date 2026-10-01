import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderUp,
  Folder,
  FolderCheck,
  FileText,
  File,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Database,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useRecords } from '../context/RecordsContext';
import { isSupabaseConfigured } from '../services/supabase';
import RecordDetailModal from '../components/common/RecordDetailModal';

export default function UploadPage({ onUploadComplete, onOpenSupabaseModal }) {
  const { addBatchRecords, records } = useRecords();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [stagedFiles, setStagedFiles] = useState([]);
  const [detectedFolderName, setDetectedFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedBatch, setUploadedBatch] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});

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
      folder = 'Medical Records Batch';
    } else if (!folder && filesArray.length === 1) {
      folder = 'General Vault';
    }

    setDetectedFolderName(folder || 'Uploaded Folder');
    setStagedFiles((prev) => [...prev, ...filesArray]);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files, 'Dropped Medical Folder');
    }
  };

  const removeStagedFile = (index) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearStaged = () => {
    setStagedFiles([]);
    setDetectedFolderName('');
    setUploadedBatch(null);
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
    } catch (err) {
      setLoading(false);
      alert('Failed to upload files: ' + err.message);
    }
  };

  // Group existing vault records by folder
  const groupedVaultRecords = records.reduce((acc, r) => {
    const folder = r.folderName || 'General Vault';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(r);
    return acc;
  }, {});

  const toggleFolderExpand = (folder) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }));
  };

  const getFileIcon = (fileOrRecord) => {
    const name = fileOrRecord.name || fileOrRecord.fileName || fileOrRecord.title || '';
    const ext = name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) || fileOrRecord.fileType === 'image') {
      return <ImageIcon size={18} style={{ color: 'var(--color-primary)' }} />;
    }
    return <FileText size={18} style={{ color: 'var(--color-primary)' }} />;
  };

  return (
    <div className="upload-page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Upload Medical Records & Folders
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
          Directly upload individual files or select an entire folder of medical reports, imaging scans, and prescriptions.
        </p>
      </div>

      {/* Supabase Storage Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          backgroundColor: supabaseConnected ? 'var(--color-mint-50)' : '#f8fafc',
          border: `1px solid ${supabaseConnected ? 'var(--color-mint-200)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.75rem',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Database size={17} style={{ color: supabaseConnected ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
          <span>
            Storage Destination:{' '}
            <strong>{supabaseConnected ? 'Supabase Cloud Vault (Bucket: vital-records)' : 'Local Encrypted Vault (Offline)'}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSupabaseModal}
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
        >
          {supabaseConnected ? 'Supabase Config' : 'Configure Supabase Keys'}
        </button>
      </div>

      {/* Hidden File and Folder Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        style={{ display: 'none' }}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
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

      {/* Upload Drag and Drop Zone */}
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

        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
          Drag & Drop Files or Complete Medical Folders
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
          Drop diagnostic PDFs, lab reports, imaging directories, or doctor visits. All files are automatically structured and encrypted.
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
            <span>Upload Entire Folder</span>
          </button>
        </div>
      </div>

      {/* Staged Folder Review Table */}
      {stagedFiles.length > 0 && (
        <div className="folder-summary-card">
          <div className="folder-header-row">
            <div className="folder-title-box">
              <div className="folder-icon-wrap">
                <Folder size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {detectedFolderName}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {stagedFiles.length} {stagedFiles.length === 1 ? 'file' : 'files'} &bull; {calculateTotalSize(stagedFiles)} total
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={clearStaged}
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
                    <span>Save {stagedFiles.length} Files to Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clean Formatted File Table */}
          <div className="file-table-container">
            <table className="file-table">
              <thead>
                <tr>
                  <th>File Name & Path</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stagedFiles.map((file, idx) => {
                  const ext = file.name.split('.').pop().toUpperCase();
                  const relativePath = file.webkitRelativePath || file.name;
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="file-name-cell">
                          {getFileIcon(file)}
                          <div>
                            <span style={{ display: 'block' }}>{file.name}</span>
                            {file.webkitRelativePath && (
                              <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                                {relativePath}
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
                      <td style={{ color: 'var(--color-text-secondary)' }}>
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

      {/* Post-Upload Success Notification */}
      {uploadedBatch && (
        <div
          style={{
            backgroundColor: 'var(--color-mint-50)',
            border: '1px solid var(--color-mint-200)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Folder "{uploadedBatch.folderName}" Successfully Stored
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-dark)' }}>
                {uploadedBatch.count} files ({uploadedBatch.size}) encrypted and cataloged in your medical vault.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => onUploadComplete && onUploadComplete('dashboard')}
          >
            <span>View in Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Cataloged Vault Folders Explorer */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Medical Vault Folder Explorer
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              All stored medical documents structured by folder hierarchy
            </p>
          </div>
          <span className="badge badge-mint">
            {records.length} Total {records.length === 1 ? 'Document' : 'Documents'}
          </span>
        </div>

        {Object.keys(groupedVaultRecords).length === 0 ? (
          <div
            style={{
              padding: '3.5rem 2rem',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <Folder size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
              Your vault is currently empty
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              Use the drag-and-drop zone or the "Upload Entire Folder" button above to populate your medical records archive.
            </p>
          </div>
        ) : (
          <div className="vault-folders-grid">
            {Object.entries(groupedVaultRecords).map(([folderName, folderRecords]) => {
              const isExpanded = expandedFolders[folderName] !== false; // expanded by default
              return (
                <div key={folderName} className={`vault-folder-card ${isExpanded ? 'expanded' : ''}`}>
                  <div
                    className="vault-folder-header"
                    onClick={() => toggleFolderExpand(folderName)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="folder-icon-wrap" style={{ width: 36, height: 36 }}>
                        <Folder size={20} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                          {folderName}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                          {folderRecords.length} {folderRecords.length === 1 ? 'file' : 'files'} &bull; AES-256 Encrypted
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-mint" style={{ fontSize: '0.75rem' }}>
                        {folderRecords.length} Items
                      </span>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="vault-folder-body">
                      <div className="file-table-container">
                        <table className="file-table">
                          <thead>
                            <tr>
                              <th>Document Title</th>
                              <th>Category</th>
                              <th>Date</th>
                              <th>Size</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {folderRecords.map((rec) => (
                              <tr key={rec.id}>
                                <td>
                                  <div className="file-name-cell">
                                    {getFileIcon(rec)}
                                    <span>{rec.title}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge badge-mint" style={{ fontSize: '0.75rem' }}>
                                    {rec.category}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                                  {rec.date}
                                </td>
                                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                                  {rec.fileSize || 'Standard'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                    onClick={() => setSelectedRecord(rec)}
                                  >
                                    <Eye size={12} />
                                    <span>Inspect</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Inspection Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
