const COMPLAINT_FLOWS = {
  chest_pain: {
    keywords: ['chest pain', 'chest ache', 'chest pressure', 'heart pain', 'chest tightness', 'chest discomfort'],
    questions: [
      { id: 'cp_onset', question: 'When did the chest pain start?', type: 'text' },
      { id: 'cp_location', question: 'Can you point to exactly where in your chest you feel the pain?', type: 'options', options: ['Center of chest', 'Left side', 'Right side', 'Whole chest', 'Lower chest'] },
      { id: 'cp_quality', question: 'How would you describe the pain?', type: 'options', options: ['Sharp/stabbing', 'Dull/aching', 'Pressure/squeezing', 'Burning', 'Crushing'] },
      { id: 'cp_severity', question: 'On a scale of 1 to 10, how severe is the pain? (1 = very mild, 10 = worst possible)', type: 'scale' },
      { id: 'cp_radiation', question: 'Does the pain spread to any other part of your body?', type: 'options', options: ['No radiation', 'Left arm', 'Jaw/neck', 'Back', 'Right arm', 'Stomach'] },
      { id: 'cp_breathing', question: 'Do you have any difficulty breathing along with the chest pain?', type: 'options', options: ['No', 'Yes, mild difficulty', 'Yes, severe difficulty'] },
      { id: 'cp_sweating', question: 'Are you experiencing sweating or dizziness?', type: 'options', options: ['No', 'Sweating only', 'Dizziness only', 'Both sweating and dizziness'] },
      { id: 'cp_cardiac_history', question: 'Do you have any previous heart-related problems or has any doctor told you about heart issues?', type: 'options', options: ['No', 'Yes - heart attack before', 'Yes - angina', 'Yes - other heart problem', 'Not sure'] },
      { id: 'cp_triggers', question: 'Does anything make the pain better or worse?', type: 'text' }
    ],
    redFlags: [
      { trigger: 'crushing', flag: 'Crushing chest pain - possible cardiac emergency', severity: 'critical' },
      { trigger: 'radiation', flag: 'Chest pain with radiation - possible ACS', severity: 'critical' },
      { trigger: 'severe difficulty', flag: 'Chest pain with severe breathing difficulty', severity: 'critical' },
      { trigger: 'sweating', flag: 'Chest pain with diaphoresis', severity: 'high' }
    ]
  },
  headache: {
    keywords: ['headache', 'head pain', 'head ache', 'migraine', 'head hurts'],
    questions: [
      { id: 'ha_onset', question: 'When did the headache start?', type: 'text' },
      { id: 'ha_location', question: 'Where is the headache located?', type: 'options', options: ['Forehead', 'One side of head', 'Both sides', 'Back of head', 'Top of head', 'Around eyes'] },
      { id: 'ha_severity', question: 'How severe is the headache on a scale of 1 to 10?', type: 'scale' },
      { id: 'ha_quality', question: 'How would you describe the headache?', type: 'options', options: ['Throbbing/pulsating', 'Constant pressure', 'Sharp/stabbing', 'Band-like tightness', 'Burning'] },
      { id: 'ha_nausea', question: 'Do you have nausea or vomiting with the headache?', type: 'options', options: ['No', 'Nausea only', 'Vomiting', 'Both nausea and vomiting'] },
      { id: 'ha_fever', question: 'Do you have fever along with the headache?', type: 'options', options: ['No fever', 'Mild fever', 'High fever', 'Not checked'] },
      { id: 'ha_vision', question: 'Have you noticed any changes in your vision?', type: 'options', options: ['No vision changes', 'Blurred vision', 'Double vision', 'Flashes of light', 'Loss of vision'] },
      { id: 'ha_neck', question: 'Do you have neck stiffness or pain?', type: 'options', options: ['No', 'Mild neck stiffness', 'Severe neck stiffness'] },
      { id: 'ha_triggers', question: 'Did the headache start suddenly like a thunderclap, or gradually?', type: 'options', options: ['Gradual onset', 'Sudden onset', 'Thunderclap - worst headache of my life'] }
    ],
    redFlags: [
      { trigger: 'thunderclap', flag: 'Thunderclap headache - possible subarachnoid hemorrhage', severity: 'critical' },
      { trigger: 'worst headache', flag: 'Worst headache of life - requires urgent evaluation', severity: 'critical' },
      { trigger: 'neck stiffness', flag: 'Headache with neck stiffness - possible meningitis', severity: 'high' },
      { trigger: 'loss of vision', flag: 'Headache with vision loss', severity: 'high' }
    ]
  },
  fever: {
    keywords: ['fever', 'temperature', 'hot body', 'chills', 'body hot'],
    questions: [
      { id: 'fv_onset', question: 'How long have you had the fever?', type: 'text' },
      { id: 'fv_temperature', question: 'What is your temperature reading? (if measured)', type: 'text' },
      { id: 'fv_pattern', question: 'How does the fever behave?', type: 'options', options: ['Continuous high fever', 'Comes and goes', 'Higher in evenings', 'Higher in mornings', 'Not sure'] },
      { id: 'fv_chills', question: 'Do you have chills or shivering?', type: 'options', options: ['No', 'Mild chills', 'Severe shivering/rigors'] },
      { id: 'fv_associated', question: 'What other symptoms do you have along with fever?', type: 'options', options: ['Cough', 'Cold/runny nose', 'Body aches', 'Headache', 'Rash', 'Diarrhea', 'Vomiting', 'None of these'] },
      { id: 'fv_travel', question: 'Have you traveled anywhere recently?', type: 'options', options: ['No recent travel', 'Traveled in India', 'International travel', 'Stayed home'] },
      { id: 'fv_urine', question: 'Have you noticed any changes in urination?', type: 'options', options: ['No changes', 'Burning during urination', 'Increased frequency', 'Dark colored urine', 'Reduced urine'] }
    ],
    redFlags: [
      { trigger: 'severe shivering', flag: 'High fever with rigors - possible serious infection', severity: 'high' },
      { trigger: 'rash', flag: 'Fever with rash - requires urgent evaluation', severity: 'high' }
    ]
  },
  abdominal_pain: {
    keywords: ['stomach pain', 'abdominal pain', 'belly pain', 'stomach ache', 'tummy pain', 'abdomen'],
    questions: [
      { id: 'ap_onset', question: 'How long have you had this stomach pain?', type: 'text' },
      { id: 'ap_location', question: 'Where exactly is the pain in your abdomen?', type: 'options', options: ['Upper center (above belly button)', 'Upper right', 'Upper left', 'Around belly button', 'Lower right', 'Lower left', 'Lower center', 'Whole abdomen'] },
      { id: 'ap_severity', question: 'How severe is the pain on a scale of 1 to 10?', type: 'scale' },
      { id: 'ap_quality', question: 'How would you describe the pain?', type: 'options', options: ['Cramping/colicky', 'Constant dull ache', 'Sharp stabbing', 'Burning', 'Bloating/fullness'] },
      { id: 'ap_nausea', question: 'Do you have nausea or vomiting?', type: 'options', options: ['No', 'Nausea only', 'Vomiting', 'Vomiting blood'] },
      { id: 'ap_bowel', question: 'Any changes in your bowel movements?', type: 'options', options: ['No changes', 'Diarrhea', 'Constipation', 'Blood in stool', 'Black tarry stool'] },
      { id: 'ap_relation', question: 'Is the pain related to eating?', type: 'options', options: ['No relation to food', 'Worse after eating', 'Better after eating', 'Worse on empty stomach'] }
    ],
    redFlags: [
      { trigger: 'vomiting blood', flag: 'Vomiting blood - possible GI emergency', severity: 'critical' },
      { trigger: 'blood in stool', flag: 'Blood in stool - requires urgent evaluation', severity: 'high' },
      { trigger: 'black tarry stool', flag: 'Melena (black tarry stool) - possible GI bleed', severity: 'critical' }
    ]
  },
  breathing: {
    keywords: ['breathing difficulty', 'shortness of breath', 'breathlessness', 'cannot breathe', 'dyspnea'],
    questions: [
      { id: 'br_onset', question: 'When did you start having difficulty breathing?', type: 'text' },
      { id: 'br_severity', question: 'How severe is your breathing difficulty?', type: 'options', options: ['Mild - only on exertion', 'Moderate - interferes with daily activities', 'Severe - at rest', 'Very severe - cannot speak full sentences'] },
      { id: 'br_cough', question: 'Do you have cough along with breathing difficulty?', type: 'options', options: ['No cough', 'Dry cough', 'Cough with phlegm - white/clear', 'Cough with yellow/green phlegm', 'Cough with blood'] },
      { id: 'br_wheezing', question: 'Do you hear any whistling or wheezing sound when you breathe?', type: 'options', options: ['No', 'Yes, mild wheeze', 'Yes, loud wheezing'] },
      { id: 'br_position', question: 'Does your breathing improve when you sit up or does it happen only when lying down?', type: 'options', options: ['Same in all positions', 'Worse when lying down', 'Better when sitting up', 'Cannot lie flat'] },
      { id: 'br_history', question: 'Do you have any history of asthma, COPD, or heart problems?', type: 'options', options: ['No', 'Asthma', 'COPD/emphysema', 'Heart problems', 'Not sure'] }
    ],
    redFlags: [
      { trigger: 'very severe', flag: 'Severe breathlessness - possible respiratory emergency', severity: 'critical' },
      { trigger: 'cough with blood', flag: 'Hemoptysis (coughing blood) - urgent evaluation needed', severity: 'critical' },
      { trigger: 'cannot lie flat', flag: 'Orthopnea - possible cardiac/pulmonary emergency', severity: 'high' }
    ]
  },
  general: {
    keywords: [],
    questions: [
      { id: 'gen_duration', question: 'How long have you been experiencing this problem?', type: 'text' },
      { id: 'gen_severity', question: 'How much is this affecting your daily life?', type: 'options', options: ['Very little', 'Somewhat', 'Significantly', 'Cannot perform daily activities'] },
      { id: 'gen_similar', question: 'Have you had a similar problem before?', type: 'options', options: ['No, first time', 'Yes, once before', 'Yes, multiple times', 'Yes, it is a recurring problem'] },
      { id: 'gen_treatment', question: 'Have you taken any medications or treatment for this problem?', type: 'text' },
      { id: 'gen_worsen', question: 'What makes your symptoms worse?', type: 'text' },
      { id: 'gen_better', question: 'What makes your symptoms better?', type: 'text' }
    ],
    redFlags: []
  }
};

const FOLLOWUP_QUESTIONS = [
  { id: 'past_conditions', question: 'Do you have any of these existing medical conditions? (Select all that apply)', type: 'multiselect', options: ['Diabetes', 'High Blood Pressure (Hypertension)', 'Asthma', 'Heart Disease', 'Thyroid Problems', 'Kidney Disease', 'None of the above'] },
  { id: 'medications', question: 'Are you currently taking any medicines regularly?', type: 'text' },
  { id: 'allergies', question: 'Are you allergic to any medicines or foods?', type: 'text' },
  { id: 'family_history', question: 'Does anyone in your immediate family have diabetes, heart disease, or high blood pressure?', type: 'options', options: ['No family history', 'Diabetes runs in family', 'Heart disease in family', 'Hypertension in family', 'Multiple conditions'] },
  { id: 'smoking', question: 'Do you smoke or use tobacco?', type: 'options', options: ['Never smoked', 'Former smoker - quit', 'Current smoker - light (< 10 cigarettes/day)', 'Current smoker - heavy (> 10 cigarettes/day)', 'Tobacco chewing'] },
  { id: 'alcohol', question: 'Do you drink alcohol?', type: 'options', options: ['Never', 'Occasionally (social drinking)', 'Regularly but moderately', 'Heavy drinker'] }
];

function detectComplaint(text) {
  const lowerText = text.toLowerCase();
  for (const [key, flow] of Object.entries(COMPLAINT_FLOWS)) {
    if (key === 'general') continue;
    for (const keyword of flow.keywords) {
      if (lowerText.includes(keyword)) return key;
    }
  }
  return 'general';
}

function detectRedFlags(conversationText, complaintType) {
  const redFlags = [];
  const lowerText = conversationText.toLowerCase();
  const flow = COMPLAINT_FLOWS[complaintType];
  if (flow && flow.redFlags) {
    for (const rf of flow.redFlags) {
      if (lowerText.includes(rf.trigger)) {
        redFlags.push(rf);
      }
    }
  }
  // Universal red flags
  if (lowerText.includes('unconscious') || lowerText.includes('fainted')) {
    redFlags.push({ flag: 'Loss of consciousness reported', severity: 'critical' });
  }
  if (lowerText.includes('paralysis') || lowerText.includes('cannot move')) {
    redFlags.push({ flag: 'Possible paralysis - stroke symptoms', severity: 'critical' });
  }
  if (lowerText.includes('seizure') || lowerText.includes('convulsion') || lowerText.includes('fits')) {
    redFlags.push({ flag: 'Seizure/convulsion reported', severity: 'critical' });
  }
  if (lowerText.includes('severe bleeding') || lowerText.includes('heavy bleeding')) {
    redFlags.push({ flag: 'Heavy bleeding reported', severity: 'critical' });
  }
  return redFlags;
}

function generateSummary(caseData) {
  const { basicInfo, chiefComplaint, symptoms, pastMedicalHistory, currentMedications, allergies, familyHistory, personalHistory, ayushHistory, redFlags } = caseData;
  
  let summary = `PATIENT CASE SUMMARY\n${'='.repeat(50)}\n\n`;
  summary += `Patient: ${basicInfo?.fullName || 'Not provided'}, ${basicInfo?.age || 'N/A'} years, ${basicInfo?.gender || 'N/A'}\n`;
  summary += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;
  
  summary += `CHIEF COMPLAINT:\n${chiefComplaint || 'Not provided'}\n\n`;
  
  if (symptoms && symptoms.length > 0) {
    summary += `SYMPTOMS:\n`;
    symptoms.forEach(s => {
      summary += `- ${s.name}${s.severity ? ` (Severity: ${s.severity}/10)` : ''}${s.duration ? ` for ${s.duration}` : ''}\n`;
    });
    summary += '\n';
  }
  
  if (pastMedicalHistory) {
    const conditions = [];
    if (pastMedicalHistory.diabetes) conditions.push('Diabetes');
    if (pastMedicalHistory.hypertension) conditions.push('Hypertension');
    if (pastMedicalHistory.asthma) conditions.push('Asthma');
    if (pastMedicalHistory.heartDisease) conditions.push('Heart Disease');
    if (pastMedicalHistory.other) conditions.push(...pastMedicalHistory.other);
    if (conditions.length > 0) {
      summary += `PAST MEDICAL HISTORY:\n${conditions.join(', ')}\n\n`;
    }
  }
  
  if (currentMedications && currentMedications.length > 0) {
    summary += `CURRENT MEDICATIONS:\n`;
    currentMedications.forEach(m => {
      summary += `- ${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` ${m.frequency}` : ''}\n`;
    });
    summary += '\n';
  }
  
  if (allergies) {
    const allergyList = [...(allergies.drugAllergies || []), ...(allergies.foodAllergies || [])].filter(Boolean);
    if (allergyList.length > 0) {
      summary += `ALLERGIES: ${allergyList.join(', ')}\n\n`;
    }
  }
  
  if (redFlags && redFlags.length > 0) {
    summary += `⚠️ RED FLAGS DETECTED (FOR DOCTOR REVIEW):\n`;
    redFlags.forEach(rf => {
      summary += `- [${rf.severity?.toUpperCase()}] ${rf.flag}\n`;
    });
    summary += '\n';
  }
  
  summary += `\n---\nThis summary was generated by MediKiosk AI. It is for informational purposes only.\nFinal diagnosis and treatment to be determined by the treating physician.\n`;
  
  return summary;
}

const getNextQuestion = async (complaintType, askedQuestions, conversationHistory, basicInfo) => {
  const flow = COMPLAINT_FLOWS[complaintType] || COMPLAINT_FLOWS.general;
  
  // Find first unasked question in the complaint flow
  for (const q of flow.questions) {
    if (!askedQuestions.includes(q.id)) {
      return { ...q, isFollowup: false };
    }
  }
  
  // Then ask follow-up general questions
  for (const q of FOLLOWUP_QUESTIONS) {
    if (!askedQuestions.includes(q.id)) {
      return { ...q, isFollowup: true };
    }
  }
  
  return null; // All questions asked
};

const generateAIResponse = async (userMessage, conversationHistory, caseContext) => {
  // Try OpenAI if configured
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const systemPrompt = `You are MediKiosk AI, a medical history collection assistant for ${caseContext.organization || 'All India Institute of Ayurveda'}.
      
You MUST NOT diagnose diseases, prescribe medicines, or replace a doctor.
You ONLY collect medical history information through structured questions.

Current patient: ${caseContext.patientName || 'Patient'}, ${caseContext.age || ''} years old.
Chief complaint already collected: ${caseContext.chiefComplaint || 'Not yet collected'}.
Questions already asked: ${caseContext.askedQuestions?.join(', ') || 'None'}

Your task:
1. Ask the next relevant medical history question
2. Keep language simple and patient-friendly
3. Ask ONE question at a time
4. Acknowledge the patient's answer briefly before asking next question
5. Do not suggest diagnoses

Format: Respond in conversational, empathetic language.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(m => ({ role: m.role === 'patient' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: userMessage }
      ];
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 200,
        temperature: 0.7
      });
      
      return {
        message: response.choices[0].message.content,
        mode: 'openai'
      };
    } catch (err) {
      console.error('OpenAI error, falling back to demo mode:', err.message);
    }
  }
  
  // Demo mode - rule-based responses
  return { message: null, mode: 'demo' };
};

module.exports = {
  detectComplaint,
  detectRedFlags,
  generateSummary,
  getNextQuestion,
  generateAIResponse,
  COMPLAINT_FLOWS,
  FOLLOWUP_QUESTIONS
};
