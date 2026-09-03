const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['assistant', 'patient'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  inputMethod: { type: String, enum: ['text', 'voice', 'selection'], default: 'text' }
});

const symptomSchema = new mongoose.Schema({
  name: String,
  severity: { type: Number, min: 1, max: 10 },
  duration: String,
  frequency: String,
  location: String,
  quality: String,
  modifyingFactors: String
});

const medicationSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  frequency: String,
  duration: String,
  prescribedBy: String
});

const caseSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'reviewed', 'completed', 'cancelled'],
    default: 'draft'
  },
  // Basic Info
  basicInfo: {
    fullName: String,
    age: Number,
    gender: String,
    dateOfBirth: Date,
    phone: String,
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    abhaId: String,
    preferredLanguage: { type: String, default: 'en' }
  },
  // Medical History
  chiefComplaint: String,
  presentIllnessHistory: String,
  symptoms: [symptomSchema],
  pastMedicalHistory: {
    diabetes: Boolean,
    hypertension: Boolean,
    asthma: Boolean,
    heartDisease: Boolean,
    thyroidDisorder: Boolean,
    kidneyDisease: Boolean,
    liverDisease: Boolean,
    cancer: Boolean,
    tuberculosis: Boolean,
    hiv: Boolean,
    other: [String],
    previousHospitalization: String
  },
  surgicalHistory: [{
    procedure: String,
    year: String,
    hospital: String
  }],
  currentMedications: [medicationSchema],
  allergies: {
    drugAllergies: [String],
    foodAllergies: [String],
    otherAllergies: [String]
  },
  familyHistory: {
    diabetes: Boolean,
    hypertension: Boolean,
    heartDisease: Boolean,
    cancer: Boolean,
    other: String
  },
  personalHistory: {
    smoking: { status: String, amount: String, duration: String },
    alcohol: { status: String, amount: String, duration: String },
    exercise: String,
    sleep: String,
    diet: String,
    occupation: String
  },
  // AYUSH specific
  ayushHistory: {
    prakriti: String,
    doshaImbalance: String,
    previousAyurvedicTreatment: String,
    herbalMedications: [String],
    panchakarmaHistory: String
  },
  // AI Conversation
  conversation: [conversationMessageSchema],
  // Documents
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  // Red Flags
  redFlags: [{
    flag: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    description: String,
    acknowledged: { type: Boolean, default: false }
  }],
  // AI Summary
  aiSummary: {
    text: String,
    generatedAt: Date,
    keyFindings: [String],
    recommendedFollowUp: [String]
  },
  // Doctor Review
  doctorNotes: String,
  doctorReview: {
    provisionalDiagnosis: String,
    recommendedInvestigations: [String],
    treatmentPlan: String,
    followUpDate: Date,
    reviewedAt: Date
  },
  // Consent
  consentGiven: { type: Boolean, default: false },
  consentTimestamp: Date,
  // Priority
  priority: { type: String, enum: ['routine', 'urgent', 'emergency'], default: 'routine' },
  completedAt: Date,
  submittedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

caseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.caseId) {
    this.caseId = 'MK' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);
