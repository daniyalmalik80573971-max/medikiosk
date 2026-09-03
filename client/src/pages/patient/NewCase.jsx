import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PatientLayout from '../../components/Layout/PatientLayout';
import toast from 'react-hot-toast';
import {
  ChevronRight, ChevronLeft, Mic, MicOff, Send, Loader,
  AlertTriangle, CheckCircle, FileUp, X, Brain, User,
  Shield, Bot, Volume2, RotateCcw
} from 'lucide-react';

const STEPS = [
  { id: 'consent', label: 'Consent' },
  { id: 'basic', label: 'Basic Info' },
  { id: 'complaint', label: 'Chief Complaint' },
  { id: 'ai_chat', label: 'AI History' },
  { id: 'history', label: 'Med History' },
  { id: 'documents', label: 'Documents' },
  { id: 'summary', label: 'Summary' },
  { id: 'submit', label: 'Submit' }
];

export default function NewCase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [caseId, setCaseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionRef] = useState(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      return new SpeechRecognition();
    }
    return null;
  });

  // Form data
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    age: '',
    gender: user?.gender || '',
    dateOfBirth: '',
    phone: user?.phone || '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    abhaId: ''
  });

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // AI Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [complaintType, setComplaintType] = useState('general');
  const [aiLoading, setAiLoading] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [conversationComplete, setConversationComplete] = useState(false);
  const chatEndRef = useRef(null);

  // Medical history form
  const [medHistory, setMedHistory] = useState({
    diabetes: false, hypertension: false, asthma: false, heartDisease: false,
    thyroidDisorder: false, kidneyDisease: false, liverDisease: false,
    previousHospitalization: ''
  });
  const [currentMedications, setCurrentMedications] = useState([{ name: '', dosage: '', frequency: '' }]);
  const [allergies, setAllergies] = useState({ drug: '', food: '' });
  const [familyHistory, setFamilyHistory] = useState({ diabetes: false, hypertension: false, heartDisease: false, cancer: false, other: '' });
  const [personalHistory, setPersonalHistory] = useState({ smoking: 'never', alcohol: 'never', exercise: '', sleep: '', diet: '' });
  const [ayushHistory, setAyushHistory] = useState({ prakriti: '', doshaImbalance: '', previousAyurvedicTreatment: '', panchakarmaHistory: '' });

  // Documents
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Summary
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recognition setup
  useEffect(() => {
    if (recognitionRef) {
      recognitionRef.continuous = false;
      recognitionRef.interimResults = false;
      recognitionRef.lang = 'en-IN';
      recognitionRef.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + transcript);
        setIsListening(false);
      };
      recognitionRef.onend = () => setIsListening(false);
      recognitionRef.onerror = () => setIsListening(false);
    }
  }, [recognitionRef]);

  const toggleVoice = () => {
    if (!recognitionRef) { toast.error('Voice input not supported in your browser'); return; }
    if (isListening) {
      recognitionRef.stop();
      setIsListening(false);
    } else {
      recognitionRef.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const initAIChat = async (complaint) => {
    setAiLoading(true);
    const greeting = `Hello ${user?.name?.split(' ')[0] || ''}! I'm the MediKiosk AI assistant. I'll help collect your medical history before your doctor consultation. You mentioned: "${complaint}". I'll now ask you some questions to better understand your condition. Please answer as accurately as possible.`;

    try {
      const detectRes = await axios.post('/api/ai/detect-complaint', { text: complaint });
      setComplaintType(detectRes.data.complaintType);
    } catch (e) {}

    setMessages([{ role: 'assistant', content: greeting }]);
    speakText(greeting);

    // Get first question
    await sendAIMessage('', complaint);
    setAiLoading(false);
  };

  const sendAIMessage = async (userMsg, complaint = chiefComplaint, selectedOption = null) => {
    const messageToSend = selectedOption || userMsg;
    if (!messageToSend.trim() && !complaint) return;

    if (messageToSend.trim()) {
      setMessages(prev => [...prev, { role: 'patient', content: messageToSend, isOption: !!selectedOption }]);
    }
    setInputMessage('');
    setCurrentOptions([]);
    setAiLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', {
        message: messageToSend,
        caseId,
        askedQuestions,
        complaintType,
        conversationHistory: messages
      });

      const { message: aiMsg, options, questionId, redFlags: detectedFlags, conversationComplete: isDone } = res.data;

      setMessages(prev => [...prev, { role: 'assistant', content: aiMsg, options }]);
      if (options?.length) setCurrentOptions(options);
      if (questionId) setAskedQuestions(prev => [...prev, questionId]);
      if (detectedFlags?.length) setRedFlags(detectedFlags);
      if (isDone) setConversationComplete(true);

      // Speak the AI response
      speakText(aiMsg);

      // Save patient response to case
      if (caseId && messageToSend.trim()) {
        await axios.post(`/api/cases/${caseId}/conversation`, { message: messageToSend, role: 'patient' }).catch(() => {});
      }
    } catch (error) {
      toast.error('AI connection error. Please type your response.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize for the interruption. Could you please repeat your last answer?'
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const createCase = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/cases', {
        basicInfo: {
          fullName: formData.fullName,
          age: parseInt(formData.age),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          phone: formData.phone,
          address: formData.address,
          emergencyContact: {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelation
          },
          abhaId: formData.abhaId
        },
        chiefComplaint,
        consentGiven: true,
        consentTimestamp: new Date()
      });
      setCaseId(res.data.case._id);
      return res.data.case._id;
    } catch (error) {
      toast.error('Failed to create case. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveMedicalHistory = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const meds = currentMedications.filter(m => m.name.trim());
      await axios.put(`/api/cases/${caseId}`, {
        pastMedicalHistory: medHistory,
        currentMedications: meds,
        allergies: {
          drugAllergies: allergies.drug ? allergies.drug.split(',').map(s => s.trim()) : [],
          foodAllergies: allergies.food ? allergies.food.split(',').map(s => s.trim()) : []
        },
        familyHistory,
        personalHistory,
        ayushHistory
      });
      toast.success('Medical history saved');
    } catch (error) {
      toast.error('Failed to save medical history');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await axios.post('/api/ai/generate-summary', { caseId });
      setAiSummary(res.data.summary);
      toast.success('AI Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const submitCase = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/cases/${caseId}/submit`);
      toast.success('Case submitted to doctor successfully! 🎉');
      navigate('/patient/cases');
    } catch (error) {
      toast.error('Failed to submit case');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file, docType) => {
    setUploadingDoc(true);
    const formDataUpload = new FormData();
    formDataUpload.append('document', file);
    formDataUpload.append('caseId', caseId);
    formDataUpload.append('documentType', docType);
    try {
      const res = await axios.post('/api/documents/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocuments(prev => [...prev, res.data.document]);
      toast.success('Document uploaded! OCR processing started.');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const goToNextStep = async () => {
    const stepId = STEPS[currentStep].id;

    if (stepId === 'consent' && !consentGiven) {
      toast.error('Please give consent to proceed');
      return;
    }

    if (stepId === 'basic') {
      if (!formData.fullName || !formData.age || !formData.gender) {
        toast.error('Please fill all required fields');
        return;
      }
    }

    if (stepId === 'complaint') {
      if (!chiefComplaint.trim()) {
        toast.error('Please describe your chief complaint');
        return;
      }
      // Create case and start AI chat
      const newCaseId = await createCase();
      if (newCaseId) {
        setCaseId(newCaseId);
        await initAIChat(chiefComplaint);
      }
    }

    if (stepId === 'ai_chat') {
      await saveMedicalHistory();
    }

    if (stepId === 'history') {
      await saveMedicalHistory();
    }

    if (stepId === 'documents') {
      await generateSummary();
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              idx < currentStep ? 'bg-green-500 text-white' :
              idx === currentStep ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-1 w-full min-w-4 mx-1 rounded ${
                idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} style={{ width: '30px' }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        {STEPS.map((step) => (
          <span key={step.id} className="text-center" style={{ width: '60px', fontSize: '10px' }}>{step.label}</span>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    const stepId = STEPS[currentStep].id;

    if (stepId === 'consent') return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Consent</h2>
          <p className="text-gray-500 mt-2">Please read and accept the following before proceeding</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4 text-sm text-gray-600">
          <p><strong>Dear Patient,</strong></p>
          <p>MediKiosk AI will help collect your medical history before your consultation. Please understand:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>The AI will ask questions about your health condition</li>
            <li>Your answers will be organized and shared with your doctor</li>
            <li>The AI <strong>does NOT diagnose</strong> any disease</li>
            <li>The AI <strong>does NOT prescribe</strong> any medicines</li>
            <li>All information is confidential and used only for your consultation</li>
            <li>A doctor will review all information before any medical decision</li>
            <li>You can stop at any time</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800"><strong>⚠️ Important:</strong> If you are experiencing a medical emergency (severe chest pain, difficulty breathing, loss of consciousness), please go to the emergency department immediately or call 108.</p>
          </div>
        </div>
        <label className="flex items-start gap-3 mt-6 cursor-pointer">
          <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="mt-1 w-5 h-5 rounded text-blue-600" />
          <span className="text-gray-700">I have read and understood the above information. I consent to provide my medical history through this AI system.</span>
        </label>
      </div>
    );

    if (stepId === 'basic') return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name *', key: 'fullName', type: 'text', placeholder: 'Your full name' },
            { label: 'Age *', key: 'age', type: 'number', placeholder: 'Your age in years' },
            { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
            { label: 'Date of Birth', key: 'dateOfBirth', type: 'date', placeholder: '' },
            { label: 'ABHA ID (optional)', key: 'abhaId', type: 'text', placeholder: 'Health ID' }
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2} placeholder="Your address" />
        </div>
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Contact Name', key: 'emergencyContactName', placeholder: 'Name' },
              { label: 'Phone', key: 'emergencyContactPhone', placeholder: 'Phone number' },
              { label: 'Relationship', key: 'emergencyContactRelation', placeholder: 'e.g. Spouse, Parent' }
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (stepId === 'complaint') return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chief Complaint</h2>
        <p className="text-gray-500 mb-6">What health problem brings you here today?</p>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Describe your main problem:</label>
          <div className="relative">
            <textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full border border-blue-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[120px]"
              placeholder="e.g. I have been having chest pain for 2 days, headache and fever..." />
            <button onClick={toggleVoice}
              className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          {isListening && <p className="text-blue-600 text-sm mt-2 animate-pulse">🎙️ Listening... Speak now</p>}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-3">Or select a common complaint:</p>
          <div className="flex flex-wrap gap-2">
            {['Chest pain', 'Headache', 'Fever', 'Stomach pain', 'Breathing difficulty', 'Back pain', 'Joint pain', 'Cough', 'Fatigue', 'Other'].map(c => (
              <button key={c} onClick={() => setChiefComplaint(prev => prev ? prev + ', ' + c : c)}
                className="px-4 py-2 rounded-full border border-blue-200 text-blue-700 text-sm hover:bg-blue-50 transition-colors">
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    if (stepId === 'ai_chat') return (
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: '55vh' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">AI Medical History Collection</h2>
            <p className="text-xs text-gray-500">The AI is collecting your medical history</p>
          </div>
          {redFlags.length > 0 && (
            <div className="ml-auto flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">
              <AlertTriangle className="w-3 h-3" />
              {redFlags.length} flag(s)
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl p-4 space-y-3 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                msg.role === 'patient'
                  ? 'bg-blue-600 text-white rounded-tl-2xl rounded-tr-sm rounded-b-2xl'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tr-2xl rounded-tl-sm rounded-b-2xl'
              } px-4 py-3 shadow-sm`}>
                <p className="text-sm">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <button onClick={() => speakText(msg.content)} className="mt-1 text-gray-400 hover:text-gray-600">
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {msg.role === 'patient' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>
          ))}
          {aiLoading && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Options */}
        {currentOptions.length > 0 && !aiLoading && (
          <div className="flex flex-wrap gap-2 mb-3">
            {currentOptions.map((opt) => (
              <button key={opt} onClick={() => sendAIMessage('', chiefComplaint, opt)}
                className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors">
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {!conversationComplete && (
          <div className="flex gap-2">
            <button onClick={toggleVoice}
              className={`p-3 rounded-xl transition-colors ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(inputMessage); } }}
              placeholder="Type your answer or use voice..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => sendAIMessage(inputMessage)} disabled={aiLoading || !inputMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        {conversationComplete && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">Medical history collection complete! Click Next to continue.</p>
          </div>
        )}

        {redFlags.length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-700 font-semibold text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Red Flags Detected (For Doctor Review)
            </p>
            {redFlags.map((rf, i) => (
              <p key={i} className="text-red-600 text-xs mt-1">• [{rf.severity?.toUpperCase()}] {rf.flag}</p>
            ))}
          </div>
        )}
      </div>
    );

    if (stepId === 'history') return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Medical History</h2>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Past Medical Conditions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'diabetes', label: 'Diabetes' },
              { key: 'hypertension', label: 'Hypertension' },
              { key: 'asthma', label: 'Asthma' },
              { key: 'heartDisease', label: 'Heart Disease' },
              { key: 'thyroidDisorder', label: 'Thyroid' },
              { key: 'kidneyDisease', label: 'Kidney Disease' },
              { key: 'liverDisease', label: 'Liver Disease' }
            ].map(({ key, label }) => (
              <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                medHistory[key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="checkbox" checked={medHistory[key]} onChange={(e) => setMedHistory({ ...medHistory, [key]: e.target.checked })} className="hidden" />
                {medHistory[key] ? <CheckCircle className="w-5 h-5 text-blue-600" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded" />}
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Previous Hospitalization</label>
            <input type="text" value={medHistory.previousHospitalization}
              onChange={(e) => setMedHistory({ ...medHistory, previousHospitalization: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="If any, describe when and why" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Current Medications</h3>
          {currentMedications.map((med, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
              <input type="text" placeholder="Medicine name" value={med.name}
                onChange={(e) => { const m = [...currentMedications]; m[idx].name = e.target.value; setCurrentMedications(m); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Dosage" value={med.dosage}
                onChange={(e) => { const m = [...currentMedications]; m[idx].dosage = e.target.value; setCurrentMedications(m); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Frequency" value={med.frequency}
                onChange={(e) => { const m = [...currentMedications]; m[idx].frequency = e.target.value; setCurrentMedications(m); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button onClick={() => setCurrentMedications([...currentMedications, { name: '', dosage: '', frequency: '' }])}
            className="text-blue-600 text-sm hover:underline">+ Add medication</button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Allergies</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drug Allergies</label>
              <input type="text" value={allergies.drug} onChange={(e) => setAllergies({ ...allergies, drug: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Penicillin, Aspirin (comma separated)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Food Allergies</label>
              <input type="text" value={allergies.food} onChange={(e) => setAllergies({ ...allergies, food: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Nuts, Shellfish (comma separated)" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Family History</h3>
          <div className="grid grid-cols-2 gap-3">
            {['diabetes', 'hypertension', 'heartDisease', 'cancer'].map((key) => (
              <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer ${
                familyHistory[key] ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
              }`}>
                <input type="checkbox" checked={familyHistory[key]} onChange={(e) => setFamilyHistory({ ...familyHistory, [key]: e.target.checked })} className="hidden" />
                {familyHistory[key] ? <CheckCircle className="w-4 h-4 text-orange-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Personal & Lifestyle History</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
              <select value={personalHistory.smoking} onChange={(e) => setPersonalHistory({ ...personalHistory, smoking: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="never">Never</option>
                <option value="former">Former smoker</option>
                <option value="current_light">Current - Light</option>
                <option value="current_heavy">Current - Heavy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol</label>
              <select value={personalHistory.alcohol} onChange={(e) => setPersonalHistory({ ...personalHistory, alcohol: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="never">Never</option>
                <option value="occasional">Occasionally</option>
                <option value="moderate">Regularly - moderate</option>
                <option value="heavy">Heavy drinker</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
              <input type="text" value={personalHistory.exercise} onChange={(e) => setPersonalHistory({ ...personalHistory, exercise: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Daily walk, Yoga" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sleep (hours/night)</label>
              <input type="text" value={personalHistory.sleep} onChange={(e) => setPersonalHistory({ ...personalHistory, sleep: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 6-7 hours" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <h3 className="font-semibold text-green-800 mb-4">🌿 AYUSH History (Optional)</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prakriti (Body Constitution)</label>
              <select value={ayushHistory.prakriti} onChange={(e) => setAyushHistory({ ...ayushHistory, prakriti: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Not known</option>
                <option value="vata">Vata</option>
                <option value="pitta">Pitta</option>
                <option value="kapha">Kapha</option>
                <option value="vata_pitta">Vata-Pitta</option>
                <option value="pitta_kapha">Pitta-Kapha</option>
                <option value="vata_kapha">Vata-Kapha</option>
                <option value="tridosha">Tridoshic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Ayurvedic/AYUSH Treatment</label>
              <textarea value={ayushHistory.previousAyurvedicTreatment}
                onChange={(e) => setAyushHistory({ ...ayushHistory, previousAyurvedicTreatment: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2} placeholder="Describe any previous Ayurvedic or AYUSH treatment" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Panchakarma History</label>
              <input type="text" value={ayushHistory.panchakarmaHistory}
                onChange={(e) => setAyushHistory({ ...ayushHistory, panchakarmaHistory: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any Panchakarma procedures done" />
            </div>
          </div>
        </div>
      </div>
    );

    if (stepId === 'documents') return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-500 mb-6">Upload prescriptions, lab reports, or discharge summaries for OCR extraction</p>
        
        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center mb-6 hover:border-blue-400 transition-colors">
          <FileUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Drag & drop or click to upload</p>
          <p className="text-sm text-gray-400 mb-4">Supports: JPG, PNG, PDF (Max 10MB)</p>
          <label className="cursor-pointer">
            <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              {uploadingDoc ? 'Uploading...' : 'Choose Files'}
            </span>
            <input type="file" accept="image/*,.pdf" multiple className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) uploadDocument(file, 'other');
              }}
              disabled={uploadingDoc || !caseId} />
          </label>
        </div>

        {documents.length > 0 && (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.originalName}</p>
                  <p className="text-xs text-gray-400">
                    {doc.ocrStatus === 'completed' ? '✓ OCR Complete' :
                     doc.ocrStatus === 'processing' ? '⏳ Processing OCR...' :
                     doc.ocrStatus === 'failed' ? '✗ OCR Failed' : '⏳ Pending'}
                  </p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Uploaded</span>
              </div>
            ))}
          </div>
        )}

        {!caseId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-700 text-sm">⚠️ Please complete the previous steps first to enable document upload.</p>
          </div>
        )}
      </div>
    );

    if (stepId === 'summary') return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Case Summary</h2>
        <p className="text-gray-500 mb-6">Review your AI-generated case summary before submitting to your doctor</p>
        
        {redFlags.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Red Flags Detected
            </h3>
            <p className="text-red-600 text-sm mb-2">The following symptoms require urgent doctor attention:</p>
            {redFlags.map((rf, i) => (
              <div key={i} className={`text-xs px-3 py-1.5 rounded-lg mb-1 ${
                rf.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
              }`}>
                [{rf.severity?.toUpperCase()}] {rf.flag}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          {summaryLoading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Generating AI summary...</p>
            </div>
          ) : aiSummary ? (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{aiSummary}</pre>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Click to generate your case summary</p>
              <button onClick={generateSummary}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Generate Summary
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-700 text-xs">
            <strong>Disclaimer:</strong> This summary is AI-generated for informational purposes. It does not constitute a medical diagnosis. Your doctor will review this information and make all medical decisions.
          </p>
        </div>
      </div>
    );

    if (stepId === 'submit') return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Submit</h2>
        <p className="text-gray-500 mb-8">
          Your medical history has been collected and organized. 
          Click submit to send your case to the doctor's dashboard for review.
        </p>
        <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-blue-800 mb-3">Your case includes:</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Basic patient information</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Chief complaint & symptoms</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Complete medical history</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI-guided conversation transcript</li>
            {documents.length > 0 && <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {documents.length} uploaded document(s)</li>}
            {redFlags.length > 0 && <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> {redFlags.length} red flag(s) for doctor attention</li>}
          </ul>
        </div>
        <button onClick={submitCase} disabled={loading || !caseId}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Case to Doctor'}
        </button>
        {!caseId && <p className="text-red-500 text-sm mt-2">Please complete previous steps first</p>}
      </div>
    );

    return null;
  };

  return (
    <PatientLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">New Patient Case</h1>
          <p className="text-gray-500 text-sm">Complete all steps to create your medical case</p>
        </div>

        {renderProgressBar()}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6 min-h-64">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>

          <span className="text-sm text-gray-400">{currentStep + 1} / {STEPS.length}</span>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={goToNextStep}
              disabled={loading || aiLoading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Next'} <ChevronRight className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>
    </PatientLayout>
  );
}
