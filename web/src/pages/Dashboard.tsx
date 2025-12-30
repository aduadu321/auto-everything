import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Car,
  Clock,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  DollarSign,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { smsService, appointmentsService, clientsService } from '../services/api';
import type { BalanceResponse, Appointment } from '../services/api';

interface AppointmentStats {
  todayAppointments: number;
  weekAppointments: number;
  pendingAppointments: number;
  totalThisMonth: number;
}

interface ClientStats {
  total: number;
  active: number;
  withVehicles: number;
}

export function Dashboard() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBalance(),
        loadAppointmentStats(),
        loadClientStats(),
        loadTodayAppointments(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const data = await smsService.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const loadAppointmentStats = async () => {
    try {
      const data = await appointmentsService.getStats();
      setAppointmentStats(data);
    } catch (error) {
      console.error('Failed to load appointment stats:', error);
    }
  };

  const loadClientStats = async () => {
    try {
      const data = await clientsService.getStats();
      setClientStats(data);
    } catch (error) {
      console.error('Failed to load client stats:', error);
    }
  };

  const loadTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await appointmentsService.getAll({
        startDate: today,
        endDate: today,
        limit: 10,
      });
      setTodayAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load today appointments:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmat';
      case 'PENDING': return 'In asteptare';
      case 'IN_PROGRESS': return 'In desfasurare';
      case 'COMPLETED': return 'Finalizat';
      case 'CANCELLED': return 'Anulat';
      case 'NO_SHOW': return 'Neprezentare';
      default: return status;
    }
  };

  const formatCredits = (credits: number | undefined) => {
    if (credits === undefined || credits === null) return '0.00';
    return credits.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Se incarca datele...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Bine ai venit in panoul de administrare!</p>
        </div>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <TrendingUp size={18} />
          Actualizeaza
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Programari Azi</p>
              <p className="text-3xl font-bold mt-1">{appointmentStats?.todayAppointments || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Saptamana Aceasta</p>
              <p className="text-3xl font-bold mt-1">{appointmentStats?.weekAppointments || 0}</p>
            </div>
            <CalendarDays className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">In Asteptare</p>
              <p className="text-3xl font-bold mt-1">{appointmentStats?.pendingAppointments || 0}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Luna</p>
              <p className="text-3xl font-bold mt-1">{appointmentStats?.totalThisMonth || 0}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-gray-700">Clienti</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{clientStats?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{clientStats?.active || 0} activi</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-gray-700">Credit Twilio</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">${formatCredits(balance?.twilio?.credits)}</p>
          <p className="text-sm text-gray-500 mt-1">USD disponibil</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-medium text-gray-700">Credit SMSLink</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{balance?.smslink?.credits || 0}</p>
          <p className="text-sm text-gray-500 mt-1">RON disponibil</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Programari de Azi
          </h2>
          <Link
            to="/admin/appointments"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Vezi toate
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nu sunt programari pentru azi</p>
            </div>
          ) : (
            todayAppointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-blue-50 rounded-lg px-3 py-2 min-w-[60px]">
                      <p className="text-lg font-bold text-blue-600">{apt.startTime}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{apt.clientName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        {apt.vehiclePlate || 'N/A'} - {apt.vehicleMake} {apt.vehicleModel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {getStatusText(apt.status)}
                    </span>
                    <Link
                      to={`/admin/appointments`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FileCheck className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Actiuni Rapide</h2>
      <div className="grid grid-cols-4 gap-4">
        <Link
          to="/admin/appointments"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3 group-hover:bg-blue-200 transition-colors">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Programari</h3>
          <p className="text-sm text-gray-500">Gestioneaza programarile</p>
        </Link>

        <Link
          to="/admin/clients"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-3 group-hover:bg-green-200 transition-colors">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Clienti</h3>
          <p className="text-sm text-gray-500">Baza de date clienti</p>
        </Link>

        <Link
          to="/admin/sms"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3 group-hover:bg-purple-200 transition-colors">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">SMS Manual</h3>
          <p className="text-sm text-gray-500">Trimite SMS-uri</p>
        </Link>

        <Link
          to="/admin/itp-status"
          className="bg-white rounded-xl p-5 border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-orange-100 rounded-lg w-fit mb-3 group-hover:bg-orange-200 transition-colors">
            <FileCheck className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Status ITP</h3>
          <p className="text-sm text-gray-500">Expirari documente</p>
        </Link>
      </div>
    </div>
  );
}
