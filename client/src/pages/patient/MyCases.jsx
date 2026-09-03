import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PatientLayout from '../../components/Layout/PatientLayout';
import { FileText, Calendar, AlertTriangle, ChevronRight, Download, Plus } from 'lucide-react';

export default function MyCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/cases/my-cases').then(res => setCases(res.data.cases)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      draft: { class: 'bg-gray-100 text-gray-600', label: 'Draft' },
      submitted: { class: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      under_review: { class: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
      reviewed: { class: 'bg-green-100 text-green-700', label: 'Reviewed' },
      completed: { class: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
    };
    return map[status] || { class: 'bg-gray-100 text-gray-600', label: status };
  };

  const getPriorityBadge = (priority) => {
    const map = {
      emergency: 'bg-red-100 text-red-700',
      urgent: 'bg-orange-100 text-orange-700',
      routine: 'bg-gray-100 text-gray-600'
    };
    return map[priority] || 'bg-gray-100 text-gray-600';
  };

  const filtered = filter === 'all' ? cases : cases.filter(c => c.status === filter);

  return (
    <PatientLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
            <p className="text-gray-500 text-sm mt-1">{cases.length} total cases</p>
          </div>
          <Link to="/patient/new-case" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Case
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'draft', 'submitted', 'under_review', 'reviewed', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {f === 'all' ? 'All Cases' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading your cases...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-500">No cases found</h3>
            <Link to="/patient/new-case" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
              <Plus className="w-4 h-4" /> Create your first case
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const statusInfo = getStatusBadge(c.status);
              return (
                <div key={c._id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{c.chiefComplaint || 'General Consultation'}</h3>
                          {c.priority !== 'routine' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(c.priority)}`}>
                              {c.priority?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                          {c.caseId && <span className="font-mono text-xs">{c.caseId}</span>}
                          {c.doctor && <span>Dr. {c.doctor.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {c.redFlags?.length > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>{statusInfo.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Link to={`/patient/cases/${c._id}`} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                        View Details <ChevronRight className="w-3 h-3" />
                      </Link>
                      <a href={`/api/cases/${c._id}/pdf`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700">
                        <Download className="w-3 h-3" /> Download PDF
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
