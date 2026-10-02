import React, { createContext, useContext, useState, useEffect } from 'react';
import { uploadMedicalFile, getSupabase } from '../services/supabase';

const RecordsContext = createContext();

const STORAGE_RECORDS_KEY = 'vital_diary_medical_records';
const STORAGE_VITALS_KEY = 'vital_diary_health_vitals';

// Helper to determine category from file name or folder
function inferCategory(fileName, folderName = '') {
  const lower = `${fileName} ${folderName}`.toLowerCase();
  if (lower.includes('blood') || lower.includes('lab') || lower.includes('cmp') || lower.includes('lipid') || lower.includes('panel') || lower.includes('cbc') || lower.includes('glucose') || lower.includes('test')) {
    return 'Lab Results';
  }
  if (lower.includes('xray') || lower.includes('x-ray') || lower.includes('mri') || lower.includes('ct') || lower.includes('scan') || lower.includes('ultrasound') || lower.includes('imaging') || lower.includes('radiology')) {
    return 'Imaging';
  }
  if (lower.includes('ecg') || lower.includes('ekg') || lower.includes('cardio') || lower.includes('echo') || lower.includes('heart')) {
    return 'Cardiology';
  }
  if (lower.includes('vaccin') || lower.includes('immun') || lower.includes('flu') || lower.includes('shot') || lower.includes('booster')) {
    return 'Vaccination';
  }
  if (lower.includes('rx') || lower.includes('prescription') || lower.includes('med') || lower.includes('drug')) {
    return 'Prescription';
  }
  if (lower.includes('doctor') || lower.includes('note') || lower.includes('visit') || lower.includes('summary') || lower.includes('consult')) {
    return "Doctor's Note";
  }
  return 'General Record';
}

export function RecordsProvider({ children }) {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return [];
  });

  const [vitals, setVitals] = useState(() => {
    const saved = localStorage.getItem(STORAGE_VITALS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse vitals', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VITALS_KEY, JSON.stringify(vitals));
  }, [vitals]);

  // Add a single medical record
  const addRecord = async ({
    file,
    title,
    category,
    folderName = 'Root Folder',
    provider = '',
    doctor = '',
    date = '',
    tags = [],
    notes = '',
  }) => {
    const cleanTitle =
      title ||
      (file
        ? file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
        : 'Medical Document');

    const inferredCategory = category || inferCategory(cleanTitle, folderName);

    let fileMeta = {
      fileType: 'document',
      fileName: file ? file.name : 'medical_record',
      fileSize: file
        ? file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`
        : '0 KB',
      fileUrl: '',
      storageType: 'local',
      folderName: folderName || 'Root Folder',
      relativePath: file?.webkitRelativePath || file?.name || '',
    };

    if (file) {
      const uploadResult = await uploadMedicalFile(file);
      const ext = file.name.split('.').pop().toLowerCase();
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);

      fileMeta = {
        fileType: isImg ? 'image' : ext === 'pdf' ? 'pdf' : 'document',
        fileName: file.name,
        fileSize:
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
        fileUrl: uploadResult.url,
        storageType: uploadResult.storageType,
        folderName: folderName || (file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : 'Root Folder'),
        relativePath: file.webkitRelativePath || file.name,
      };
    }

    const newRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle.trim(),
      category: inferredCategory,
      provider: provider.trim(),
      doctor: doctor.trim(),
      date: date || new Date().toISOString().split('T')[0],
      uploadedAt: new Date().toISOString(),
      ...fileMeta,
      tags: Array.isArray(tags) ? tags : [inferredCategory],
      notes: notes.trim(),
      status: 'Verified',
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Attempt to persist in Supabase DB table if configured
    const client = getSupabase();
    if (client) {
      try {
        await client.from('medical_records').insert([
          {
            title: newRecord.title,
            category: newRecord.category,
            provider: newRecord.provider,
            doctor: newRecord.doctor,
            record_date: newRecord.date,
            file_name: newRecord.fileName,
            file_size: newRecord.fileSize,
            file_url: newRecord.fileUrl,
            tags: newRecord.tags,
            notes: newRecord.notes,
            created_at: newRecord.uploadedAt,
          },
        ]);
      } catch (dbErr) {
        console.warn('Supabase DB table insert notice:', dbErr.message);
      }
    }

    return newRecord;
  };

  // Batch upload files/folder
  const addBatchRecords = async (fileList, defaultFolderName = '') => {
    const results = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let folder = defaultFolderName;
      if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
        folder = file.webkitRelativePath.split('/')[0];
      } else if (!folder) {
        folder = 'Uploaded Folder';
      }

      const rec = await addRecord({
        file,
        folderName: folder,
      });
      results.push(rec);
    }
    return results;
  };

  const deleteRecord = async (id) => {
    const recordToDelete = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id));

    // Also attempt deletion from Supabase table if configured
    const client = getSupabase();
    if (client && recordToDelete) {
      try {
        if (recordToDelete.title) {
          await client
            .from('medical_records')
            .delete()
            .eq('title', recordToDelete.title);
        }
      } catch (dbErr) {
        console.warn('Supabase DB table delete notice:', dbErr.message);
      }
    }
  };

  const getRecordById = (id) => {
    return records.find((r) => r.id === id);
  };

  const addVital = (vitalPoint) => {
    setVitals((prev) => [...prev, vitalPoint]);
  };

  const searchRecords = (query, filters = {}) => {
    const q = (query || '').toLowerCase().trim();
    const { category, provider, dateFrom, dateTo, tag, folder } = filters;

    return records.filter((rec) => {
      if (category && category !== 'All' && rec.category !== category) {
        return false;
      }

      if (provider && provider !== 'All' && rec.provider !== provider) {
        return false;
      }

      if (folder && folder !== 'All' && rec.folderName !== folder) {
        return false;
      }

      if (tag && !rec.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        return false;
      }

      if (dateFrom && rec.date < dateFrom) {
        return false;
      }
      if (dateTo && rec.date > dateTo) {
        return false;
      }

      if (q) {
        const titleMatch = (rec.title || '').toLowerCase().includes(q);
        const notesMatch = (rec.notes || '').toLowerCase().includes(q);
        const doctorMatch = (rec.doctor || '').toLowerCase().includes(q);
        const providerMatch = (rec.provider || '').toLowerCase().includes(q);
        const categoryMatch = (rec.category || '').toLowerCase().includes(q);
        const folderMatch = (rec.folderName || '').toLowerCase().includes(q);
        const tagMatch = (rec.tags || []).some((t) => t.toLowerCase().includes(q));
        const fileMatch = (rec.fileName || '').toLowerCase().includes(q);

        return (
          titleMatch ||
          notesMatch ||
          doctorMatch ||
          providerMatch ||
          categoryMatch ||
          folderMatch ||
          tagMatch ||
          fileMatch
        );
      }

      return true;
    });
  };

  const computeStorageUsed = () => {
    if (records.length === 0) return '0 KB';
    let totalKB = 0;
    records.forEach((r) => {
      if (r.fileSize) {
        if (r.fileSize.includes('MB')) {
          totalKB += parseFloat(r.fileSize) * 1024;
        } else if (r.fileSize.includes('KB')) {
          totalKB += parseFloat(r.fileSize);
        }
      }
    });
    return totalKB >= 1024
      ? `${(totalKB / 1024).toFixed(1)} MB`
      : `${Math.round(totalKB)} KB`;
  };

  const stats = {
    totalRecords: records.length,
    categoriesCount: records.length > 0 ? new Set(records.map((r) => r.category)).size : 0,
    providersCount: records.length > 0 ? new Set(records.map((r) => r.provider).filter(Boolean)).size : 0,
    foldersCount: records.length > 0 ? new Set(records.map((r) => r.folderName || 'Root Folder')).size : 0,
    monitoredBiomarkers: vitals.length > 0 ? vitals.length : 0,
    storageUsedMB: computeStorageUsed(),
  };

  return (
    <RecordsContext.Provider
      value={{
        records,
        vitals,
        stats,
        addRecord,
        addBatchRecords,
        deleteRecord,
        getRecordById,
        addVital,
        searchRecords,
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
}
