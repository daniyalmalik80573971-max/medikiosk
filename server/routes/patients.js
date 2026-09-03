const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

// GET patient dashboard stats
router.get('/dashboard', protect, authorize('patient'), async (req, res) => {
  try {
    const [totalCases, submittedCases, reviewedCases, pendingCases] = await Promise.all([
      Case.countDocuments({ patient: req.user._id }),
      Case.countDocuments({ patient: req.user._id, status: 'submitted' }),
      Case.countDocuments({ patient: req.user._id, status: { $in: ['reviewed', 'completed'] } }),
      Case.countDocuments({ patient: req.user._id, status: 'draft' })
    ]);
    
    const recentCases = await Case.find({ patient: req.user._id })
      .populate('doctor', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      stats: { totalCases, submittedCases, reviewedCases, pendingCases },
      recentCases
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
