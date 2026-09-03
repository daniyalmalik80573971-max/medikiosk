const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { generateCaseReport } = require('../services/pdfService');

// GET doctor's queue
router.get('/queue', protect, authorize('doctor'), async (req, res) => {
  try {
    const cases = await Case.find({ status: { $in: ['submitted', 'under_review'] } })
      .populate('patient', 'name email phone gender')
      .sort({ priority: -1, submittedAt: 1 })
      .limit(50);
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all reviewed cases by this doctor
router.get('/reviewed', protect, authorize('doctor'), async (req, res) => {
  try {
    const cases = await Case.find({ doctor: req.user._id, status: { $in: ['reviewed', 'completed'] } })
      .populate('patient', 'name email phone')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET stats for doctor
router.get('/stats', protect, authorize('doctor'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalQueue, todayReviewed, totalReviewed, urgent] = await Promise.all([
      Case.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Case.countDocuments({ doctor: req.user._id, status: 'reviewed', updatedAt: { $gte: today } }),
      Case.countDocuments({ doctor: req.user._id }),
      Case.countDocuments({ status: 'submitted', priority: { $in: ['urgent', 'emergency'] } })
    ]);
    
    res.json({ success: true, stats: { totalQueue, todayReviewed, totalReviewed, urgent } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT review a case
router.put('/cases/:id/review', protect, authorize('doctor'), async (req, res) => {
  try {
    const { doctorNotes, provisionalDiagnosis, recommendedInvestigations, treatmentPlan, followUpDate } = req.body;
    
    const caseDoc = await Case.findByIdAndUpdate(
      req.params.id,
      {
        doctor: req.user._id,
        doctorNotes,
        status: 'reviewed',
        doctorReview: {
          provisionalDiagnosis,
          recommendedInvestigations: recommendedInvestigations || [],
          treatmentPlan,
          followUpDate,
          reviewedAt: new Date()
        }
      },
      { new: true }
    ).populate('patient', 'name email phone');
    
    res.json({ success: true, case: caseDoc, message: 'Case reviewed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single case for doctor
router.get('/cases/:id', protect, authorize('doctor'), async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('patient', 'name email phone gender dateOfBirth address')
      .populate('documents');
    
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    // Mark as under review
    if (caseDoc.status === 'submitted') {
      caseDoc.status = 'under_review';
      if (!caseDoc.doctor) caseDoc.doctor = req.user._id;
      await caseDoc.save();
    }
    
    res.json({ success: true, case: caseDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
