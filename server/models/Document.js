const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  fileName: { type: String, required: true },
  originalName: String,
  fileType: String,
  fileSize: Number,
  filePath: String,
  documentType: {
    type: String,
    enum: ['prescription', 'lab_report', 'discharge_summary', 'xray', 'scan', 'other'],
    default: 'other'
  },
  ocrText: String,
  ocrStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  extractedInfo: {
    medications: [String],
    diagnoses: [String],
    labValues: [{ test: String, value: String, unit: String, normalRange: String }],
    dates: [String],
    doctors: [String]
  },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
