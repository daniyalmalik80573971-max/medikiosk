/**
 * MediKiosk Server - Self-Contained Edition
 * Works with MongoDB OR without it (uses nedb file-based embedded DB as fallback)
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medikiosk_super_secret_jwt_key_2024';

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads dir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Database Setup (nedb embedded - no MongoDB needed) ───────
const Datastore = require('nedb-promises');
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = {
  users:     Datastore.create({ filename: path.join(dbDir, 'users.db'),     autoload: true }),
  cases:     Datastore.create({ filename: path.join(dbDir, 'cases.db'),     autoload: true }),
  documents: Datastore.create({ filename: path.join(dbDir, 'documents.db'), autoload: true }),
};

// Expose db globally for routes
global.db = db;
global.JWT_SECRET = JWT_SECRET;

// ─── Auth Helpers ─────────────────────────────────────────────
const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    const { password: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  next();
};

global.protect = protect;
global.authorize = authorize;
global.generateToken = generateToken;
global.bcrypt = bcrypt;

// ─── Seed Demo Data ────────────────────────────────────────────
const seedDemoData = async () => {
  const adminExists = await db.users.findOne({ email: 'admin@medikiosk.com' });
  if (adminExists) return; // Already seeded

  console.log('🌱 Seeding demo data...');
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const admin = await db.users.insert({ name: 'Admin User', email: 'admin@medikiosk.com', password: hash('Admin@123'), role: 'admin', isActive: true, createdAt: new Date() });
  const doctor = await db.users.insert({ name: 'Dr. Priya Sharma', email: 'doctor@medikiosk.com', password: hash('Doctor@123'), role: 'doctor', specialization: 'Ayurveda & Internal Medicine', licenseNumber: 'AIIA/2020/001', department: 'OPD', phone: '9876543210', isActive: true, createdAt: new Date() });
  const patient = await db.users.insert({ name: 'Rahul Verma', email: 'patient@medikiosk.com', password: hash('Patient@123'), role: 'patient', phone: '9988776655', gender: 'male', isActive: true, createdAt: new Date() });

  // Sample case
  await db.cases.insert({
    caseId: 'MK' + Date.now().toString().slice(-8) + 'DEMO',
    patient: patient._id,
    doctor: doctor._id,
    status: 'reviewed',
    priority: 'routine',
    basicInfo: { fullName: 'Rahul Verma', age: 34, gender: 'male', phone: '9988776655', address: 'New Delhi, India' },
    chiefComplaint: 'Headache and fever for 3 days',
    symptoms: [{ name: 'Headache', severity: 6, duration: '3 days' }, { name: 'Fever', severity: 5, duration: '3 days' }],
    pastMedicalHistory: { hypertension: true },
    currentMedications: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' }],
    allergies: { drugAllergies: ['Penicillin'], foodAllergies: [] },
    aiSummary: { text: 'Patient Rahul Verma, 34M presents with 3-day history of headache and fever.\nKnown hypertensive on Amlodipine 5mg OD. Penicillin allergy noted.\nNo red flags detected.', generatedAt: new Date() },
    doctorNotes: 'Viral fever likely. Advised rest, paracetamol 500mg TDS, adequate hydration. Follow up in 3 days if fever persists.',
    doctorReview: { provisionalDiagnosis: 'Viral Fever', recommendedInvestigations: ['CBC', 'CRP'], treatmentPlan: 'Rest, antipyretics, hydration', reviewedAt: new Date() },
    conversation: [
      { role: 'assistant', content: 'Hello Rahul! I will help collect your medical history. What health problem brings you here today?' },
      { role: 'patient', content: 'I have been having headache and fever for 3 days' },
      { role: 'assistant', content: 'When did the headache start?' },
      { role: 'patient', content: '3 days ago, sudden onset' },
    ],
    redFlags: [],
    consentGiven: true,
    submittedAt: new Date(Date.now() - 2 * 86400000),
    createdAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date()
  });

  console.log('✅ Demo data seeded!');
  console.log('   Patient: patient@medikiosk.com / Patient@123');
  console.log('   Doctor:  doctor@medikiosk.com / Doctor@123');
  console.log('   Admin:   admin@medikiosk.com / Admin@123');
};

// ─── AI Service ────────────────────────────────────────────────
const COMPLAINT_FLOWS = {
  chest_pain: {
    keywords: ['chest pain','chest ache','chest pressure','heart pain','chest tightness','chest discomfort'],
    questions: [
      { id: 'cp_onset', question: 'When did the chest pain start?', type: 'text' },
      { id: 'cp_location', question: 'Where exactly is the pain in your chest?', type: 'options', options: ['Center of chest','Left side','Right side','Whole chest','Lower chest'] },
      { id: 'cp_quality', question: 'How would you describe the pain?', type: 'options', options: ['Sharp/stabbing','Dull/aching','Pressure/squeezing','Burning','Crushing'] },
      { id: 'cp_severity', question: 'On a scale of 1 to 10, how severe is the pain?', type: 'scale' },
      { id: 'cp_radiation', question: 'Does the pain spread to any other part of your body?', type: 'options', options: ['No radiation','Left arm','Jaw/neck','Back','Right arm'] },
      { id: 'cp_breathing', question: 'Do you have any difficulty breathing along with the chest pain?', type: 'options', options: ['No','Yes, mild difficulty','Yes, severe difficulty'] },
      { id: 'cp_sweating', question: 'Are you experiencing sweating or dizziness?', type: 'options', options: ['No','Sweating only','Dizziness only','Both sweating and dizziness'] },
      { id: 'cp_cardiac_history', question: 'Do you have any previous heart-related problems?', type: 'options', options: ['No','Yes - heart attack before','Yes - angina','Yes - other heart problem','Not sure'] },
    ],
    redFlags: [
      { trigger: 'crushing', flag: 'Crushing chest pain - possible cardiac emergency', severity: 'critical' },
      { trigger: 'left arm', flag: 'Chest pain radiating to left arm - possible ACS', severity: 'critical' },
      { trigger: 'severe difficulty', flag: 'Chest pain with severe breathing difficulty', severity: 'critical' },
      { trigger: 'sweating', flag: 'Chest pain with diaphoresis', severity: 'high' },
    ]
  },
  headache: {
    keywords: ['headache','head pain','head ache','migraine','head hurts'],
    questions: [
      { id: 'ha_onset', question: 'When did the headache start?', type: 'text' },
      { id: 'ha_location', question: 'Where is the headache located?', type: 'options', options: ['Forehead','One side of head','Both sides','Back of head','Around eyes'] },
      { id: 'ha_severity', question: 'How severe is the headache on a scale of 1 to 10?', type: 'scale' },
      { id: 'ha_quality', question: 'How would you describe the headache?', type: 'options', options: ['Throbbing/pulsating','Constant pressure','Sharp/stabbing','Band-like tightness','Burning'] },
      { id: 'ha_nausea', question: 'Do you have nausea or vomiting with the headache?', type: 'options', options: ['No','Nausea only','Vomiting','Both'] },
      { id: 'ha_fever', question: 'Do you have fever along with the headache?', type: 'options', options: ['No fever','Mild fever','High fever','Not checked'] },
      { id: 'ha_vision', question: 'Have you noticed any changes in your vision?', type: 'options', options: ['No changes','Blurred vision','Double vision','Flashes of light','Loss of vision'] },
      { id: 'ha_neck', question: 'Do you have neck stiffness?', type: 'options', options: ['No','Mild neck stiffness','Severe neck stiffness'] },
      { id: 'ha_triggers', question: 'Did the headache start suddenly like a thunderclap, or gradually?', type: 'options', options: ['Gradual onset','Sudden onset','Thunderclap - worst headache of my life'] },
    ],
    redFlags: [
      { trigger: 'thunderclap', flag: 'Thunderclap headache - possible subarachnoid hemorrhage', severity: 'critical' },
      { trigger: 'worst headache', flag: 'Worst headache of life - urgent evaluation needed', severity: 'critical' },
      { trigger: 'neck stiffness', flag: 'Headache with neck stiffness - possible meningitis', severity: 'high' },
      { trigger: 'loss of vision', flag: 'Headache with vision loss', severity: 'high' },
    ]
  },
  fever: {
    keywords: ['fever','temperature','chills','body hot','high temperature'],
    questions: [
      { id: 'fv_onset', question: 'How long have you had the fever?', type: 'text' },
      { id: 'fv_temperature', question: 'What is your temperature reading (if measured)?', type: 'text' },
      { id: 'fv_pattern', question: 'How does the fever behave?', type: 'options', options: ['Continuous high fever','Comes and goes','Higher in evenings','Higher in mornings','Not sure'] },
      { id: 'fv_chills', question: 'Do you have chills or shivering?', type: 'options', options: ['No','Mild chills','Severe shivering/rigors'] },
      { id: 'fv_associated', question: 'What other symptoms do you have with fever?', type: 'options', options: ['Cough','Cold/runny nose','Body aches','Headache','Rash','Diarrhea','Vomiting','None'] },
    ],
    redFlags: [
      { trigger: 'severe shivering', flag: 'High fever with rigors - possible serious infection', severity: 'high' },
      { trigger: 'rash', flag: 'Fever with rash - requires urgent evaluation', severity: 'high' },
    ]
  },
  abdominal_pain: {
    keywords: ['stomach pain','abdominal pain','belly pain','stomach ache','tummy pain','abdomen pain'],
    questions: [
      { id: 'ap_onset', question: 'How long have you had this stomach pain?', type: 'text' },
      { id: 'ap_location', question: 'Where exactly is the pain?', type: 'options', options: ['Upper center','Upper right','Upper left','Around belly button','Lower right','Lower left','Whole abdomen'] },
      { id: 'ap_severity', question: 'How severe is the pain on a scale of 1 to 10?', type: 'scale' },
      { id: 'ap_nausea', question: 'Do you have nausea or vomiting?', type: 'options', options: ['No','Nausea only','Vomiting','Vomiting blood'] },
      { id: 'ap_bowel', question: 'Any changes in bowel movements?', type: 'options', options: ['No changes','Diarrhea','Constipation','Blood in stool','Black tarry stool'] },
    ],
    redFlags: [
      { trigger: 'vomiting blood', flag: 'Vomiting blood - possible GI emergency', severity: 'critical' },
      { trigger: 'blood in stool', flag: 'Blood in stool - urgent evaluation needed', severity: 'high' },
      { trigger: 'black tarry stool', flag: 'Melena - possible GI bleed', severity: 'critical' },
    ]
  },
  general: {
    keywords: [],
    questions: [
      { id: 'gen_duration', question: 'How long have you been experiencing this problem?', type: 'text' },
      { id: 'gen_severity', question: 'How much is this affecting your daily life?', type: 'options', options: ['Very little','Somewhat','Significantly','Cannot perform daily activities'] },
      { id: 'gen_similar', question: 'Have you had a similar problem before?', type: 'options', options: ['No, first time','Yes, once before','Yes, recurring problem'] },
      { id: 'gen_treatment', question: 'Have you taken any medicines for this?', type: 'text' },
    ],
    redFlags: []
  }
};

const FOLLOWUP_QUESTIONS = [
  { id: 'past_conditions', question: 'Do you have any existing medical conditions?', type: 'options', options: ['None','Diabetes','High Blood Pressure','Asthma','Heart Disease','Thyroid Problems','Kidney Disease'] },
  { id: 'medications', question: 'Are you currently taking any medicines regularly?', type: 'text' },
  { id: 'allergies_q', question: 'Are you allergic to any medicines or foods?', type: 'text' },
  { id: 'family_history', question: 'Does anyone in your family have diabetes, heart disease, or high blood pressure?', type: 'options', options: ['No family history','Diabetes runs in family','Heart disease in family','Hypertension in family','Multiple conditions'] },
  { id: 'smoking', question: 'Do you smoke or use tobacco?', type: 'options', options: ['Never smoked','Former smoker','Current smoker - light','Current smoker - heavy','Tobacco chewing'] },
  { id: 'alcohol', question: 'Do you drink alcohol?', type: 'options', options: ['Never','Occasionally','Regularly but moderately','Heavy drinker'] },
];

const detectComplaint = (text) => {
  const lower = (text || '').toLowerCase();
  for (const [key, flow] of Object.entries(COMPLAINT_FLOWS)) {
    if (key === 'general') continue;
    if (flow.keywords.some(k => lower.includes(k))) return key;
  }
  return 'general';
};

const detectRedFlags = (text, complaintType) => {
  const lower = (text || '').toLowerCase();
  const flags = [];
  const flow = COMPLAINT_FLOWS[complaintType];
  if (flow?.redFlags) {
    flow.redFlags.forEach(rf => { if (lower.includes(rf.trigger)) flags.push(rf); });
  }
  if (lower.includes('unconscious') || lower.includes('fainted')) flags.push({ flag: 'Loss of consciousness reported', severity: 'critical' });
  if (lower.includes('seizure') || lower.includes('convulsion') || lower.includes('fits')) flags.push({ flag: 'Seizure/convulsion reported', severity: 'critical' });
  if (lower.includes('severe bleeding') || lower.includes('heavy bleeding')) flags.push({ flag: 'Heavy bleeding reported', severity: 'critical' });
  return flags;
};

const generateSummary = (c) => {
  let s = `PATIENT CASE SUMMARY\n${'='.repeat(50)}\n\n`;
  s += `Patient: ${c.basicInfo?.fullName || 'N/A'}, ${c.basicInfo?.age || 'N/A'} years, ${c.basicInfo?.gender || 'N/A'}\n`;
  s += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;
  s += `CHIEF COMPLAINT:\n${c.chiefComplaint || 'Not provided'}\n\n`;
  if (c.symptoms?.length) {
    s += `SYMPTOMS:\n`;
    c.symptoms.forEach(sym => { s += `- ${sym.name}${sym.severity ? ` (Severity: ${sym.severity}/10)` : ''}${sym.duration ? ` for ${sym.duration}` : ''}\n`; });
    s += '\n';
  }
  if (c.pastMedicalHistory) {
    const conds = [];
    if (c.pastMedicalHistory.diabetes) conds.push('Diabetes');
    if (c.pastMedicalHistory.hypertension) conds.push('Hypertension');
    if (c.pastMedicalHistory.asthma) conds.push('Asthma');
    if (c.pastMedicalHistory.heartDisease) conds.push('Heart Disease');
    if (conds.length) s += `PAST MEDICAL HISTORY:\n${conds.join(', ')}\n\n`;
  }
  if (c.currentMedications?.length) {
    s += `CURRENT MEDICATIONS:\n`;
    c.currentMedications.forEach(m => { s += `- ${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` ${m.frequency}` : ''}\n`; });
    s += '\n';
  }
  const allergies = [...(c.allergies?.drugAllergies || []), ...(c.allergies?.foodAllergies || [])].filter(Boolean);
  if (allergies.length) s += `ALLERGIES: ${allergies.join(', ')}\n\n`;
  if (c.redFlags?.length) {
    s += `⚠️ RED FLAGS DETECTED (FOR DOCTOR REVIEW):\n`;
    c.redFlags.forEach(rf => { s += `- [${(rf.severity || '').toUpperCase()}] ${rf.flag}\n`; });
    s += '\n';
  }
  s += `\n---\nThis summary was generated by MediKiosk AI.\nFinal diagnosis and treatment to be determined by the treating physician.\n`;
  return s;
};

global.aiService = { detectComplaint, detectRedFlags, generateSummary, COMPLAINT_FLOWS, FOLLOWUP_QUESTIONS };

// ─── PDF Service ───────────────────────────────────────────────
const generateCaseReport = (caseData, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=MediKiosk_${caseData.caseId || 'Case'}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1a56db').text('MediKiosk', { align: 'center' });
    doc.fontSize(11).fillColor('#6b7280').text('AI-Powered Patient Case Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a56db').lineWidth(2).stroke();
    doc.moveDown();

    const addSection = (title, color = '#1a56db') => {
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(color).text(title);
      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor(color).lineWidth(0.5).stroke();
      doc.moveDown(0.5);
    };
    const addRow = (label, value) => {
      if (!value) return;
      doc.fontSize(10).fillColor('#6b7280').text(`${label}: `, { continued: true }).fillColor('#374151').text(String(value));
    };

    doc.fontSize(10).fillColor('#374151');
    doc.text(`Case ID: ${caseData.caseId || 'N/A'}`);
    doc.text(`Date: ${new Date(caseData.createdAt || Date.now()).toLocaleDateString('en-IN')}`);
    doc.text(`Status: ${(caseData.status || '').toUpperCase()}  |  Priority: ${(caseData.priority || 'routine').toUpperCase()}`);
    doc.moveDown();

    const info = caseData.basicInfo || {};
    addSection('PATIENT INFORMATION');
    addRow('Full Name', info.fullName);
    addRow('Age / Gender', `${info.age || 'N/A'} years / ${info.gender || 'N/A'}`);
    addRow('Phone', info.phone);
    addRow('Address', info.address);
    addRow('ABHA ID', info.abhaId || 'Not provided');

    if (caseData.chiefComplaint) {
      addSection('CHIEF COMPLAINT');
      doc.fontSize(10).fillColor('#374151').text(caseData.chiefComplaint);
      doc.moveDown();
    }

    if (caseData.symptoms?.length) {
      addSection('SYMPTOMS');
      caseData.symptoms.forEach(s => doc.fontSize(10).fillColor('#374151').text(`• ${s.name}${s.severity ? ` - Severity: ${s.severity}/10` : ''}${s.duration ? ` - Duration: ${s.duration}` : ''}`));
      doc.moveDown();
    }

    if (caseData.redFlags?.length) {
      addSection('⚠️ RED FLAGS', '#dc2626');
      caseData.redFlags.forEach(rf => doc.fontSize(10).fillColor('#dc2626').text(`[${(rf.severity || '').toUpperCase()}] ${rf.flag}`));
      doc.moveDown();
    }

    if (caseData.aiSummary?.text) {
      addSection('AI GENERATED SUMMARY');
      doc.fontSize(9).fillColor('#374151').text(caseData.aiSummary.text);
      doc.moveDown();
    }

    if (caseData.doctorNotes) {
      addSection('DOCTOR NOTES');
      doc.fontSize(10).fillColor('#374151').text(caseData.doctorNotes);
      if (caseData.doctorReview?.provisionalDiagnosis) {
        doc.text(`Provisional Diagnosis: ${caseData.doctorReview.provisionalDiagnosis}`);
      }
      doc.moveDown();
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#9ca3af').text('MediKiosk AI - For informational purposes only. Not a medical diagnosis. All decisions are the responsibility of the treating physician.', { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'PDF generation failed' });
  }
};
global.generateCaseReport = generateCaseReport;

// ─── AUTH ROUTES ──────────────────────────────────────────────
const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, gender, dateOfBirth } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (await db.users.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.users.insert({ name, email, password: hashed, role: role || 'patient', phone, gender, dateOfBirth, isActive: true, createdAt: new Date(), lastLogin: new Date() });
    const token = generateToken(user._id);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ success: true, message: 'Registration successful', token, user: safeUser });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await db.users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    await db.users.update({ _id: user._id }, { $set: { lastLogin: new Date() } });
    const token = generateToken(user._id);
    const { password: _, ...safeUser } = user;
    res.json({ success: true, message: 'Login successful', token, user: safeUser });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

authRouter.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

authRouter.put('/profile', protect, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; delete updates.role; delete updates.email; delete updates._id;
    await db.users.update({ _id: req.user._id }, { $set: { ...updates, updatedAt: new Date() } });
    const user = await db.users.findOne({ _id: req.user._id });
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use('/api/auth', authRouter);

// ─── CASES ROUTES ─────────────────────────────────────────────
const casesRouter = express.Router();

const makeCaseId = () => 'MK' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

casesRouter.get('/my-cases', protect, authorize('patient'), async (req, res) => {
  try {
    const cases = await db.cases.find({ patient: req.user._id });
    cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Populate doctor names
    for (const c of cases) {
      if (c.doctor) {
        const doc = await db.users.findOne({ _id: c.doctor });
        if (doc) c.doctorName = doc.name;
      }
    }
    res.json({ success: true, cases });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

casesRouter.post('/', protect, authorize('patient'), async (req, res) => {
  try {
    const newCase = await db.cases.insert({ ...req.body, caseId: makeCaseId(), patient: req.user._id, status: 'draft', createdAt: new Date(), updatedAt: new Date() });
    res.status(201).json({ success: true, case: newCase });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

casesRouter.get('/:id', protect, async (req, res) => {
  try {
    const c = await db.cases.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    if (req.user.role === 'patient' && c.patient !== req.user._id) return res.status(403).json({ success: false, message: 'Access denied' });
    if (c.doctor) { const doc = await db.users.findOne({ _id: c.doctor }); if (doc) c.doctor = { _id: doc._id, name: doc.name, specialization: doc.specialization }; }
    const patient = await db.users.findOne({ _id: c.patient });
    if (patient) c.patientInfo = { name: patient.name, email: patient.email, phone: patient.phone };
    c.documents = await db.documents.find({ case: c._id });
    res.json({ success: true, case: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

casesRouter.put('/:id', protect, async (req, res) => {
  try {
    const c = await db.cases.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    if (req.user.role === 'patient' && c.patient !== req.user._id) return res.status(403).json({ success: false, message: 'Access denied' });
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    await db.cases.update({ _id: req.params.id }, { $set: updates });
    const updated = await db.cases.findOne({ _id: req.params.id });
    res.json({ success: true, case: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

casesRouter.post('/:id/conversation', protect, async (req, res) => {
  try {
    const { message, role, inputMethod } = req.body;
    const c = await db.cases.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    const conv = c.conversation || [];
    conv.push({ role: role || 'patient', content: message, inputMethod: inputMethod || 'text', timestamp: new Date() });
    await db.cases.update({ _id: req.params.id }, { $set: { conversation: conv, updatedAt: new Date() } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

casesRouter.post('/:id/submit', protect, authorize('patient'), async (req, res) => {
  try {
    const c = await db.cases.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    if (c.patient !== req.user._id) return res.status(403).json({ success: false, message: 'Access denied' });
    const summary = global.aiService.generateSummary(c);
    const fullText = (c.conversation || []).map(m => m.content).join(' ') + ' ' + (c.chiefComplaint || '');
    const complaintType = global.aiService.detectComplaint(c.chiefComplaint || '');
    const redFlags = global.aiService.detectRedFlags(fullText, complaintType);
    const priority = redFlags.some(r => r.severity === 'critical') ? 'emergency' : redFlags.length > 0 ? 'urgent' : 'routine';
    await db.cases.update({ _id: req.params.id }, { $set: { status: 'submitted', submittedAt: new Date(), updatedAt: new Date(), aiSummary: { text: summary, generatedAt: new Date() }, redFlags, priority } });
    const updated = await db.cases.findOne({ _id: req.params.id });
    res.json({ success: true, case: updated, message: 'Case submitted successfully!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

casesRouter.get('/:id/pdf', protect, async (req, res) => {
  try {
    const c = await db.cases.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    generateCaseReport(c, res);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use('/api/cases', casesRouter);

// ─── PATIENTS ROUTES ──────────────────────────────────────────
const patientsRouter = express.Router();
patientsRouter.get('/dashboard', protect, authorize('patient'), async (req, res) => {
  try {
    const allCases = await db.cases.find({ patient: req.user._id });
    allCases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const stats = {
      totalCases: allCases.length,
      submittedCases: allCases.filter(c => c.status === 'submitted').length,
      reviewedCases: allCases.filter(c => ['reviewed', 'completed'].includes(c.status)).length,
      pendingCases: allCases.filter(c => c.status === 'draft').length,
    };
    const recentCases = allCases.slice(0, 5);
    for (const c of recentCases) {
      if (c.doctor && typeof c.doctor === 'string') {
        const doc = await db.users.findOne({ _id: c.doctor });
        if (doc) c.doctor = { name: doc.name };
      }
    }
    res.json({ success: true, stats, recentCases });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
app.use('/api/patients', patientsRouter);

// ─── AI ROUTES ────────────────────────────────────────────────
const aiRouter = express.Router();

aiRouter.post('/detect-complaint', protect, async (req, res) => {
  const { text } = req.body;
  res.json({ success: true, complaintType: global.aiService.detectComplaint(text) });
});

aiRouter.post('/chat', protect, async (req, res) => {
  try {
    const { message, caseId, askedQuestions = [], complaintType = 'general', conversationHistory = [] } = req.body;
    const currentType = complaintType || 'general';
    const flow = COMPLAINT_FLOWS[currentType] || COMPLAINT_FLOWS.general;

    // Find next unasked question
    let nextQ = null;
    for (const q of flow.questions) {
      if (!askedQuestions.includes(q.id)) { nextQ = q; break; }
    }
    if (!nextQ) {
      for (const q of FOLLOWUP_QUESTIONS) {
        if (!askedQuestions.includes(q.id)) { nextQ = q; break; }
      }
    }

    const acks = ['Thank you for sharing that. ', 'I understand. ', 'Got it. ', 'Thank you. '];
    const ack = message ? acks[Math.floor(Math.random() * acks.length)] : '';
    let responseMessage, options = [], questionId = null, conversationComplete = false;

    if (nextQ) {
      responseMessage = ack + nextQ.question;
      options = nextQ.options || [];
      questionId = nextQ.id;
    } else {
      responseMessage = 'Thank you for sharing all this information. I have collected your complete medical history. Please click "Generate Summary" to proceed.';
      conversationComplete = true;
    }

    // Save to case
    if (caseId && message) {
      const c = await db.cases.findOne({ _id: caseId });
      if (c) {
        const conv = c.conversation || [];
        if (message) conv.push({ role: 'patient', content: message, timestamp: new Date() });
        if (responseMessage) conv.push({ role: 'assistant', content: responseMessage, timestamp: new Date() });
        await db.cases.update({ _id: caseId }, { $set: { conversation: conv } });
      }
    }

    // Detect red flags
    const allText = [...conversationHistory.map(m => m.content), message].join(' ');
    const redFlags = global.aiService.detectRedFlags(allText, currentType);

    res.json({ success: true, message: responseMessage, options, questionId, mode: 'demo', redFlags, conversationComplete });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

aiRouter.post('/generate-summary', protect, async (req, res) => {
  try {
    const { caseId } = req.body;
    const c = await db.cases.findOne({ _id: caseId });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    const summary = global.aiService.generateSummary(c);
    const keyFindings = [];
    if (c.chiefComplaint) keyFindings.push(`Chief complaint: ${c.chiefComplaint}`);
    if (c.symptoms?.length) keyFindings.push(`${c.symptoms.length} symptoms documented`);
    if (c.redFlags?.length) keyFindings.push(`${c.redFlags.length} red flag(s) detected`);
    await db.cases.update({ _id: caseId }, { $set: { aiSummary: { text: summary, generatedAt: new Date(), keyFindings } } });
    res.json({ success: true, summary, keyFindings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use('/api/ai', aiRouter);

// ─── DOCTORS ROUTES ───────────────────────────────────────────
const doctorsRouter = express.Router();

doctorsRouter.get('/stats', protect, authorize('doctor'), async (req, res) => {
  try {
    const allCases = await db.cases.find({});
    const today = new Date(); today.setHours(0, 0, 0, 0);
    res.json({ success: true, stats: {
      totalQueue: allCases.filter(c => ['submitted', 'under_review'].includes(c.status)).length,
      todayReviewed: allCases.filter(c => c.doctor === req.user._id && c.status === 'reviewed' && new Date(c.updatedAt) >= today).length,
      totalReviewed: allCases.filter(c => c.doctor === req.user._id).length,
      urgent: allCases.filter(c => ['submitted', 'under_review'].includes(c.status) && ['urgent', 'emergency'].includes(c.priority)).length,
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

doctorsRouter.get('/queue', protect, authorize('doctor'), async (req, res) => {
  try {
    let cases = await db.cases.find({ status: { $in: ['submitted', 'under_review'] } });
    cases.sort((a, b) => {
      const p = { emergency: 0, urgent: 1, routine: 2 };
      return (p[a.priority] || 2) - (p[b.priority] || 2);
    });
    for (const c of cases) {
      const pat = await db.users.findOne({ _id: c.patient });
      if (pat) c.patient = { _id: pat._id, name: pat.name, email: pat.email, phone: pat.phone, gender: pat.gender };
    }
    res.json({ success: true, cases });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

doctorsRouter.get('/cases/:id', protect, authorize('doctor'), async (req, res) => {
  try {
    const c = await db.cases.findOne({ _id: req.params.id });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    if (c.status === 'submitted') {
      await db.cases.update({ _id: req.params.id }, { $set: { status: 'under_review', doctor: req.user._id } });
      c.status = 'under_review';
    }
    const pat = await db.users.findOne({ _id: c.patient });
    if (pat) c.patient = { name: pat.name, email: pat.email, phone: pat.phone, gender: pat.gender };
    c.documents = await db.documents.find({ case: c._id });
    res.json({ success: true, case: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

doctorsRouter.put('/cases/:id/review', protect, authorize('doctor'), async (req, res) => {
  try {
    const { doctorNotes, provisionalDiagnosis, recommendedInvestigations, treatmentPlan, followUpDate } = req.body;
    await db.cases.update({ _id: req.params.id }, { $set: {
      doctor: req.user._id, doctorNotes, status: 'reviewed', updatedAt: new Date(),
      doctorReview: { provisionalDiagnosis, recommendedInvestigations: recommendedInvestigations || [], treatmentPlan, followUpDate, reviewedAt: new Date() }
    }});
    const c = await db.cases.findOne({ _id: req.params.id });
    res.json({ success: true, case: c, message: 'Case reviewed successfully!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use('/api/doctors', doctorsRouter);

// ─── ADMIN ROUTES ─────────────────────────────────────────────
const adminRouter = express.Router();

adminRouter.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [users, cases] = await Promise.all([db.users.find({}), db.cases.find({})]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    res.json({ success: true, stats: {
      totalPatients: users.filter(u => u.role === 'patient').length,
      totalDoctors: users.filter(u => u.role === 'doctor').length,
      totalCases: cases.length,
      pendingCases: cases.filter(c => c.status === 'submitted').length,
      todayCases: cases.filter(c => new Date(c.createdAt) >= today).length,
      emergencyCases: cases.filter(c => c.priority === 'emergency' && ['submitted', 'under_review'].includes(c.status)).length,
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adminRouter.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    let users = role ? await db.users.find({ role }) : await db.users.find({});
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    users = users.map(u => { const { password, ...s } = u; return s; });
    res.json({ success: true, users, total: users.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adminRouter.get('/cases', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let cases = status ? await db.cases.find({ status }) : await db.cases.find({});
    cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    for (const c of cases) {
      const pat = await db.users.findOne({ _id: c.patient });
      if (pat) c.patient = { name: pat.name, email: pat.email };
      if (c.doctor && typeof c.doctor === 'string') {
        const doc = await db.users.findOne({ _id: c.doctor });
        if (doc) c.doctor = { name: doc.name };
      }
    }
    res.json({ success: true, cases, total: cases.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

adminRouter.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await db.users.update({ _id: req.params.id }, { $set: req.body });
    const user = await db.users.findOne({ _id: req.params.id });
    const { password, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use('/api/admin', adminRouter);

// ─── DOCUMENTS ROUTES ─────────────────────────────────────────
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, req.user._id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const docsRouter = express.Router();

docsRouter.post('/upload', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const doc = await db.documents.insert({
      patient: req.user._id, case: req.body.caseId || null,
      fileName: req.file.filename, originalName: req.file.originalname,
      fileType: req.file.mimetype, fileSize: req.file.size, filePath: req.file.path,
      documentType: req.body.documentType || 'other', ocrStatus: 'pending', uploadedAt: new Date()
    });
    if (req.body.caseId) {
      const c = await db.cases.findOne({ _id: req.body.caseId });
      if (c) {
        const docs = c.documents || [];
        docs.push(doc._id);
        await db.cases.update({ _id: req.body.caseId }, { $set: { documents: docs } });
      }
    }
    // Run OCR in background
    processOCR(doc._id, req.file.path).catch(console.error);
    res.status(201).json({ success: true, document: doc, message: 'Document uploaded. OCR processing started.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

docsRouter.get('/my-documents', protect, authorize('patient'), async (req, res) => {
  try {
    const docs = await db.documents.find({ patient: req.user._id });
    docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ success: true, documents: docs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

docsRouter.get('/:id', protect, async (req, res) => {
  try {
    const doc = await db.documents.findOne({ _id: req.params.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, document: doc });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

async function processOCR(docId, filePath) {
  try {
    await db.documents.update({ _id: docId }, { $set: { ocrStatus: 'processing' } });
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
      await db.documents.update({ _id: docId }, { $set: { ocrText: text, ocrStatus: 'completed' } });
    } else {
      await db.documents.update({ _id: docId }, { $set: { ocrText: 'OCR supported for image files only (JPG, PNG). PDF text extraction requires additional setup.', ocrStatus: 'completed' } });
    }
  } catch (err) {
    console.error('OCR error:', err.message);
    await db.documents.update({ _id: docId }, { $set: { ocrStatus: 'failed' } });
  }
}

app.use('/api/documents', docsRouter);

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'nedb (embedded)', timestamp: new Date() }));

// ─── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── START ────────────────────────────────────────────────────
const start = async () => {
  await seedDemoData();
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   MediKiosk Server Running!              ║');
    console.log(`║   http://localhost:${PORT}                 ║`);
    console.log('║   Database: nedb (embedded, no setup!)   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('\n📧 Demo Login Credentials:');
    console.log('   Patient: patient@medikiosk.com / Patient@123');
    console.log('   Doctor:  doctor@medikiosk.com / Doctor@123');
    console.log('   Admin:   admin@medikiosk.com / Admin@123\n');
  });
};

start().catch(console.error);
module.exports = app;
