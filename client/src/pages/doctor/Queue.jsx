import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DoctorLayout from '../../components/Layout/DoctorLayout';
import { AlertTriangle, Clock, ChevronRight, User, Calendar } from 'lucide-react';

export default function DoctorQueue() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/doctors/queue').then(res => setCases(res.data.cases)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getPriorityColor = (p) => ({ emergency: 'border-l-red-500 bg-red-50', urgent: 'border-l-orange-500 bg-orange-50', routine: 'border-l-blue-500' }[p] || 'border-l-blue-500');

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patient Queue</h1>
          <p className="text-gray-500">{cases.length} cases awaiting review</p>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Loading queue...</div> :
         cases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Clock className="w-16 h-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No cases in queue right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <Link key={c._id} to={`/doctor/cases/${c._id}`}
                className={`block bg-white rounded-2xl border border-gray-200 border-l-4 ${getPriorityColor(c.priority)} p-5 hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{c.chiefComplaint || 'General Consultation'}</h3>
                      {c.priority !== 'routine' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                          c.priority === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          <AlertTriangle className="w-3 h-3" /> {c.priority?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.patient?.name}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(c.submittedAt || c.createdAt).toLocaleDateString('en-IN')}</span>
                      {c.basicInfo?.age && <span>Age: {c.basicInfo.age}</span>}
                    </div>
                    {c.redFlags?.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                        <AlertTriangle className="w-3 h-3" /> {c.redFlags.length} red flag(s)
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      c.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{c.status?.replace('_', ' ').toUpperCase()}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
