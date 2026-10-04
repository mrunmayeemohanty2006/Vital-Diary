import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  uploadMedicalFile,
  deleteMedicalFile,
  getSignedFileUrl,
  supabaseGetReports,
  supabaseInsertReport,
  supabaseDeleteReport,
  supabaseGetSession,
  supabaseGetCurrentUser,
  isSupabaseConfigured,
} from '../lib/supabase';
import { performLocalOCR, isSupportedImageFile, isPDFFile, renderPdfFirstPageThumbnail } from '../lib/ocr';
import { validateMedicalDocument } from '../lib/medical-document-validator';
import { extractHealthData } from '../lib/health-extractor';
import { filterMedicalRecords } from '../lib/record-search';

const RecordsContext = createContext();

const STORAGE_RECORDS_KEY = 'vital_diary_medical_records';
const STORAGE_VITALS_KEY = 'vital_diary_health_vitals';
const STORAGE_PRESCRIPTIONS_KEY = 'vital_diary_prescriptions';
const STORAGE_MEDICINES_KEY = 'vital_diary_medicines';

// Helper to format date safely to YYYY-MM-DD for SQL and UI
function formatSqlDate(inputDate) {
  if (!inputDate) return new Date().toISOString().split('T')[0];
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) {
    const parts = String(inputDate).split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

// Helper to determine category from file name or folder
function inferCategory(fileName, folderName = '') {
  const lower = `${fileName} ${folderName}`.toLowerCase();
  if (
    lower.includes('blood') ||
    lower.includes('lab') ||
    lower.includes('cmp') ||
    lower.includes('lipid') ||
    lower.includes('panel') ||
    lower.includes('cbc') ||
    lower.includes('glucose') ||
    lower.includes('test')
  ) {
    return 'Lab Results';
  }
  if (
    lower.includes('xray') ||
    lower.includes('x-ray') ||
    lower.includes('mri') ||
    lower.includes('ct') ||
    lower.includes('scan') ||
    lower.includes('ultrasound') ||
    lower.includes('imaging') ||
    lower.includes('radiology')
  ) {
    return 'Imaging';
  }
  if (
    lower.includes('ecg') ||
    lower.includes('ekg') ||
    lower.includes('cardio') ||
    lower.includes('echo') ||
    lower.includes('heart')
  ) {
    return 'Cardiology';
  }
  if (
    lower.includes('vaccin') ||
    lower.includes('immun') ||
    lower.includes('flu') ||
    lower.includes('shot') ||
    lower.includes('booster')
  ) {
    return 'Vaccination';
  }
  if (
    lower.includes('rx') ||
    lower.includes('prescription') ||
    lower.includes('med') ||
    lower.includes('drug')
  ) {
    return 'Prescription';
  }
  if (
    lower.includes('doctor') ||
    lower.includes('note') ||
    lower.includes('visit') ||
    lower.includes('summary') ||
    lower.includes('consult')
  ) {
    return "Doctor's Note";
  }
  return 'General Record';
}

export function RecordsProvider({ children }) {
  const { user } = useAuth();

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

  const [prescriptions, setPrescriptions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_PRESCRIPTIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse prescriptions', e);
      }
    }
    return [];
  });

  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem(STORAGE_MEDICINES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse medicines', e);
      }
    }
    return [];
  });

  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState(false);

  // Sync user health reports from Supabase when user logs in or changes
  const loadUserCloudData = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured()) return;
    setIsLoadingFromCloud(true);

    try {
      const cloudReports = await supabaseGetReports(userId);

      if (Array.isArray(cloudReports)) {
        // Map database reports to client model with refreshed signed URLs if available
        const formattedReports = await Promise.all(
          cloudReports.map(async (r) => {
            let fileUrl = r.file_url || '';
            if (r.file_path && !fileUrl.startsWith('data:')) {
              const signed = await getSignedFileUrl(r.file_path);
              if (signed) fileUrl = signed;
            }

            return {
              id: r.id,
              title: r.title,
              category: r.category,
              provider: r.provider || '',
              doctor: r.doctor || '',
              date: r.date || (r.created_at ? r.created_at.split('T')[0] : ''),
              uploadedAt: r.created_at,
              fileType: r.file_type || 'document',
              fileName: r.file_name || 'medical_record',
              fileSize: r.file_size || '0 KB',
              filePath: r.file_path || '',
              fileUrl,
              thumbnailUrl: fileUrl,
              storageType: r.file_path ? 'supabase' : 'local',
              folderName: r.folder_name || 'Root Folder',
              relativePath: r.relative_path || r.file_name || '',
              tags: r.tags || [],
              notes: r.notes || '',
              status: r.status || 'Verified',
              extractedMetrics: r.extracted_metrics || [],
              results: r.results || {},
              ocrConfidence: r.ocr_confidence ?? 100,
              ocrSource: r.ocr_source || 'direct',
              isMedicalReport: r.is_medical_report ?? true,
              validationMessage: r.validation_message || '',
            };
          })
        );
        setRecords(formattedReports);
      }
    } catch (err) {
      console.warn('Error loading reports from Supabase:', err);
    } finally {
      setIsLoadingFromCloud(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadUserCloudData(user.id);
    }
  }, [user?.id, loadUserCloudData]);

  // Persist to local storage as fallback / cache
  useEffect(() => {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VITALS_KEY, JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MEDICINES_KEY, JSON.stringify(medicines));
  }, [medicines]);

  // Add a single medical record with on-device extraction and Supabase storage
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
    onProgress = () => {},
  }) => {
    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Resolve authenticated user ID
    let currentUserId = user?.id;
    if (isSupabaseConfigured()) {
      const session = await supabaseGetSession();
      const authUser = session?.user || (await supabaseGetCurrentUser());
      if (authUser?.id) {
        currentUserId = authUser.id;
      } else {
        throw new Error('Please sign in or log in with your account to upload medical reports to Supabase.');
      }
    }

    let cleanTitle =
      title ||
      (file
        ? file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
        : 'Medical Document');

    let inferredCategory = category || inferCategory(cleanTitle, folderName);
    let extractedDate = date || '';
    let extractedMetrics = [];
    let extractedResults = {};
    let extractionSummary = notes || '';
    let ocrConfidence = 100;
    let ocrSource = 'direct';
    let validationStatus = { isSupportedLabReport: true, userMessage: '' };

    // Run On-Device OCR & Deterministic Extraction if file is a supported PDF or Image
    if (file && (isPDFFile(file) || isSupportedImageFile(file))) {
      try {
        onProgress(`Processing "${file.name}" with on-device OCR...`);
        const ocrResult = await performLocalOCR(file, 'eng', onProgress);
        ocrConfidence = ocrResult.confidence || 0;
        ocrSource = ocrResult.source;

        // Perform Medical Document Validation Gate
        validationStatus = validateMedicalDocument(ocrResult.text, {
          fileName: file.name,
          source: ocrResult.source,
        });

        if (validationStatus.isSupportedLabReport) {
          const data = extractHealthData(ocrResult.text, { source: ocrResult.source });
          if (!title && data.title) {
            cleanTitle = data.title;
          }
          if (!date && data.extractedDate) {
            extractedDate = data.extractedDate;
          }
          if (data.reportType === 'cbc') inferredCategory = 'Lab Results';
          else if (data.reportType === 'cardiology') inferredCategory = 'Cardiology';
          else if (!category && data.reportType) inferredCategory = 'Lab Results';

          if (Array.isArray(data.metrics) && data.metrics.length > 0) {
            extractedMetrics = data.metrics;
            extractedResults = data.results || {};
          }
          if (!notes && data.summary) {
            extractionSummary = data.summary;
          }
        }
      } catch (ocrErr) {
        console.warn('Local OCR execution notice:', ocrErr.message);
      }
    }

    let fileMeta = {
      fileType: 'document',
      fileName: file ? file.name : 'medical_record',
      fileSize: file
        ? file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`
        : '0 KB',
      filePath: '',
      fileUrl: '',
      thumbnailUrl: '',
      storageType: 'local',
      folderName: folderName || 'Root Folder',
      relativePath: file?.webkitRelativePath || file?.name || '',
    };

    if (file) {
      onProgress(`Saving "${file.name}" to private medical vault...`);
      const uploadResult = await uploadMedicalFile(file, currentUserId, recordId);
      const ext = file.name.split('.').pop().toLowerCase();
      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
      const isPdfDoc = ext === 'pdf';

      let thumbnail = '';
      if (isPdfDoc) {
        try {
          thumbnail = await renderPdfFirstPageThumbnail(file);
        } catch (thumbErr) {
          console.warn('Cover generation note:', thumbErr);
        }
      } else if (isImg) {
        thumbnail = uploadResult.url;
      }

      fileMeta = {
        fileType: isImg ? 'image' : isPdfDoc ? 'pdf' : 'document',
        fileName: file.name,
        fileSize:
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
        filePath: uploadResult.filePath || '',
        fileUrl: uploadResult.url,
        thumbnailUrl: thumbnail || uploadResult.url || '',
        storageType: uploadResult.storageType,
        folderName: folderName || (file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : 'Root Folder'),
        relativePath: file.webkitRelativePath || file.name,
      };
    }

    const recordDate = formatSqlDate(extractedDate || date);
    const newRecord = {
      id: recordId,
      userId: currentUserId,
      title: cleanTitle.trim(),
      category: inferredCategory,
      provider: provider.trim(),
      doctor: doctor.trim(),
      date: recordDate,
      uploadedAt: new Date().toISOString(),
      ...fileMeta,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [inferredCategory],
      notes: extractionSummary.trim(),
      status: 'Verified',
      extractedMetrics,
      results: extractedResults,
      ocrConfidence,
      ocrSource,
      isMedicalReport: validationStatus.isSupportedLabReport,
      validationMessage: validationStatus.userMessage,
    };

    // Persist in Supabase `reports` table if authenticated & configured
    if (isSupabaseConfigured() && currentUserId && !currentUserId.startsWith('usr_')) {
      onProgress(`Registering report in database...`);
      const inserted = await supabaseInsertReport({
        id: newRecord.id,
        user_id: currentUserId,
        title: newRecord.title,
        category: newRecord.category,
        provider: newRecord.provider,
        doctor: newRecord.doctor,
        date: newRecord.date,
        file_name: newRecord.fileName,
        file_size: newRecord.fileSize,
        file_type: newRecord.fileType,
        file_path: newRecord.filePath, // Stored path: {user_id}/{record_id}/{filename}
        folder_name: newRecord.folderName,
        relative_path: newRecord.relativePath,
        tags: newRecord.tags,
        notes: newRecord.notes,
        status: newRecord.status,
        ocr_confidence: newRecord.ocrConfidence,
        ocr_source: newRecord.ocrSource,
        is_medical_report: newRecord.isMedicalReport,
        validation_message: newRecord.validationMessage,
        extracted_metrics: newRecord.extractedMetrics,
        results: newRecord.results,
      });

      if (inserted?.created_at) {
        newRecord.uploadedAt = inserted.created_at;
      }
    }

    // Immediately update React state so the UI displays the record without delay
    setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);

    return newRecord;
  };

  // Batch upload files/folder with progress tracking
  const addBatchRecords = async (fileList, defaultFolderName = '', onProgress = () => {}) => {
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
        onProgress: (msg) => onProgress(`[File ${i + 1}/${fileList.length}] ${msg}`),
      });
      results.push(rec);
    }
    return results;
  };

  const deleteRecord = async (id) => {
    const recordToDelete = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id));

    let currentUserId = user?.id;
    if ((!currentUserId || currentUserId.startsWith('usr_')) && isSupabaseConfigured()) {
      const authUser = await supabaseGetCurrentUser();
      if (authUser?.id) {
        currentUserId = authUser.id;
      }
    }

    if (currentUserId && !currentUserId.startsWith('usr_') && isSupabaseConfigured() && recordToDelete) {
      try {
        await supabaseDeleteReport(id, currentUserId);
        if (recordToDelete.filePath) {
          await deleteMedicalFile(recordToDelete.filePath);
        }
      } catch (dbErr) {
        console.error('Supabase delete error:', dbErr.message);
      }
    }
  };

  const getRecordById = (id) => {
    return records.find((r) => r.id === id);
  };

  // --------------------------------------------------------------------------
  // Vitals CRUD (Local State)
  // --------------------------------------------------------------------------
  const addVital = async (vitalPoint) => {
    const vitalId = vitalPoint.id || `vit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVital = {
      id: vitalId,
      user_id: user?.id,
      recorded_date: vitalPoint.date || new Date().toISOString().split('T')[0],
      ...vitalPoint,
    };
    setVitals((prev) => [...prev, newVital]);
  };

  const deleteVital = async (id) => {
    setVitals((prev) => prev.filter((v) => v.id !== id));
  };

  // --------------------------------------------------------------------------
  // Prescriptions CRUD (Local State)
  // --------------------------------------------------------------------------
  const addPrescription = async (prescriptionData) => {
    const pId = prescriptionData.id || `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRx = {
      id: pId,
      user_id: user?.id,
      ...prescriptionData,
    };
    setPrescriptions((prev) => [newRx, ...prev]);
    return newRx;
  };

  const deletePrescription = async (id) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  // --------------------------------------------------------------------------
  // Medicines CRUD (Local State)
  // --------------------------------------------------------------------------
  const addMedicine = async (medData) => {
    const medId = medData.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMed = {
      id: medId,
      user_id: user?.id,
      status: 'Active',
      ...medData,
    };
    setMedicines((prev) => [newMed, ...prev]);
    return newMed;
  };

  const updateMedicine = async (id, updates) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMedicine = async (id) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const searchRecords = (query, filters = {}) => {
    return filterMedicalRecords(records, query, filters);
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
        prescriptions,
        medicines,
        stats,
        isLoadingFromCloud,
        addRecord,
        addBatchRecords,
        deleteRecord,
        getRecordById,
        addVital,
        deleteVital,
        addPrescription,
        deletePrescription,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        searchRecords,
        loadUserCloudData,
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
