import { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Car,
  CheckCircle,
  AlertCircle,
  XCircle,
  Phone,
  FileText,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Shield,
  MapPin,
} from 'lucide-react';
import { appointmentsService } from '../services/api';

type AppointmentResult = {
  id: string;
  confirmationCode?: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceType: string;
  vehicleCategory?: string;
  isRarBlocked?: boolean;
  itpResult?: string;
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: 'În așteptare', color: 'yellow', icon: Clock },
  CONFIRMED: { label: 'Confirmată', color: 'blue', icon: CheckCircle },
  IN_PROGRESS: { label: 'În desfășurare', color: 'purple', icon: Loader2 },
  RAR_BLOCKED: { label: 'Blocat RAR', color: 'orange', icon: AlertTriangle },
  COMPLETED: { label: 'Finalizată', color: 'green', icon: CheckCircle },
  CANCELLED: { label: 'Anulată', color: 'red', icon: XCircle },
  NO_SHOW: { label: 'Neprezentare', color: 'gray', icon: XCircle },
};

const ITP_RESULT_INFO: Record<string, { label: string; color: string }> = {
  ADMIS: { label: 'ADMIS', color: 'green' },
  RESPINS: { label: 'RESPINS', color: 'red' },
  ADMIS_OBS: { label: 'ADMIS CU OBSERVAȚII', color: 'yellow' },
};

export function ClientPortalPage() {
  const [searchType, setSearchType] = useState<'code' | 'phone'>('code');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      let results: AppointmentResult[] = [];

      if (searchType === 'code') {
        // Search by confirmation code
        const result = await appointmentsService.getByConfirmationCode(searchValue.trim().toUpperCase());
        if (result) {
          results = [result];
        }
      } else {
        // Search by phone number
        const phone = searchValue.trim().replace(/\s/g, '');
        const result = await appointmentsService.getByPhone(phone);
        results = result || [];
      }

      setAppointments(results);
    } catch (err: any) {
      console.error('Search error:', err);
      if (err.response?.status === 404) {
        setAppointments([]);
      } else {
        setError('Eroare la căutare. Vă rugăm încercați din nou.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchValue('');
    setAppointments([]);
    setSearched(false);
    setError(null);
  };

  const isUpcoming = (dateStr: string) => {
    const appointmentDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
  };

  const isPast = (dateStr: string) => {
    const appointmentDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate < today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MISEDA INSPECT</h1>
                <p className="text-blue-300 text-sm">Portal Clienți</p>
              </div>
            </a>
            <div className="text-right hidden md:block">
              <a href="tel:0756596565" className="flex items-center justify-end gap-2 text-lg font-bold hover:text-blue-300">
                <Phone size={20} />
                <span>0756 596 565</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Verifică Programarea Ta
          </h2>
          <p className="text-blue-200 text-lg">
            Introdu codul de confirmare sau numărul de telefon pentru a vedea detaliile programării
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-2xl mx-auto px-4 -mt-8 mb-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Search Type Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setSearchType('code'); setSearchValue(''); setSearched(false); }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                searchType === 'code'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText size={18} />
              Cod Confirmare
            </button>
            <button
              onClick={() => { setSearchType('phone'); setSearchValue(''); setSearched(false); }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                searchType === 'phone'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Phone size={18} />
              Număr Telefon
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === 'code' ? 'Cod de confirmare' : 'Număr de telefon'}
              </label>
              <div className="relative">
                <input
                  type={searchType === 'phone' ? 'tel' : 'text'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(searchType === 'code' ? e.target.value.toUpperCase() : e.target.value)}
                  placeholder={searchType === 'code' ? 'Ex: ABC123' : 'Ex: 0722 123 456'}
                  className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !searchValue.trim()}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Se caută...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Caută Programarea
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {searched && (
        <section className="max-w-4xl mx-auto px-4 pb-16">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Nu am găsit nicio programare
              </h3>
              <p className="text-gray-500 mb-6">
                {searchType === 'code'
                  ? 'Verifică dacă ai introdus corect codul de confirmare.'
                  : 'Nu există programări asociate cu acest număr de telefon.'}
              </p>
              <button
                onClick={resetSearch}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="inline mr-2" size={18} />
                Încearcă din nou
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {appointments.length === 1 ? 'Programarea ta' : `${appointments.length} programări găsite`}
                </h3>
                <button
                  onClick={resetSearch}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Căutare nouă
                </button>
              </div>

              {/* Separate upcoming and past appointments */}
              {appointments.filter(a => isUpcoming(a.appointmentDate)).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <Calendar size={20} />
                    Programări Viitoare
                  </h4>
                  <div className="space-y-4">
                    {appointments
                      .filter(a => isUpcoming(a.appointmentDate))
                      .map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                  </div>
                </div>
              )}

              {appointments.filter(a => isPast(a.appointmentDate)).length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Programări Anterioare
                  </h4>
                  <div className="space-y-4 opacity-80">
                    {appointments
                      .filter(a => isPast(a.appointmentDate))
                      .map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} isPast />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Info Section */}
      {!searched && (
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="text-blue-400" />
                Cod de Confirmare
              </h3>
              <p className="text-gray-300 text-sm">
                Codul de confirmare l-ai primit după ce ai făcut programarea online.
                Este format din 6 caractere (litere și cifre).
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Phone className="text-green-400" />
                Număr de Telefon
              </h3>
              <p className="text-gray-300 text-sm">
                Introdu numărul de telefon folosit la programare pentru a vedea
                toate programările tale (viitoare și anterioare).
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <a href="/" className="hover:text-white transition-colors">
                ← Înapoi la pagina principală
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a href="tel:0756596565" className="flex items-center gap-2 hover:text-white">
                <Phone size={16} /> 0756 596 565
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={16} /> Rădăuți, Suceava
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({ appointment, isPast = false }: { appointment: AppointmentResult; isPast?: boolean }) {
  const statusInfo = STATUS_INFO[appointment.status] || STATUS_INFO.PENDING;
  const StatusIcon = statusInfo.icon;

  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} />
            <span className="font-semibold">{formatDate(appointment.appointmentDate)}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[statusInfo.color]}`}>
            <StatusIcon size={14} className="inline mr-1" />
            {statusInfo.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {appointment.confirmationCode && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Cod Confirmare</p>
                <p className="font-mono text-2xl font-bold text-blue-600">{appointment.confirmationCode}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Ora programării</p>
              <p className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-gray-400" />
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Serviciu</p>
              <p className="font-medium text-gray-800">{appointment.serviceType}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Vehicul</p>
              <p className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Car size={20} className="text-gray-400" />
                {appointment.vehiclePlate || 'N/A'}
              </p>
              {(appointment.vehicleMake || appointment.vehicleModel) && (
                <p className="text-gray-600">
                  {appointment.vehicleMake} {appointment.vehicleModel}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Client</p>
              <p className="font-medium text-gray-800">{appointment.clientName}</p>
              <p className="text-gray-600 text-sm">{appointment.clientPhone}</p>
            </div>
          </div>
        </div>

        {/* RAR Block Warning */}
        {appointment.isRarBlocked && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-orange-800">Vehicul selectat pentru verificare RAR</p>
              <p className="text-sm text-orange-700">
                Timpul de așteptare a fost prelungit. Vă rugăm să aveți răbdare.
              </p>
            </div>
          </div>
        )}

        {/* ITP Result */}
        {appointment.itpResult && (
          <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${
            appointment.itpResult === 'ADMIS' ? 'bg-green-50 border border-green-200' :
            appointment.itpResult === 'RESPINS' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <span className="font-medium text-gray-700">Rezultat ITP:</span>
            <span className={`text-lg font-bold ${
              appointment.itpResult === 'ADMIS' ? 'text-green-600' :
              appointment.itpResult === 'RESPINS' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {ITP_RESULT_INFO[appointment.itpResult]?.label || appointment.itpResult}
            </span>
          </div>
        )}
      </div>

      {/* Footer - only for upcoming appointments */}
      {!isPast && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-gray-600">
              <strong>Nu uita!</strong> Prezintă-te cu 5 minute înainte.
              Adu: CIV (original), talon, RCA valabil, act identitate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
