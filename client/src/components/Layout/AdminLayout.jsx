import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FileText, LogOut, Heart, Menu, X, Bell, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/cases', icon: FileText, label: 'All Cases' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 z-30 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto flex flex-col`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">MediKiosk</div><div className="text-xs text-gray-400">Admin Panel</div></div>
          </div>
        </div>
        <div className="px-4 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center"><span className="text-white font-semibold">{user?.name?.charAt(0)}</span></div>
            <div><div className="font-medium text-white text-sm">{user?.name}</div><div className="text-xs text-gray-400">Administrator</div></div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} to={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname.startsWith(href) ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon className="w-5 h-5" /><span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={() => { logout(); toast.success('Logged out'); navigate('/'); }}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-xl">
            <LogOut className="w-5 h-5" /><span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-500">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button className="text-gray-400"><Bell className="w-6 h-6" /></button>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><span className="text-purple-600 font-semibold text-sm">{user?.name?.charAt(0)}</span></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
