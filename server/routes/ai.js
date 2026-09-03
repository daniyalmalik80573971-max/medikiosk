const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const Case = require('../models/Case');

// POST /api/ai/chat - Process conversation message
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, caseId, askedQuestions = [], complaintType, conversationHistory = [] } = req.body;
    
    // Get case if exists
    let caseDoc = null;
    if (caseId) {
      caseDoc = await Case.findById(caseId);
    }
    
    const currentComplaintType = complaintType || (caseDoc?.chiefComplaint ? aiService.detectComplaint(caseDoc.chiefComplaint) : 'general');
    
    // Try OpenAI first
    const aiResult = await aiService.generateAIResponse(message, conversationHistory, {
      patientName: req.user.name,
      age: caseDoc?.basicInfo?.age,
      chiefComplaint: caseDoc?.chiefComplaint,
      askedQuestions
    });
    
    if (aiResult.mode === 'openai' && aiResult.message) {
      // Save message to case
      if (caseDoc) {
        caseDoc.conversation.push({ role: 'assistant', content: aiResult.message });
        await caseDoc.save();
      }
      return res.json({ success: true, message: aiResult.message, mode: 'openai', options: [] });
    }
    
    // Demo mode - get next question
    const nextQuestion = await aiService.getNextQuestion(currentComplaintType, askedQuestions, conversationHistory, caseDoc?.basicInfo);
    
    let responseMessage;
    let options = [];
    let questionId = null;
    let questionType = 'text';
    
    if (nextQuestion) {
      // Acknowledge previous answer
      const acknowledgments = ['Thank you for sharing that.', 'I understand.', 'Got it.', 'Thank you.', 'I see.'];
      const ack = message ? acknowledgments[Math.floor(Math.random() * acknowledgments.length)] + ' ' : '';
      
      responseMessage = ack + nextQuestion.question;
      options = nextQuestion.options || [];
      questionId = nextQuestion.id;
      questionType = nextQuestion.type;
    } else {
      responseMessage = "Thank you for sharing all this information. I have now collected your complete medical history. Please review the summary and click 'Generate Summary' to proceed.";
    }
    
    // Save to case if available
    if (caseDoc && responseMessage) {
      caseDoc.conversation.push({ role: 'assistant', content: responseMessage });
      await caseDoc.save();
    }
    
    // Detect red flags
    const allText = [...conversationHistory.map(m => m.content), message].join(' ');
    const redFlags = aiService.detectRedFlags(allText, currentComplaintType);
    
    res.json({
      success: true,
      message: responseMessage,
      options,
      questionId,
      questionType,
      mode: 'demo',
      redFlags,
      conversationComplete: !nextQuestion
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/detect-complaint
router.post('/detect-complaint', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const complaintType = aiService.detectComplaint(text);
    res.json({ success: true, complaintType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/generate-summary
router.post('/generate-summary', protect, async (req, res) => {
  try {
    const { caseId } = req.body;
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found' });
    
    const summary = aiService.generateSummary(caseDoc);
    const keyFindings = [];
    
    if (caseDoc.chiefComplaint) keyFindings.push(`Chief complaint: ${caseDoc.chiefComplaint}`);
    if (caseDoc.symptoms?.length) keyFindings.push(`${caseDoc.symptoms.length} symptoms documented`);
    if (caseDoc.redFlags?.length) keyFindings.push(`${caseDoc.redFlags.length} red flag(s) detected`);
    
    caseDoc.aiSummary = {
      text: summary,
      generatedAt: new Date(),
      keyFindings
    };
    await caseDoc.save();
    
    res.json({ success: true, summary, keyFindings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
