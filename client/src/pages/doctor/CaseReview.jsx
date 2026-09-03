import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DoctorLayout from '../../components/Layout/DoctorLayout';
import { ArrowLeft, AlertTriangle, CheckCircle, Download, Save, User, MessageSquare, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorCaseReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewData, setReviewData] = useState({
    doctorNotes: '',
    provisionalDiagnosis: '',
    recommendedInvestigations: '',
    treatmentPlan: '',
    followUpDate: ''
  });

  useEffect(() => {
    axios.get(`/api/doctors/cases/${id}`).then(res => {
      const c = res.data.case;
      setCaseData(c);
      setReviewData({
        doctorNotes: c.doctorNotes || '',
        provisionalDiagnosis: c.doctorReview?.provisionalDiagnosis || '',
        recommendedInvestigations: c.doctorReview?.recommendedInvestigations?.join(', ') || '',
        treatmentPlan: c.doctorReview?.treatmentPlan || '',
        followUpDate: c.doctorReview?.followUpDate ? new Date(c.doctorReview.followUpDate).toISOString().split('T')[0] : ''
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/doctors/cases/${id}/review`, {
        doctorNotes: reviewData.doctorNotes,
        provisionalDiagnosis: reviewData.provisionalDiagnosis,
        recommendedInvestigations: reviewData.recommendedInvestigations ? reviewData.recommendedInvestigations.split(',').map(s => s.trim()) : [],
        treatmentPlan: reviewData.treatmentPlan,
        followUpDate: reviewData.followUpDate || null
      });
      toast.success('Case reviewed successfully!');
      navigate('/doctor/queue');
    } catch {
      toast.error('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DoctorLayout><div className="p-8 text-center text-gray-400">Loading case...</div></DoctorLayout>;
  if (!caseData) return <DoctorLayout><div className="p-8 text-center text-red-500">Case not found</div></DoctorLayout>;

  const info = caseData.basicInfo || {};

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" /> Back to Queue
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{caseData.chiefComplaint || 'Case Review'}</h1>
            <p className="text-sm text-gray-400">{caseData.caseId}</p>
          </div>
          <a href={`/api/cases/${id}/pdf`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" /> PDF
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Patient Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Patient Info</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Name', caseData.patient?.name || info.fullName],
                ['Age / Gender', `${info.age || 'N/A'}y / ${info.gender || 'N/A'}`],
                ['Phone', caseData.patient?.phone || info.phone],
                ['Priority', caseData.priority?.toUpperCase()]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-medium ${
                    label === 'Priority' && caseData.priority === 'emergency' ? 'text-red-600' :
                    label === 'Priority' && caseData.priority === 'urgent' ? 'text-orange-600' : 'text-gray-700'
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Red Flags</h3>
            {caseData.redFlags?.length > 0 ? (
              <div className="space-y-2">
                {caseData.redFlags.map((rf, i) => (
                  <div key={i} className="text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium mr-2 ${
                      rf.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>{rf.severity?.toUpperCase()}</span>
                    <span className="text-red-700">{rf.flag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No red flags detected</p>
            )}
          </div>

          {/* Quick Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Quick Summary</h3>
            <div className="text-sm space-y-1">
              {caseData.symptoms?.slice(0, 4).map((s, i) => (
                <p key={i} className="text-gray-600">• {s.name}{s.severity ? ` (${s.severity}/10)` : ''}</p>
              ))}
              {caseData.allergies?.drugAllergies?.length > 0 && (
                <p className="text-red-600">⚠ Drug allergy: {caseData.allergies.drugAllergies.join(', ')}</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {caseData.aiSummary?.text && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
            <h3 className="font-semibold text-blue-800 mb-3">🤖 AI Case Summary</h3>
            <pre className="text-sm text-blue-700 whitespace-pre-wrap font-sans leading-relaxed">{caseData.aiSummary.text}</pre>
          </div>
        )}

        {/* AI Conversation Transcript */}
        {caseData.conversation?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Conversation Transcript ({caseData.conversation.length} messages)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {caseData.conversation.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-2 rounded-xl text-sm ${
                    msg.role === 'patient' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className="text-xs font-semibold block mb-1">{msg.role === 'patient' ? 'Patient' : 'AI Assistant'}</span>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Review Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Doctor's Review</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Notes *</label>
              <textarea value={reviewData.doctorNotes} onChange={(e) => setReviewData({ ...reviewData, doctorNotes: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4} placeholder="Enter your clinical notes and observations..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provisional Diagnosis</label>
                <input type="text" value={reviewData.provisionalDiagnosis}
                  onChange={(e) => setReviewData({ ...reviewData, provisionalDiagnosis: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Provisional diagnosis (if any)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input type="date" value={reviewData.followUpDate}
                  onChange={(e) => setReviewData({ ...reviewData, followUpDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Investigations</label>
              <input type="text" value={reviewData.recommendedInvestigations}
                onChange={(e) => setReviewData({ ...reviewData, recommendedInvestigations: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="CBC, LFT, ECG... (comma separated)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
              <textarea value={reviewData.treatmentPlan}
                onChange={(e) => setReviewData({ ...reviewData, treatmentPlan: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3} placeholder="Proposed treatment plan..." />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold">
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Review & Mark Reviewed'}
            </button>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
