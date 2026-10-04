import { describe, it, expect, beforeEach } from 'vitest';
import {
  parsePatientQRCode,
  grantDoctorDirectQRAccess,
  verifyDoctorAccessSession,
  getAuthorizedPatientData,
  endDoctorAccessSession,
  DEMO_PATIENT_SESSIONS,
  initLocalAccessSessions,
  createPatientAccessSession,
  initiateDoctorScanAccess,
  revokePatientAccessSession,
  getPatientActiveSession,
  fetchPatientActiveSession,
  subscribeToPatientAccessSession,
  getDoctorPatients,
  clearLocalAccessStore,
} from '../access-session';

describe('Vital Diary — Zero-OTP Direct QR Access Flow', () => {
  beforeEach(() => {
    // Reset local sessions & access logs
    clearLocalAccessStore();
    initLocalAccessSessions();
  });

  describe('parsePatientQRCode', () => {
    it('should correctly parse structured JSON payload with sessionId and patientName', () => {
      const payload = JSON.stringify({
        type: 'vital_diary_access_grant',
        version: 1,
        sessionId: 'vd_sess_eleanor_vance_2026',
        patientName: 'Eleanor Vance',
      });
      const result = parsePatientQRCode(payload);
      expect(result.sessionId).toBe('vd_sess_eleanor_vance_2026');
      expect(result.patientName).toBe('Eleanor Vance');
      expect(result.format).toBe('json');
    });

    it('should correctly parse URL formatted access strings', () => {
      const url = 'https://vitaldiary.app/access?sessionId=vd_sess_marcus_chen_2026&patient=Marcus%20Chen';
      const result = parsePatientQRCode(url);
      expect(result.sessionId).toBe('vd_sess_marcus_chen_2026');
      expect(result.patientName).toBe('Marcus Chen');
      expect(result.format).toBe('url');
    });

    it('should correctly parse plain session token / UUID strings', () => {
      const token = 'vd_sess_custom_token_12345';
      const result = parsePatientQRCode(token);
      expect(result.sessionId).toBe('vd_sess_custom_token_12345');
      expect(result.format).toBe('token');
    });

    it('should reject invalid or empty QR content', () => {
      expect(() => parsePatientQRCode('')).toThrow();
      expect(() => parsePatientQRCode('   ')).toThrow();
      expect(() => parsePatientQRCode('???!!!###')).toThrow();
    });
  });

  describe('Direct QR Access Flow (Zero-OTP)', () => {
    it('should directly grant access when doctor scans the QR code without OTP', async () => {
      const patient = {
        id: 'pat_test_user_42',
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        bloodGroup: 'B+',
      };
      const sampleRecords = [
        { id: 'rec_1', title: 'Blood Chemistry Panel', category: 'Lab Results', date: '2026-09-10' },
        { id: 'rec_2', title: 'Chest Radiograph Report', category: 'Imaging', date: '2026-08-01' },
      ];

      // Stage 1: Patient selects duration & generates QR
      const session = await createPatientAccessSession({
        patient,
        records: sampleRecords,
        durationMinutes: 15,
      });

      expect(session.sessionId).toBeDefined();
      expect(session.sessionId).toContain('pat_test_user_42');
      expect(session.status).toBe('waiting_scan');
      expect(session.qrDataUrl).toBeDefined();
      expect(session.qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);

      // Verify patient active session
      const patientActive = getPatientActiveSession(patient.id);
      expect(patientActive).toBeDefined();
      expect(patientActive.status).toBe('waiting_scan');

      // Stage 2: Doctor scans QR -> Directly Granted Access (NO OTP)
      const doctorUser = { id: 'doc_sarah', name: 'Dr. Sarah Jenkins, MD', specialty: 'Cardiology' };
      const accessResult = await grantDoctorDirectQRAccess(session.sessionId, doctorUser);

      expect(accessResult.success).toBe(true);
      expect(accessResult.patient.name).toBe('Sarah Connor');
      expect(accessResult.doctor.name).toBe('Dr. Sarah Jenkins, MD');
      expect(accessResult.expiresAt).toBeDefined();

      // Check that expiration is approximately 15 minutes from now
      const expTime = new Date(accessResult.expiresAt).getTime();
      const expectedMin = Date.now() + 14 * 60 * 1000;
      const expectedMax = Date.now() + 16 * 60 * 1000;
      expect(expTime).toBeGreaterThan(expectedMin);
      expect(expTime).toBeLessThan(expectedMax);

      // Patient active session is now updated to active with doctor details
      const patientSessionAfterScan = getPatientActiveSession(patient.id);
      expect(patientSessionAfterScan.status).toBe('active');
      expect(patientSessionAfterScan.doctor.name).toBe('Dr. Sarah Jenkins, MD');

      // Stage 3: Doctor immediately reads existing medical records
      const authorizedData = await getAuthorizedPatientData(session.sessionId);
      expect(authorizedData.patient.name).toBe('Sarah Connor');
      expect(authorizedData.records.length).toBe(2);
      expect(authorizedData.records[0].title).toBe('Blood Chemistry Panel');

      // Stage 4: Patient revokes access -> doctor immediately locked out
      await revokePatientAccessSession(session.sessionId, patient.id);
      expect(getPatientActiveSession(patient.id)).toBeNull();

      // Doctor is immediately blocked
      await expect(getAuthorizedPatientData(session.sessionId)).rejects.toThrow();
    });

    it('should support verifyDoctorAccessSession alias directly without OTP', async () => {
      const patient = { id: 'pat_direct_alias', name: 'Direct User' };
      const session = await createPatientAccessSession({ patient, records: [], durationMinutes: 30 });
      const doctorUser = { id: 'doc_1', name: 'Dr. House' };

      const result = await verifyDoctorAccessSession(session.sessionId, doctorUser);
      expect(result.success).toBe(true);
      expect(result.patient.name).toBe('Direct User');
    });
  });

  describe('Doctor Scanned Patients Directory & Existing Patient Re-Access', () => {
    it('should only list scanned patients and zero fake/unscanned patients', async () => {
      const patient = { id: 'pat_scanned_real', name: 'Alice Walker', email: 'alice@example.com' };
      const session = await createPatientAccessSession({ patient, records: [], durationMinutes: 30 });
      const doctorUser = { id: 'doc_1', name: 'Dr. House' };

      await grantDoctorDirectQRAccess(session.sessionId, doctorUser);

      const patientsList = getDoctorPatients();
      expect(patientsList.length).toBe(1);
      expect(patientsList[0].name).toBe('Alice Walker');
    });

    it('should correctly handle Existing Patient Re-Access and never create duplicate patient records', async () => {
      const existingPatient = {
        id: 'pat_registered_jane_doe',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        bloodGroup: 'O+',
      };
      const existingRecords = [
        { id: 'rec_jd_1', title: 'Lipid Panel', category: 'Lab Results', date: '2026-09-01' },
        { id: 'rec_jd_2', title: 'Cardiology ECG', category: 'Cardiology', date: '2026-09-15' },
      ];
      const doctorUser = { id: 'doc_1', name: 'Dr. House', specialty: 'Diagnostic Medicine' };

      // Flow 1: First Session
      const session1 = await createPatientAccessSession({
        patient: existingPatient,
        records: existingRecords,
        durationMinutes: 15,
      });
      await grantDoctorDirectQRAccess(session1.sessionId, doctorUser);

      let patients = getDoctorPatients();
      expect(patients.length).toBe(1);
      expect(patients[0].id).toBe('pat_registered_jane_doe');
      expect(patients[0].name).toBe('Jane Doe');

      // Previous session ends / revoked
      await endDoctorAccessSession(session1.sessionId);

      // Flow 2: Existing patient re-accesses by generating a NEW QR session
      const session2 = await createPatientAccessSession({
        patient: existingPatient,
        records: existingRecords,
        durationMinutes: 30,
      });
      expect(session2.sessionId).not.toBe(session1.sessionId); // Fresh unique temporary session ID

      // Doctor scans new QR -> Directly granted
      const accessResult2 = await grantDoctorDirectQRAccess(session2.sessionId, doctorUser);
      expect(accessResult2.success).toBe(true);

      // Doctor reads same existing patient records
      const authorizedData = await getAuthorizedPatientData(session2.sessionId);
      expect(authorizedData.patient.id).toBe('pat_registered_jane_doe');
      expect(authorizedData.records.length).toBe(2);

      // Doctor patient list must NOT contain duplicate entries for the same patient!
      patients = getDoctorPatients();
      expect(patients.length).toBe(1);
      expect(patients[0].id).toBe('pat_registered_jane_doe');
      expect(patients[0].name).toBe('Jane Doe');
    });

    it('should allow doctor to view existing uploaded reports including PDF file URLs when active access is granted', async () => {
      // Step 1: Patient has existing uploaded reports with PDF files
      const registeredPatient = {
        id: 'pat_registered_arthur_dent',
        name: 'Arthur Dent',
        email: 'arthur.dent@example.com',
        bloodGroup: 'AB+',
        dateOfBirth: '1979-03-11',
      };

      const existingUploadedReports = [
        {
          id: 'rep_arthur_pdf_01',
          userId: registeredPatient.id,
          title: 'Comprehensive Metabolic Panel Report',
          category: 'Lab Results',
          provider: 'Metropolitan Clinical Laboratories',
          doctor: 'Dr. Robert Hayes, MD',
          date: '2026-09-28',
          fileName: 'Arthur_Metabolic_Panel_Sept2026.pdf',
          fileSize: '480 KB',
          fileType: 'pdf',
          filePath: `${registeredPatient.id}/rep_arthur_pdf_01/Arthur_Metabolic_Panel_Sept2026.pdf`,
          fileUrl: 'https://storage.vitaldiary.io/medical-files/Arthur_Metabolic_Panel_Sept2026.pdf',
          tags: ['CMP', 'Metabolic', 'Kidney', 'Liver'],
          notes: 'Fasting panel unremarkable. Normal renal function.',
          status: 'Verified',
          isMedicalReport: true,
          extractedMetrics: [
            { name: 'Fasting Glucose', value: '92', unit: 'mg/dL', status: 'normal' },
            { name: 'Serum Creatinine', value: '0.88', unit: 'mg/dL', status: 'normal' },
          ],
        },
        {
          id: 'rep_arthur_pdf_02',
          userId: registeredPatient.id,
          title: '12-Lead Resting ECG Report',
          category: 'Cardiology',
          provider: 'Heart Rhythm Associates',
          doctor: 'Dr. Michael Sterling, FACC',
          date: '2026-09-15',
          fileName: 'Arthur_ECG_Sept2026.pdf',
          fileSize: '620 KB',
          fileType: 'pdf',
          filePath: `${registeredPatient.id}/rep_arthur_pdf_02/Arthur_ECG_Sept2026.pdf`,
          fileUrl: 'https://storage.vitaldiary.io/medical-files/Arthur_ECG_Sept2026.pdf',
          tags: ['ECG', 'Cardiology', 'Sinus Rhythm'],
          notes: 'Sinus rhythm at 72 bpm. Normal intervals.',
          status: 'Verified',
          isMedicalReport: true,
          extractedMetrics: [
            { name: 'Heart Rate', value: '72', unit: 'bpm', status: 'normal' },
          ],
        },
      ];

      // Step 2: Patient generates temporary QR access session
      const accessSession = await createPatientAccessSession({
        patient: registeredPatient,
        records: existingUploadedReports,
        durationMinutes: 45,
      });

      expect(accessSession.sessionId).toBeDefined();
      expect(accessSession.status).toBe('waiting_scan');

      // Step 3: Doctor scans QR -> Access Granted directly (Zero-OTP)
      const scanningDoctor = {
        id: 'doc_sarah_jenkins',
        name: 'Dr. Sarah Jenkins, MD',
        email: 'sarah.jenkins@vitaldiary.io',
        specialty: 'Cardiology & Internal Medicine',
      };

      const grantResult = await grantDoctorDirectQRAccess(accessSession.sessionId, scanningDoctor);
      expect(grantResult.success).toBe(true);
      expect(grantResult.patient.name).toBe('Arthur Dent');

      // Step 4: Doctor opens patient -> Existing uploaded reports appear
      const patientData = await getAuthorizedPatientData(accessSession.sessionId);
      expect(patientData.patient.id).toBe('pat_registered_arthur_dent');
      expect(patientData.records.length).toBe(2);

      // Step 5: Verify exact existing reports & PDF metadata are present
      const [report1, report2] = patientData.records;
      expect(report1.title).toBe('Comprehensive Metabolic Panel Report');
      expect(report1.fileName).toBe('Arthur_Metabolic_Panel_Sept2026.pdf');
      expect(report1.fileType).toBe('pdf');
      expect(report1.fileUrl).toBe('https://storage.vitaldiary.io/medical-files/Arthur_Metabolic_Panel_Sept2026.pdf');
      expect(report1.extractedMetrics.length).toBe(2);

      expect(report2.title).toBe('12-Lead Resting ECG Report');
      expect(report2.fileName).toBe('Arthur_ECG_Sept2026.pdf');
      expect(report2.fileUrl).toBe('https://storage.vitaldiary.io/medical-files/Arthur_ECG_Sept2026.pdf');

      // Step 6: Session expiration blocks doctor from fetching records
      await endDoctorAccessSession(accessSession.sessionId);
      await expect(getAuthorizedPatientData(accessSession.sessionId)).rejects.toThrow();
    });

    it('should notify patient portal and update active session with real doctor details when QR is scanned', async () => {
      const patient = {
        id: 'pat_realtime_sync_user',
        name: 'Johnathan Archer',
        email: 'archer@starfleet.org',
        bloodGroup: 'O-',
      };
      const reports = [
        { id: 'rep_ja_01', title: 'Pre-flight Medical Clearance', category: 'Lab Results', date: '2026-10-01' },
      ];

      // Patient generates QR
      const session = await createPatientAccessSession({
        patient,
        records: reports,
        durationMinutes: 30,
      });

      // Before scan: Patient portal reads session as waiting_scan
      let patientSession = await fetchPatientActiveSession(patient.id);
      expect(patientSession).toBeDefined();
      expect(patientSession.status).toBe('waiting_scan');
      expect(patientSession.doctor).toBeNull();

      // Doctor scans QR with real doctor identity
      const realDoctor = {
        id: '12345678-1234-1234-1234-123456789abc',
        name: 'Dr. Leonard McCoy, MD',
        email: 'bones@starfleet.org',
        specialty: 'Chief Medical Officer',
        hospital: 'Starfleet General Hospital',
      };

      const grantResult = await grantDoctorDirectQRAccess(session.sessionId, realDoctor);
      expect(grantResult.success).toBe(true);
      expect(grantResult.doctor.name).toBe('Dr. Leonard McCoy, MD');

      // Patient portal immediately detects the update
      patientSession = await fetchPatientActiveSession(patient.id);
      expect(patientSession).toBeDefined();
      expect(patientSession.status).toBe('active');
      expect(patientSession.doctor.name).toBe('Dr. Leonard McCoy, MD');
      expect(patientSession.expiresAt).toBeDefined();

      // Doctor accesses records
      const authorizedData = await getAuthorizedPatientData(session.sessionId);
      expect(authorizedData.patient.name).toBe('Johnathan Archer');
      expect(authorizedData.records.length).toBe(1);
      expect(authorizedData.records[0].title).toBe('Pre-flight Medical Clearance');
    });
  });
});
