import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/Layout/AdminLayout';
import { AlertTriangle, Calendar, User } from 'lucide-react';

export default function AdminCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    axios.get(`/api/admin/cases${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then(res => setCases(res.data.cases)).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    const map = {
      draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700', reviewed: 'bg-green-100 text-green-700', completed: 'bg-emerald-100 text-emerald-700'
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Cases</h1>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">All Status</option>
            {['draft', 'submitted', 'under_review', 'reviewed', 'completed'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-400">Loading cases...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Case ID', 'Patient', 'Complaint', 'Doctor', 'Priority', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cases.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.caseId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{c.patient?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.chiefComplaint || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.doctor?.name || 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${
                          c.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                          c.priority === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.priority === 'emergency' && <AlertTriangle className="w-3 h-3" />}
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>{c.status?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
