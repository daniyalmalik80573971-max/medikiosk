import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PatientLayout from '../../components/Layout/PatientLayout';
import { Download, ArrowLeft, AlertTriangle, CheckCircle, MessageSquare, FileText, Clock } from 'lucide-react';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/cases/${id}`).then(res => setCaseData(res.data.case)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PatientLayout><div className="p-8 text-center text-gray-400">Loading case...</div></PatientLayout>;
  if (!caseData) return <PatientLayout><div className="p-8 text-center text-red-500">Case not found</div></PatientLayout>;

  const getStatusColor = (status) => {
    const map = { draft: 'text-gray-500', submitted: 'text-blue-600', under_review: 'text-yellow-600', reviewed: 'text-green-600', completed: 'text-emerald-600' };
    return map[status] || 'text-gray-500';
  };

  return (
    <PatientLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{caseData.chiefComplaint || 'Medical Case'}</h1>
            <p className="text-sm text-gray-400">{caseData.caseId} · {new Date(caseData.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <a href={`/api/cases/${id}/pdf`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm">
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">Status</p>
              <p className={`font-semibold capitalize ${getStatusColor(caseData.status)}`}>{caseData.status?.replace('_', ' ')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Priority</p>
              <p className={`font-semibold capitalize ${
                caseData.priority === 'emergency' ? 'text-red-600' :
                caseData.priority === 'urgent' ? 'text-orange-600' : 'text-gray-700'
              }`}>{caseData.priority}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Doctor</p>
              <p className="font-semibold text-gray-700">{caseData.doctor?.name || 'Pending'}</p>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {caseData.redFlags?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
            <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" /> Red Flags
            </h3>
            {caseData.redFlags.map((rf, i) => (
              <div key={i} className="text-sm text-red-700 flex items-center gap-2 mb-1">
                <span className="text-xs bg-red-100 px-2 py-0.5 rounded-full">{rf.severity?.toUpperCase()}</span>
                {rf.flag}
              </div>
            ))}
          </div>
        )}

        {/* AI Summary */}
        {caseData.aiSummary?.text && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" /> AI Generated Summary
            </h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{caseData.aiSummary.text}</pre>
          </div>
        )}

        {/* Doctor Notes */}
        {caseData.doctorNotes && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Doctor Notes
            </h3>
            <p className="text-green-700">{caseData.doctorNotes}</p>
            {caseData.doctorReview?.provisionalDiagnosis && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-green-600"><strong>Provisional Diagnosis:</strong> {caseData.doctorReview.provisionalDiagnosis}</p>
                {caseData.doctorReview.treatmentPlan && <p className="text-sm text-green-600 mt-1"><strong>Treatment Plan:</strong> {caseData.doctorReview.treatmentPlan}</p>}
              </div>
            )}
          </div>
        )}

        {/* Conversation */}
        {caseData.conversation?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" /> AI Conversation Transcript
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {caseData.conversation.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-2 rounded-xl text-sm ${
                    msg.role === 'patient' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
