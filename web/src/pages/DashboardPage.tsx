import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Car, Calendar, MessageSquare,
  TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle,
  CreditCard, Bell, Settings, LogOut, ChevronRight,
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface DashboardStats {
  overview: {
    totalClients: number;
    totalVehicles: number;
    totalAppointments: number;
    smsCredits: number;
  };
  appointments: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  itpExpiring: {
    next7Days: number;
    next30Days: number;
    expired: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'appointment' | 'client' | 'sms';
    description: string;
    timestamp: string;
  }>;
  subscription: {
    plan: string;
    status: string;
    smsCredits: number;
    currentPeriodEnd: string | null;
  };
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', active: true },
  { icon: Calendar, label: 'Programări', href: '/appointments' },
  { icon: Users, label: 'Clienți', href: '/clients' },
  { icon: Car, label: 'Vehicule', href: '/vehicles' },
  { icon: MessageSquare, label: 'SMS', href: '/sms' },
  { icon: BarChart3, label: 'Rapoarte', href: '/reports' },
  { icon: CreditCard, label: 'Facturare', href: '/billing' },
  { icon: Settings, label: 'Setări', href: '/settings' },
];

export function DashboardPage() {
  const { user, tenant, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      // Use mock data if API fails
      setStats({
        overview: {
          totalClients: 156,
          totalVehicles: 203,
          totalAppointments: 1247,
          smsCredits: 850,
        },
        appointments: {
          today: 8,
          thisWeek: 34,
          thisMonth: 127,
          pending: 12,
          completed: 1180,
          cancelled: 55,
        },
        revenue: {
          thisMonth: 12450,
          lastMonth: 10200,
          growth: 22.1,
        },
        itpExpiring: {
          next7Days: 15,
          next30Days: 48,
          expired: 7,
        },
        recentActivity: [
          { id: '1', type: 'appointment', description: 'Programare nouă: Ion Popescu - B 123 ABC', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
          { id: '2', type: 'sms', description: 'SMS trimis: Reminder ITP pentru 5 clienți', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
          { id: '3', type: 'appointment', description: 'ITP finalizat: Maria Ionescu - SV 99 XYZ', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
          { id: '4', type: 'client', description: 'Client nou: Auto Service Popescu SRL', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        ],
        subscription: {
          plan: 'STARTER',
          status: 'active',
          smsCredits: 850,
          currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Acum ${minutes} min`;
    if (hours < 24) return `Acum ${hours} ore`;
    return `Acum ${days} zile`;
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      FREE: 'Gratuit',
      STARTER: 'Starter',
      PROFESSIONAL: 'Professional',
      ENTERPRISE: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AutoEverything</h1>
              <p className="text-xs text-slate-400 truncate max-w-[140px]">
                {tenant?.name || user?.name || 'Dashboard'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    item.active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Deconectare</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-slate-500">Bun venit, {user?.name || user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={loadStats}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  12%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.overview.totalClients}</h3>
              <p className="text-slate-500 text-sm">Total Clienți</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  8%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.overview.totalVehicles}</h3>
              <p className="text-slate-500 text-sm">Total Vehicule</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {stats?.revenue.growth.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.appointments.thisMonth}</h3>
              <p className="text-slate-500 text-sm">Programări luna aceasta</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{stats?.overview.smsCredits}</h3>
              <p className="text-slate-500 text-sm">Credite SMS</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Appointments Today */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Programări Azi
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total azi</span>
                  <span className="text-2xl font-bold text-slate-800">{stats?.appointments.today}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">În așteptare</span>
                  <span className="font-semibold text-orange-600">{stats?.appointments.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Finalizate</span>
                  <span className="font-semibold text-emerald-600">{stats?.appointments.completed}</span>
                </div>
              </div>
              <Link
                to="/appointments"
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Vezi toate programările
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* ITP Expiring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                ITP-uri care expiră
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">În 7 zile</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">
                    {stats?.itpExpiring.next7Days}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">În 30 zile</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                    {stats?.itpExpiring.next30Days}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Expirate</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                    {stats?.itpExpiring.expired}
                  </span>
                </div>
              </div>
              <button className="mt-4 w-full py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-sm font-medium">
                Trimite notificări SMS
              </button>
            </motion.div>

            {/* Subscription */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-sm text-white"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Abonament
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{getPlanLabel(stats?.subscription.plan || 'FREE')}</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  stats?.subscription.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {stats?.subscription.status === 'active' ? 'Activ' : 'Inactiv'}
                </span>
              </div>
              <div className="space-y-2 text-blue-100 text-sm">
                <p>Credite SMS: {stats?.subscription.smsCredits}</p>
                {stats?.subscription.currentPeriodEnd && (
                  <p>Valabil până: {new Date(stats.subscription.currentPeriodEnd).toLocaleDateString('ro-RO')}</p>
                )}
              </div>
              <Link
                to="/billing"
                className="mt-4 block w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-center transition text-sm font-medium"
              >
                Upgrade Plan
              </Link>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Activitate Recentă
            </h3>
            <div className="space-y-4">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === 'appointment' ? 'bg-blue-100' :
                    activity.type === 'sms' ? 'bg-purple-100' : 'bg-emerald-100'
                  }`}>
                    {activity.type === 'appointment' ? (
                      <Calendar className={`w-5 h-5 text-blue-600`} />
                    ) : activity.type === 'sms' ? (
                      <MessageSquare className={`w-5 h-5 text-purple-600`} />
                    ) : (
                      <Users className={`w-5 h-5 text-emerald-600`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800">{activity.description}</p>
                    <p className="text-slate-400 text-sm">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
