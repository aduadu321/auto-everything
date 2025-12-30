import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Mail, LayoutDashboard, Users, Car, FileText, History, Calendar, ExternalLink, ClipboardCheck, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/appointments', label: 'Programari', icon: Calendar },
    { path: '/admin/clients', label: 'Clienti', icon: Users },
    { path: '/admin/vehicles', label: 'Vehicule', icon: Car },
    { path: '/admin/itp-status', label: 'Status ITP', icon: ClipboardCheck },
    { path: '/admin/templates', label: 'Template-uri', icon: FileText },
    { path: '/admin/notifications', label: 'Istoric Notificari', icon: History },
    { path: '/admin/sms', label: 'SMS Manual', icon: MessageSquare },
    { path: '/admin/email', label: 'Email Manual', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-800">MISEDA INSPECT</h1>
          <p className="text-sm text-gray-500">Panou Administrare</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Link to public site */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink size={20} />
            <span className="font-medium">Pagina Publica</span>
          </Link>
        </div>

        {/* User info and logout */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center gap-3 px-4 py-2 text-gray-600">
            <User size={20} />
            <span className="font-medium truncate text-sm">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Deconectare</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
