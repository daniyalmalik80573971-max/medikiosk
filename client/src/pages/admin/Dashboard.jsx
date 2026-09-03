import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Users, FileText, AlertTriangle, Clock, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalCases: 0, pendingCases: 0, todayCases: 0, emergencyCases: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/stats').then(res => setStats(res.data.stats)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Doctors', value: stats.totalDoctors, icon: Activity, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Total Cases', value: stats.totalCases, icon: FileText, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: 'Pending Review', value: stats.pendingCases, icon: Clock, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
    { label: "Today's Cases", value: stats.todayCases, icon: Activity, color: 'bg-teal-500', bg: 'bg-teal-50' },
    { label: 'Emergency Cases', value: stats.emergencyCases, icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50' }
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">System overview and management</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white shadow-sm`}>
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{loading ? '...' : value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
