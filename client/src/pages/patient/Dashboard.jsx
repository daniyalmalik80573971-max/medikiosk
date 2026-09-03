import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PatientLayout from '../../components/Layout/PatientLayout';
import { PlusCircle, FileText, CheckCircle, Clock, AlertTriangle, Activity, ChevronRight, Calendar } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalCases: 0, submittedCases: 0, reviewedCases: 0, pendingCases: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/patients/dashboard')
      .then(res => {
        setStats(res.data.stats);
        setRecentCases(res.data.recentCases);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Cases', value: stats.totalCases, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Submitted', value: stats.submittedCases, icon: Clock, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Reviewed', value: stats.reviewedCases, icon: CheckCircle, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Drafts', value: stats.pendingCases, icon: Activity, color: 'bg-purple-500', bg: 'bg-purple-50' }
  ];

  const getStatusBadge = (status) => {
    const map = {
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-green-100 text-green-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <PatientLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Manage your medical cases and health information</p>
        </div>

        {/* Quick Action */}
        <Link to="/patient/new-case" className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl mb-6 hover:from-blue-700 hover:to-blue-800 transition-all group shadow-lg">
          <div>
            <h2 className="text-xl font-bold mb-1">Start New Case</h2>
            <p className="text-blue-100 text-sm">Begin your AI-guided medical history session</p>
          </div>
          <PlusCircle className="w-12 h-12 text-blue-200 group-hover:scale-110 transition-transform" />
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white shadow-sm`}>
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Recent Cases */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Cases</h2>
            <Link to="/patient/cases" className="text-blue-600 text-sm hover:underline flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : recentCases.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No cases yet. Start your first case!</p>
              <Link to="/patient/new-case" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
                <PlusCircle className="w-4 h-4" /> Create New Case
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentCases.map((c) => (
                <Link key={c._id} to={`/patient/cases/${c._id}`} className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{c.chiefComplaint || 'General Consultation'}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                        {c.caseId && <span className="ml-2 font-mono text-xs">{c.caseId}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.priority === 'emergency' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                      {c.status?.replace('_', ' ')?.toUpperCase()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
