const express = require('express');
const router = express.Router();
const path = require('path');
const Document = require('../models/Document');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST upload document
router.post('/upload', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const doc = await Document.create({
      patient: req.user._id,
      case: req.body.caseId || null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      documentType: req.body.documentType || 'other',
      ocrStatus: 'pending'
    });
    
    // If case ID provided, link document to case
    if (req.body.caseId) {
      await Case.findByIdAndUpdate(req.body.caseId, { $push: { documents: doc._id } });
    }
    
    // Trigger OCR in background (non-blocking)
    processOCR(doc._id, req.file.path).catch(console.error);
    
    res.status(201).json({
      success: true,
      document: doc,
      message: 'Document uploaded. OCR processing started.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET documents for patient
router.get('/my-documents', protect, authorize('patient'), async (req, res) => {
  try {
    const docs = await Document.find({ patient: req.user._id }).sort({ uploadedAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single document with OCR text
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

async function processOCR(docId, filePath) {
  try {
    const Tesseract = require('tesseract.js');
    const doc = await Document.findById(docId);
    doc.ocrStatus = 'processing';
    await doc.save();
    
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
      doc.ocrText = text;
      doc.ocrStatus = 'completed';
    } else {
      doc.ocrText = 'OCR not supported for this file type. Please upload image files for OCR processing.';
      doc.ocrStatus = 'completed';
    }
    
    await doc.save();
  } catch (err) {
    console.error('OCR error:', err);
    const doc = await Document.findById(docId);
    if (doc) {
      doc.ocrStatus = 'failed';
      await doc.save();
    }
  }
}

module.exports = router;
