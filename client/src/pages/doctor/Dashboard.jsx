import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DoctorLayout from '../../components/Layout/DoctorLayout';
import { FileText, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalQueue: 0, todayReviewed: 0, totalReviewed: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/doctors/stats').then(res => setStats(res.data.stats)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Pending Queue', value: stats.totalQueue, icon: Clock, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Urgent/Emergency', value: stats.urgent, icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50' },
    { label: "Today's Reviewed", value: stats.todayReviewed, icon: CheckCircle, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Total Reviewed', value: stats.totalReviewed, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' }
  ];

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500">Here's your patient queue overview</p>
        </div>

        {/* Quick Action */}
        <Link to="/doctor/queue" className="flex items-center justify-between bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-2xl mb-6 hover:from-green-700 hover:to-teal-700 transition-all group shadow-lg">
          <div>
            <h2 className="text-xl font-bold mb-1">Review Patient Queue</h2>
            <p className="text-green-100 text-sm">View and review submitted patient cases</p>
          </div>
          <ChevronRight className="w-10 h-10 text-green-200 group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>
    </DoctorLayout>
  );
}
