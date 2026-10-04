/**
 * Export Clinical Lab Insights PDF Generator
 * 
 * Generates a clean, professional, minimal, and downloadable report suitable
 * for sharing directly with a doctor.
 * 
 * Contains:
 * - Patient Demographics & Report Timeline
 * - Important Findings Table (Values, Units, Reference Ranges, Status)
 * - Structured Abnormal Findings Breakdown (Meaning, Possible Causes, General Management, Doctor Consult Criteria)
 * - Evidence-Based Clinical Sources & Citations
 * - Clinical Educational Disclaimer & Healthcare Provider Review Section
 * 
 * 100% Deterministic & Local.
 */

export function exportReportInsightsPdf(analysis, patientInfo = {}) {
  if (!analysis) return;

  const patientName = patientInfo.name || 'Patient Record';
  const patientEmail = patientInfo.email || '';
  const patientId = patientInfo.id ? patientInfo.id.slice(0, 10) : 'PT-VAULT';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const abnormalRowsHtml = analysis.findings
    .map((f) => {
      const isAbn = f.isAbnormal;
      const statusBadge = f.status === 'high'
        ? '<span style="color: #c2410c; font-weight: 700; background: #fff7ed; padding: 2px 8px; border-radius: 4px; border: 1px solid #ffedd5;">HIGH</span>'
        : f.status === 'low'
        ? '<span style="color: #0369a1; font-weight: 700; background: #f0f9ff; padding: 2px 8px; border-radius: 4px; border: 1px solid #e0f2fe;">LOW</span>'
        : '<span style="color: #047857; font-weight: 600; background: #ecfdf5; padding: 2px 8px; border-radius: 4px; border: 1px solid #d1fae5;">NORMAL</span>';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${isAbn ? 'background-color: #fafaf9;' : ''}">
          <td style="padding: 9px 12px; font-weight: 600; color: #1e293b;">${escapeHtml(f.displayName || f.name)}</td>
          <td style="padding: 9px 12px; font-weight: 700; color: ${isAbn ? '#0f172a' : '#334155'};">${escapeHtml(f.displayValue || `${f.value} ${f.unit}`)}</td>
          <td style="padding: 9px 12px; color: #64748b; font-size: 13px;">${escapeHtml(f.referenceRangeString || 'Standard Range')}</td>
          <td style="padding: 9px 12px; text-align: center;">${statusBadge}</td>
        </tr>
      `;
    })
    .join('');

  const detailedAbnormalHtml = analysis.abnormalItems.length === 0
    ? `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center; color: #065f46;">
        <strong>All Tested Parameters Within Normal Reference Ranges</strong>
        <p style="margin: 4px 0 0; font-size: 13px; color: #047857;">No abnormal biomarker flags detected in this lab report.</p>
      </div>
    `
    : analysis.abnormalItems
        .map((item, idx) => {
          const causesList = item.commonCauses.map((c) => `<li>${escapeHtml(c)}</li>`).join('');
          const mgmtList = item.management.map((m) => `<li>${escapeHtml(m)}</li>`).join('');
          const consultList = item.whenToConsultDoctor.map((d) => `<li>${escapeHtml(d)}</li>`).join('');
          const sourcesList = item.sources
            .map((s) => `<span><strong>${escapeHtml(s.name)}</strong>: ${escapeHtml(s.topic)}</span>`)
            .join(' &bull; ');

          return `
            <div style="margin-bottom: 24px; padding: 18px; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 8px; background: #ffffff; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                    ${idx + 1}. ${escapeHtml(item.displayName)}: ${escapeHtml(item.displayValue)}
                  </h3>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                    Report Reference Range: <strong>${escapeHtml(item.referenceRangeString)}</strong> &bull; Status: <strong style="color: ${item.status === 'high' ? '#c2410c' : '#0369a1'};">${item.status.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              <div style="margin-top: 10px; font-size: 13px; color: #334155; line-height: 1.5;">
                <strong style="color: #0f172a;">What this means:</strong> ${escapeHtml(item.meaning)}
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
                <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  <strong style="font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
                    Common Possible Causes:
                  </strong>
                  <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #334155; line-height: 1.4;">
                    ${causesList}
                  </ul>
                </div>

                <div style="background: #f0fdf4; padding: 10px 12px; border-radius: 6px; border: 1px solid #bbf7d0;">
                  <strong style="font-size: 12px; text-transform: uppercase; color: #166534; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
                    General Ways to Manage / Improve:
                  </strong>
                  <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #14532d; line-height: 1.4;">
                    ${mgmtList}
                  </ul>
                </div>
              </div>

              <div style="margin-top: 10px; background: #fffbeb; padding: 10px 12px; border-radius: 6px; border: 1px solid #fef3c7;">
                <strong style="font-size: 12px; text-transform: uppercase; color: #92400e; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
                  When Medical Consultation May Be Appropriate:
                </strong>
                <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #78350f; line-height: 1.4;">
                  ${consultList}
                </ul>
              </div>

              ${
                sourcesList
                  ? `
                <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
                  <em>Evidence Sources:</em> ${sourcesList}
                </div>
              `
                  : ''
              }
            </div>
          `;
        })
        .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Vital Diary - Clinical Insights Report (${escapeHtml(analysis.reportTitle)})</title>
      <style>
        @page {
          size: A4;
          margin: 18mm 15mm 18mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          line-height: 1.45;
          margin: 0;
          padding: 24px;
        }
        h1, h2, h3, h4 {
          color: #0f172a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 20px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Top Action Bar for interactive preview -->
      <div class="no-print" style="background: #f1f5f9; padding: 12px 18px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #059669; font-size: 15px;">Vital Diary &bull; Clinical Insights PDF Report</strong>
          <div style="font-size: 12px; color: #64748b;">Ready to view, download, or share with your doctor.</div>
        </div>
        <div>
          <button onclick="window.print()" style="background: #059669; color: #ffffff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px;">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; margin-left: 8px;">
            Close
          </button>
        </div>
      </div>

      <!-- Professional Header -->
      <div style="border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="background: #059669; color: #ffffff; font-weight: 900; font-size: 14px; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em;">
              VITAL DIARY
            </div>
            <span style="font-size: 13px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.08em;">
              Clinical Lab Insights Summary
            </span>
          </div>
          <h1 style="margin: 4px 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">
            ${escapeHtml(analysis.reportTitle)}
          </h1>
          <div style="font-size: 13px; color: #475569; margin-top: 3px;">
            Category: <strong>${escapeHtml(analysis.reportCategory)}</strong> &bull; Report Date: <strong>${escapeHtml(analysis.reportDate)}</strong> &bull; Provider: <strong>${escapeHtml(analysis.provider)}</strong>
          </div>
        </div>

        <div style="text-align: right; font-size: 12px; color: #475569;">
          <div>Patient: <strong style="color: #0f172a;">${escapeHtml(patientName)}</strong></div>
          ${patientEmail ? `<div>${escapeHtml(patientEmail)}</div>` : ''}
          <div>Exported: <strong>${currentDate}</strong></div>
        </div>
      </div>

      <!-- Overview Stats Strip -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Parameters Tested</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px;">${analysis.totalTested}</div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #166534;">Normal Values</div>
          <div style="font-size: 20px; font-weight: 800; color: #15803d; margin-top: 2px;">${analysis.normalCount}</div>
        </div>
        <div style="background: ${analysis.abnormalCount > 0 ? '#fff7ed' : '#f8fafc'}; border: 1px solid ${analysis.abnormalCount > 0 ? '#fed7aa' : '#e2e8f0'}; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${analysis.abnormalCount > 0 ? '#c2410c' : '#64748b'};">Abnormal Flags</div>
          <div style="font-size: 20px; font-weight: 800; color: ${analysis.abnormalCount > 0 ? '#c2410c' : '#64748b'}; margin-top: 2px;">${analysis.abnormalCount}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Methodology</div>
          <div style="font-size: 13px; font-weight: 700; color: #059669; margin-top: 6px;">Deterministic Sourced</div>
        </div>
      </div>

      <!-- Section 1: All Tested Parameters Summary Table -->
      <h2 style="font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 8px;">
        1. Complete Lab Parameter Findings & Reference Intervals
      </h2>
      <table>
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
            <th style="padding: 8px 12px;">Parameter</th>
            <th style="padding: 8px 12px;">Measured Value</th>
            <th style="padding: 8px 12px;">Reference Interval</th>
            <th style="padding: 8px 12px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody style="font-size: 13px;">
          ${abnormalRowsHtml}
        </tbody>
      </table>

      <!-- Section 2: Abnormal Findings Analysis & Doctor Discussion Points -->
      <div style="margin-top: 28px;">
        <h2 style="font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 16px;">
          2. Detailed Breakdown for Abnormal Values & Clinical Guidance
        </h2>
        ${detailedAbnormalHtml}
      </div>

      <!-- Clinical Educational Disclaimer -->
      <div style="margin-top: 32px; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #64748b; line-height: 1.5; page-break-inside: avoid;">
        <strong style="color: #334155; display: block; margin-bottom: 2px;">Clinical & Educational Purpose Notice:</strong>
        This summary is generated deterministically from patient medical records and published evidence-based clinical references (NIH MedlinePlus, Mayo Clinic, CDC, AHA) for patient education and preparation for consultation with a licensed healthcare provider. It does not provide medical diagnosis, prescription, or treatment. Clinical decisions must always be made in consultation with a qualified doctor.
      </div>

      <!-- Doctor Notes & Review Section -->
      <div style="margin-top: 24px; padding: 16px; border: 1px dashed #cbd5e1; border-radius: 6px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Healthcare Provider Review / Clinical Notes:</span>
          <span style="font-size: 12px; color: #94a3b8;">Signature & Date: _______________________</span>
        </div>
        <div style="border-bottom: 1px dotted #e2e8f0; height: 16px;"></div>
        <div style="border-bottom: 1px dotted #e2e8f0; height: 16px;"></div>
      </div>
    </body>
    </html>
  `;

  // 1. Create a Blob of the complete HTML report document
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  // 2. Automatically trigger a direct file download
  const cleanTitle = (analysis.reportTitle || 'Medical_Record')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = `VitalDiary_Insights_${cleanTitle}.html`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // 3. Open the document in a new tab without triggering any print popups
  const viewerWindow = window.open(blobUrl, '_blank');
  if (viewerWindow) {
    viewerWindow.focus();
  }

  // Revoke object URL after timeout
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
