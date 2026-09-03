const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

// GET all users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all cases
router.get('/cases', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const cases = await Case.find(filter)
      .populate('patient', 'name email')
      .populate('doctor', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Case.countDocuments(filter);
    res.json({ success: true, cases, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET system stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalCases, pendingCases, todayCases, emergencyCases] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      Case.countDocuments(),
      Case.countDocuments({ status: 'submitted' }),
      Case.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Case.countDocuments({ priority: 'emergency', status: { $in: ['submitted', 'under_review'] } })
    ]);
    
    res.json({ success: true, stats: { totalPatients, totalDoctors, totalCases, pendingCases, todayCases, emergencyCases } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update user status
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create doctor account
router.post('/create-doctor', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.create({ ...req.body, role: 'doctor' });
    res.status(201).json({ success: true, user: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
