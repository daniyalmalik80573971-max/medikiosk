const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');
const { generateCaseReport } = require('../services/pdfService');

// GET all cases for patient
router.get('/my-cases', protect, authorize('patient'), async (req, res) => {
  try {
    const cases = await Case.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new case
router.post('/', protect, authorize('patient'), async (req, res) => {
  try {
    const newCase = await Case.create({
      patient: req.user._id,
      ...req.body,
      status: 'draft'
    });
    res.status(201).json({ success: true, case: newCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single case
router.get('/:id', protect, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('documents');
    
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    // Check access
    if (req.user.role === 'patient' && caseDoc.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, case: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update case
router.put('/:id', protect, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    if (req.user.role === 'patient' && caseDoc.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const updates = req.body;
    Object.assign(caseDoc, updates);
    await caseDoc.save();
    
    res.json({ success: true, case: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add conversation message
router.post('/:id/conversation', protect, async (req, res) => {
  try {
    const { message, role, inputMethod } = req.body;
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    caseDoc.conversation.push({ role: role || 'patient', content: message, inputMethod: inputMethod || 'text' });
    await caseDoc.save();
    
    res.json({ success: true, case: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST submit case to doctor
router.post('/:id/submit', protect, authorize('patient'), async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    if (caseDoc.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Generate AI summary
    const summary = aiService.generateSummary(caseDoc);
    caseDoc.aiSummary = { text: summary, generatedAt: new Date() };
    
    // Detect red flags from full conversation
    const fullConversation = caseDoc.conversation.map(m => m.content).join(' ');
    const complaintType = aiService.detectComplaint(caseDoc.chiefComplaint || '');
    const redFlags = aiService.detectRedFlags(fullConversation, complaintType);
    
    if (redFlags.length > 0) {
      caseDoc.redFlags = redFlags;
      const hasCritical = redFlags.some(rf => rf.severity === 'critical');
      caseDoc.priority = hasCritical ? 'emergency' : 'urgent';
    }
    
    caseDoc.status = 'submitted';
    caseDoc.submittedAt = new Date();
    await caseDoc.save();
    
    res.json({ success: true, case: caseDoc, message: 'Case submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET download PDF
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization');
    
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    generateCaseReport(caseDoc, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
