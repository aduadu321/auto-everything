import { useState, useEffect } from 'react';
import { holidaysService, type Holiday } from '../services/api';
import {
  Calendar,
  Plus,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';

const DAYS_RO = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

// Parolă simplă pentru acces admin
const ADMIN_PASSWORD = 'miseda2024';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [adding, setAdding] = useState(false);

  // Program de lucru
  const workingHours = {
    weekdays: { open: '08:00', close: '20:00' },
    saturday: { open: '08:00', close: '13:00' },
    sunday: { closed: true }
  };

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadHolidays();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Parolă incorectă');
    }
  };

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidaysService.getAll();
      setHolidays(data);
    } catch (err) {
      console.error('Error loading holidays:', err);
      setError('Eroare la încărcarea zilelor blocate');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isHolidayDate = (date: Date): Holiday | undefined => {
    const dateStr = formatDateLocal(date);
    return holidays.find(h => h.date.split('T')[0] === dateStr);
  };

  const handleAddHoliday = async () => {
    if (!selectedDate || !newHolidayName.trim()) return;

    try {
      setAdding(true);
      setError(null);
      await holidaysService.create({
        name: newHolidayName.trim(),
        date: formatDateLocal(selectedDate),
        isRecurring: false,
      });
      setSuccess(`Zi blocată adăugată: ${newHolidayName}`);
      setNewHolidayName('');
      setSelectedDate(null);
      await loadHolidays();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding holiday:', err);
      setError('Eroare la adăugarea zilei blocate');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    if (!confirm(`Sigur doriți să ștergeți "${holiday.name}"?`)) return;

    try {
      setError(null);
      await holidaysService.delete(holiday.id);
      setSuccess(`Zi blocată ștearsă: ${holiday.name}`);
      await loadHolidays();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting holiday:', err);
      setError('Eroare la ștergerea zilei blocate');
    }
  };


  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 mt-2">MISEDA INSPECT SRL</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parolă Administrator
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Introduceți parola"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Autentificare
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-600 hover:underline text-sm">
              &larr; Înapoi la site
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">MISEDA INSPECT SRL</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-slate-400 hover:text-white text-sm">
              &larr; Site Public
            </a>
            <button
              onClick={() => {
                sessionStorage.removeItem('adminAuth');
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
            >
              Deconectare
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Calendar - Zile Blocate
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Click pe o zi pentru a o bloca. Zilele roșii sunt deja blocate.
            </p>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-semibold text-gray-700">
                {MONTHS_RO[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_RO.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-14" />;
                }

                const holiday = isHolidayDate(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                const isSunday = date.getDay() === 0;
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !isPast && setSelectedDate(date)}
                    disabled={isPast}
                    className={`h-14 rounded-lg font-medium transition-all relative flex flex-col items-center justify-center text-sm ${
                      isSelected
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : holiday
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : isSunday
                        ? 'bg-gray-100 text-gray-400'
                        : isToday
                        ? 'bg-blue-50 text-blue-600'
                        : isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    title={holiday?.name || (isSunday ? 'Duminică - Închis' : '')}
                  >
                    <span>{date.getDate()}</span>
                    {holiday && (
                      <span className="text-[10px] truncate max-w-full px-1">
                        {holiday.name.length > 8 ? holiday.name.substring(0, 8) + '...' : holiday.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Add Holiday Form */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">
                  Blochează: {selectedDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>

                {/* Quick options */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => { setNewHolidayName('Probleme personale'); }}
                    className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm hover:bg-blue-100"
                  >
                    Probleme personale
                  </button>
                  <button
                    onClick={() => { setNewHolidayName('Concediu'); }}
                    className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm hover:bg-blue-100"
                  >
                    Concediu
                  </button>
                  <button
                    onClick={() => { setNewHolidayName('Defecțiune echipament'); }}
                    className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm hover:bg-blue-100"
                  >
                    Defecțiune echipament
                  </button>
                  <button
                    onClick={() => { setNewHolidayName('Întreținere stație'); }}
                    className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm hover:bg-blue-100"
                  >
                    Întreținere stație
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    placeholder="Motiv blocare (ex: Concediu)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddHoliday}
                    disabled={!newHolidayName.trim() || adding}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    {adding ? 'Se adaugă...' : 'Blochează'}
                  </button>
                </div>
                <button
                  onClick={() => { setSelectedDate(null); setNewHolidayName(''); }}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Anulează
                </button>
              </div>
            )}
          </div>

          {/* Right: Info & List */}
          <div className="space-y-6">
            {/* Working Hours */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Program de Lucru
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Luni - Vineri</span>
                  <span className="font-semibold text-gray-800">{workingHours.weekdays.open} - {workingHours.weekdays.close}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Sâmbătă</span>
                  <span className="font-semibold text-gray-800">{workingHours.saturday.open} - {workingHours.saturday.close}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Duminică</span>
                  <span className="font-semibold text-red-600">Închis</span>
                </div>
              </div>
            </div>

            {/* Blocked Days List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Zile Blocate ({holidays.length})
              </h3>

              {loading ? (
                <p className="text-gray-500 text-center py-4">Se încarcă...</p>
              ) : holidays.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nu există zile blocate</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {holidays
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{holiday.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(holiday.date).toLocaleDateString('ro-RO', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(holiday)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Șterge"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-md p-6 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informații Rapide
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Luna curentă:</strong> {MONTHS_RO[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
                <p><strong>Zile blocate total:</strong> {holidays.length}</p>
                <p className="text-blue-200 text-xs mt-4">
                  Zilele blocate din calendar vor fi indisponibile pentru programări online.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
