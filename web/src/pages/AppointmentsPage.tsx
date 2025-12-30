import { useState, useEffect, useMemo } from 'react';
import {
  appointmentsService,
  clientsService,
  type Appointment,
  type CreateAppointmentDto,
  type ServiceType,
  type TimeSlot,
  type Client,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../services/api';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  Car,
  Check,
  XCircle,
  Calendar as CalendarIcon,
  Settings,
  User,
} from 'lucide-react';

const DAYS_RO = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam'];
const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState<CreateAppointmentDto>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    vehiclePlate: '',
    vehicleMake: '',
    vehicleModel: '',
    serviceType: 'ITP',
    serviceNotes: '',
    appointmentDate: '',
    startTime: '',
    duration: 60,
  });

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadCalendarData();
    loadStats();
    loadClients();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (selectedDate && showModal) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, showModal]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getCalendarData(currentMonth + 1, currentYear);
      setAppointments(data.appointments || {});
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await appointmentsService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsService.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadAvailableSlots = async (date: Date) => {
    try {
      setSlotsLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const data = await appointmentsService.getAvailableSlots(dateStr, formData.duration);
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    return days;
  }, [currentMonth, currentYear]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      appointmentDate: date.toISOString().split('T')[0],
      startTime: '',
    });
    setShowModal(true);
  };

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setShowDetailsModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentsService.create(formData);
      setShowModal(false);
      resetForm();
      loadCalendarData();
      loadStats();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error.response?.data?.message || 'Eroare la crearea programării');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await appointmentsService.confirm(id);
      loadCalendarData();
      loadStats();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Motiv anulare (opțional):');
    try {
      await appointmentsService.cancel(id, reason || undefined);
      loadCalendarData();
      loadStats();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleQuickAdmis = async (id: string) => {
    try {
      await appointmentsService.quickAdmis(id);
      loadCalendarData();
      loadStats();
      setShowDetailsModal(false);
      alert('✓ Programare finalizată cu ADMIS! SMS trimis către client.');
    } catch (error: any) {
      console.error('Error marking as ADMIS:', error);
      alert(error.response?.data?.message || 'Eroare la marcarea ca ADMIS');
    }
  };

  const handleNoShow = async (id: string) => {
    try {
      await appointmentsService.noShow(id);
      loadCalendarData();
      loadStats();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error marking no-show:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți această programare?')) return;
    try {
      await appointmentsService.delete(id);
      loadCalendarData();
      loadStats();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      vehiclePlate: '',
      vehicleMake: '',
      vehicleModel: '',
      serviceType: 'ITP',
      serviceNotes: '',
      appointmentDate: '',
      startTime: '',
      duration: 60,
    });
    setSelectedDate(null);
    setAvailableSlots([]);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        clientPhone: client.phone,
        clientEmail: client.email || '',
      });
    }
  };

  const getDateKey = (date: Date) => date.toISOString().split('T')[0];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Programări</h1>
          <p className="text-gray-500">Gestionează programările clienților</p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setFormData({
              ...formData,
              appointmentDate: new Date().toISOString().split('T')[0],
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Programare Nouă
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Astăzi</div>
            <div className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Săptămâna aceasta</div>
            <div className="text-2xl font-bold text-green-600">{stats.weekAppointments}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">În așteptare</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingAppointments}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total luna aceasta</div>
            <div className="text-2xl font-bold text-gray-600">{stats.totalThisMonth}</div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {MONTHS_RO[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Astăzi
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_RO.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {loading ? (
            <div className="py-20 text-center text-gray-500">Se încarcă...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-24 bg-gray-50 rounded-lg" />;
                }

                const dateKey = getDateKey(date);
                const dayAppointments = appointments[dateKey] || [];
                const isCurrentDay = isToday(date);
                const isPastDay = isPast(date);

                return (
                  <div
                    key={dateKey}
                    onClick={() => !isPastDay && handleDayClick(date)}
                    className={`min-h-24 p-2 rounded-lg border transition-colors cursor-pointer ${
                      isCurrentDay
                        ? 'border-blue-500 bg-blue-50'
                        : isPastDay
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay ? 'text-blue-600' : isPastDay ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => handleAppointmentClick(apt, e)}
                          className={`text-xs p-1 rounded truncate ${STATUS_COLORS[apt.status]} cursor-pointer hover:opacity-80`}
                        >
                          {apt.startTime} - {apt.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayAppointments.length - 3} mai mult
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">
                Programare Nouă - {selectedDate?.toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Existent</label>
                <select
                  onChange={(e) => e.target.value && handleClientSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Selectați sau completați manual --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} - {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nume Client *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    required
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+40..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nr. Înmatriculare</label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                    placeholder="B 123 ABC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marcă</label>
                  <input
                    type="text"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    placeholder="Dacia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="Logan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Service */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip Serviciu *</label>
                  <select
                    required
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durată (minute)</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => {
                      setFormData({ ...formData, duration: parseInt(e.target.value), startTime: '' });
                      if (selectedDate) loadAvailableSlots(selectedDate);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 minute</option>
                    <option value={60}>1 oră</option>
                    <option value={90}>1.5 ore</option>
                    <option value={120}>2 ore</option>
                    <option value={180}>3 ore</option>
                  </select>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ora Programării *</label>
                {slotsLoading ? (
                  <div className="text-gray-500 text-center py-4">Se încarcă intervalele...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-red-500 text-center py-4">Nu sunt intervale disponibile pentru această zi</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setFormData({ ...formData, startTime: slot.time })}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          formData.startTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : slot.available
                            ? 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.serviceNotes}
                  onChange={(e) => setFormData({ ...formData, serviceNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={!formData.startTime}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Creează Programare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Detalii Programare</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedAppointment.status]}`}>
                  {STATUS_LABELS[selectedAppointment.status]}
                </span>
                {selectedAppointment.confirmationCode && (
                  <span className="text-sm text-gray-500">
                    Cod: <span className="font-mono font-bold">{selectedAppointment.confirmationCode}</span>
                  </span>
                )}
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 text-gray-700">
                <CalendarIcon size={20} className="text-gray-400" />
                <div>
                  <div className="font-medium">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString('ro-RO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime} ({selectedAppointment.duration} min)
                  </div>
                </div>
              </div>

              {/* Client */}
              <div className="flex items-start gap-3 text-gray-700">
                <User size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">{selectedAppointment.clientName}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} /> {selectedAppointment.clientPhone}
                  </div>
                  {selectedAppointment.clientEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail size={14} /> {selectedAppointment.clientEmail}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle */}
              {selectedAppointment.vehiclePlate && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Car size={20} className="text-gray-400" />
                  <div>
                    <span className="font-medium">{selectedAppointment.vehiclePlate}</span>
                    {selectedAppointment.vehicleMake && (
                      <span className="text-gray-500"> - {selectedAppointment.vehicleMake} {selectedAppointment.vehicleModel}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Service */}
              <div className="flex items-center gap-3 text-gray-700">
                <Settings size={20} className="text-gray-400" />
                <div>
                  <div className="font-medium">{SERVICE_TYPE_LABELS[selectedAppointment.serviceType]}</div>
                  {selectedAppointment.serviceNotes && (
                    <div className="text-sm text-gray-500">{selectedAppointment.serviceNotes}</div>
                  )}
                </div>
              </div>

              {/* Cancel Reason */}
              {selectedAppointment.cancelReason && (
                <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <strong>Motiv anulare:</strong> {selectedAppointment.cancelReason}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {(selectedAppointment.status === 'PENDING' || selectedAppointment.status === 'CONFIRMED' || selectedAppointment.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => handleQuickAdmis(selectedAppointment.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    <Check size={18} /> ✓ ADMIS
                  </button>
                )}

                {selectedAppointment.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleConfirm(selectedAppointment.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check size={18} /> Confirmă
                    </button>
                    <button
                      onClick={() => handleCancel(selectedAppointment.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={18} /> Anulează
                    </button>
                  </>
                )}

                {selectedAppointment.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => handleNoShow(selectedAppointment.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <XCircle size={18} /> Neprezentare
                    </button>
                    <button
                      onClick={() => handleCancel(selectedAppointment.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={18} /> Anulează
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(selectedAppointment.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                >
                  Șterge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
