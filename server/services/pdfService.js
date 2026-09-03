const PDFDocument = require('pdfkit');

const generateCaseReport = (caseData, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=MediKiosk_Case_${caseData.caseId}.pdf`);
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).fillColor('#1a56db').text('MediKiosk', { align: 'center' });
  doc.fontSize(12).fillColor('#6b7280').text('AI-Powered Patient Case Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a56db').lineWidth(2).stroke();
  doc.moveDown();
  
  // Case Info
  doc.fontSize(10).fillColor('#374151');
  doc.text(`Case ID: ${caseData.caseId}`, { continued: true });
  doc.text(`   Date: ${new Date(caseData.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.text(`Status: ${caseData.status?.toUpperCase()}`, { continued: true });
  doc.text(`   Priority: ${caseData.priority?.toUpperCase()}`, { align: 'right' });
  doc.moveDown();
  
  // Patient Info
  addSection(doc, 'PATIENT INFORMATION');
  const info = caseData.basicInfo || {};
  addRow(doc, 'Full Name', info.fullName);
  addRow(doc, 'Age / Gender', `${info.age || 'N/A'} years / ${info.gender || 'N/A'}`);
  addRow(doc, 'Phone', info.phone);
  addRow(doc, 'Address', info.address);
  addRow(doc, 'ABHA ID', info.abhaId || 'Not provided');
  if (info.emergencyContact?.name) {
    addRow(doc, 'Emergency Contact', `${info.emergencyContact.name} (${info.emergencyContact.relationship}) - ${info.emergencyContact.phone}`);
  }
  
  // Chief Complaint
  if (caseData.chiefComplaint) {
    addSection(doc, 'CHIEF COMPLAINT');
    doc.fontSize(10).fillColor('#374151').text(caseData.chiefComplaint);
    doc.moveDown();
  }
  
  // Symptoms
  if (caseData.symptoms && caseData.symptoms.length > 0) {
    addSection(doc, 'SYMPTOMS');
    caseData.symptoms.forEach(s => {
      doc.fontSize(10).fillColor('#374151').text(
        `• ${s.name}${s.severity ? ` - Severity: ${s.severity}/10` : ''}${s.duration ? ` - Duration: ${s.duration}` : ''}`
      );
    });
    doc.moveDown();
  }
  
  // Past Medical History
  if (caseData.pastMedicalHistory) {
    const pmh = caseData.pastMedicalHistory;
    const conditions = [];
    if (pmh.diabetes) conditions.push('Diabetes Mellitus');
    if (pmh.hypertension) conditions.push('Hypertension');
    if (pmh.asthma) conditions.push('Asthma');
    if (pmh.heartDisease) conditions.push('Heart Disease');
    if (pmh.thyroidDisorder) conditions.push('Thyroid Disorder');
    if (pmh.other) conditions.push(...pmh.other);
    
    if (conditions.length > 0) {
      addSection(doc, 'PAST MEDICAL HISTORY');
      conditions.forEach(c => doc.fontSize(10).fillColor('#374151').text(`• ${c}`));
      if (pmh.previousHospitalization) {
        doc.text(`• Previous Hospitalization: ${pmh.previousHospitalization}`);
      }
      doc.moveDown();
    }
  }
  
  // Current Medications
  if (caseData.currentMedications && caseData.currentMedications.length > 0) {
    addSection(doc, 'CURRENT MEDICATIONS');
    caseData.currentMedications.forEach(m => {
      doc.fontSize(10).fillColor('#374151').text(`• ${m.name}${m.dosage ? ` - ${m.dosage}` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`);
    });
    doc.moveDown();
  }
  
  // Allergies
  if (caseData.allergies) {
    const allAllergies = [
      ...(caseData.allergies.drugAllergies || []),
      ...(caseData.allergies.foodAllergies || []),
      ...(caseData.allergies.otherAllergies || [])
    ].filter(Boolean);
    if (allAllergies.length > 0) {
      addSection(doc, 'ALLERGIES');
      allAllergies.forEach(a => doc.fontSize(10).fillColor('#dc2626').text(`⚠ ${a}`));
      doc.moveDown();
    }
  }
  
  // Red Flags
  if (caseData.redFlags && caseData.redFlags.length > 0) {
    addSection(doc, '⚠️ RED FLAGS (FOR DOCTOR ATTENTION)', '#dc2626');
    caseData.redFlags.forEach(rf => {
      doc.fontSize(10).fillColor('#dc2626').text(`[${rf.severity?.toUpperCase()}] ${rf.flag}`);
    });
    doc.moveDown();
  }
  
  // AI Summary
  if (caseData.aiSummary?.text) {
    addSection(doc, 'AI GENERATED SUMMARY');
    doc.fontSize(9).fillColor('#374151').text(caseData.aiSummary.text);
    doc.moveDown();
  }
  
  // Doctor Notes
  if (caseData.doctorNotes) {
    addSection(doc, 'DOCTOR NOTES');
    doc.fontSize(10).fillColor('#374151').text(caseData.doctorNotes);
    doc.moveDown();
  }
  
  if (caseData.doctorReview?.provisionalDiagnosis) {
    addSection(doc, 'DOCTOR REVIEW');
    if (caseData.doctorReview.provisionalDiagnosis) addRow(doc, 'Provisional Diagnosis', caseData.doctorReview.provisionalDiagnosis);
    if (caseData.doctorReview.treatmentPlan) addRow(doc, 'Treatment Plan', caseData.doctorReview.treatmentPlan);
    if (caseData.doctorReview.recommendedInvestigations?.length) {
      addRow(doc, 'Recommended Investigations', caseData.doctorReview.recommendedInvestigations.join(', '));
    }
    doc.moveDown();
  }
  
  // Footer
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor('#9ca3af').text(
    'This report was generated by MediKiosk AI. It is for informational purposes only and does not constitute a medical diagnosis. Diagnosis and treatment decisions are the sole responsibility of the treating physician.',
    { align: 'center' }
  );
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
  
  doc.end();
};

function addSection(doc, title, color = '#1a56db') {
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor(color).text(title);
  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor(color).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function addRow(doc, label, value) {
  if (!value) return;
  doc.fontSize(10)
    .fillColor('#6b7280').text(`${label}: `, { continued: true })
    .fillColor('#374151').text(String(value));
}

module.exports = { generateCaseReport };
