import axios from 'axios';

// Use environment variable or default to /api for production
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface BalanceResponse {
  twilio: { credits: number; currency: string } | null;
  smslink: { credits: number; currency: string };
}

// Client Types
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  county?: string;
  preferSms: boolean;
  preferEmail: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicles?: Vehicle[];
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  county?: string;
  preferSms?: boolean;
  preferEmail?: boolean;
  notes?: string;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  clientId: string;
  client?: Client;
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDto {
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  clientId: string;
}

// Document Types
export type DocumentType = 'ITP' | 'RCA' | 'CASCO' | 'VIGNETTE' | 'OTHER';
export type DocumentStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED';

export interface Document {
  id: string;
  type: DocumentType;
  issueDate: string;
  expiryDate: string;
  status: DocumentStatus;
  documentNumber?: string;
  vehicleId: string;
  vehicle?: Vehicle;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDto {
  type: DocumentType;
  issueDate: string;
  expiryDate: string;
  documentNumber?: string;
  vehicleId: string;
}

// Notification Template Types
export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  triggerDays: number;
  smsEnabled: boolean;
  emailEnabled: boolean;
  smsContent?: string;
  emailSubject?: string;
  emailContent?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  type: DocumentType;
  triggerDays: number;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  smsContent?: string;
  emailSubject?: string;
  emailContent?: string;
  isDefault?: boolean;
}

export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
}

// Notification Log Types
export interface NotificationLog {
  id: string;
  channel: 'SMS' | 'EMAIL';
  recipient: string;
  subject?: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  providerRef?: string;
  errorMessage?: string;
  sentAt?: string;
  clientId: string;
  documentId: string;
  templateId?: string;
  client?: { firstName: string; lastName: string; phone: string };
  document?: { type: DocumentType; expiryDate: string };
  template?: { name: string };
  createdAt: string;
}

export const smsService = {
  send: async (phone: string, message: string): Promise<SendSmsResponse> => {
    const { data } = await api.post('/sms/send', { phone, message });
    return data;
  },

  sendBulk: async (messages: Array<{ phone: string; message: string }>) => {
    const { data } = await api.post('/sms/send-bulk', { messages });
    return data;
  },

  getBalance: async (): Promise<BalanceResponse> => {
    const { data } = await api.get('/sms/balance');
    return data;
  },
};

export const emailService = {
  send: async (to: string, subject: string, body: string) => {
    const { data } = await api.post('/email/send', { to, subject, body });
    return data;
  },
};

// Clients Service
export const clientsService = {
  getAll: async (search?: string): Promise<Client[]> => {
    const { data } = await api.get('/clients', { params: { search } });
    return data.data || data;
  },

  getById: async (id: string): Promise<Client> => {
    const { data } = await api.get(`/clients/${id}`);
    return data;
  },

  create: async (dto: CreateClientDto): Promise<Client> => {
    const { data } = await api.post('/clients', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateClientDto>): Promise<Client> => {
    const { data } = await api.put(`/clients/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  getStats: async () => {
    const { data } = await api.get('/clients/stats');
    return data;
  },
};

// Vehicles Service
export const vehiclesService = {
  getAll: async (clientId?: string): Promise<Vehicle[]> => {
    const { data } = await api.get('/vehicles', { params: { clientId } });
    return data;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },

  create: async (dto: CreateVehicleDto): Promise<Vehicle> => {
    const { data } = await api.post('/vehicles', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateVehicleDto>): Promise<Vehicle> => {
    const { data } = await api.put(`/vehicles/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};

// Documents Service
export const documentsService = {
  getAll: async (params?: { vehicleId?: string; type?: DocumentType; status?: DocumentStatus }): Promise<Document[]> => {
    const { data } = await api.get('/documents', { params });
    return data;
  },

  getById: async (id: string): Promise<Document> => {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  create: async (dto: CreateDocumentDto): Promise<Document> => {
    const { data } = await api.post('/documents', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateDocumentDto>): Promise<Document> => {
    const { data } = await api.put(`/documents/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  getExpiring: async (days?: number) => {
    const { data } = await api.get('/documents/expiring', { params: { days } });
    return data;
  },

  renew: async (id: string, newExpiryDate: string): Promise<Document> => {
    const { data } = await api.put(`/documents/${id}/renew`, { newExpiryDate });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/documents/stats');
    return data;
  },
};

// Notifications Service
export const notificationsService = {
  // Templates
  getTemplates: async (type?: DocumentType): Promise<NotificationTemplate[]> => {
    const { data } = await api.get('/notifications/templates', { params: { type } });
    return data;
  },

  getTemplate: async (id: string): Promise<NotificationTemplate> => {
    const { data } = await api.get(`/notifications/templates/${id}`);
    return data;
  },

  createTemplate: async (dto: CreateTemplateDto): Promise<NotificationTemplate> => {
    const { data } = await api.post('/notifications/templates', dto);
    return data;
  },

  updateTemplate: async (id: string, dto: Partial<CreateTemplateDto & { isActive?: boolean }>): Promise<NotificationTemplate> => {
    const { data } = await api.put(`/notifications/templates/${id}`, dto);
    return data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/notifications/templates/${id}`);
  },

  getTemplateVariables: async (): Promise<TemplateVariable[]> => {
    const { data } = await api.get('/notifications/templates/variables');
    return data;
  },

  seedDefaults: async () => {
    const { data } = await api.post('/notifications/templates/seed-defaults');
    return data;
  },

  // Send Notification
  sendNotification: async (documentId: string, channel: 'SMS' | 'EMAIL', templateId?: string) => {
    const { data } = await api.post('/notifications/send', { documentId, channel, templateId });
    return data;
  },

  // Logs
  getLogs: async (params?: { clientId?: string; documentId?: string; channel?: string; page?: number; limit?: number }): Promise<{ data: NotificationLog[]; meta: { total: number; totalPages: number } }> => {
    const { data } = await api.get('/notifications/logs', { params });
    return data;
  },

  // Scheduler
  runManualCheck: async () => {
    const { data } = await api.post('/notifications/scheduler/run');
    return data;
  },

  getSchedulerStats: async () => {
    const { data } = await api.get('/notifications/scheduler/stats');
    return data;
  },
};

// Appointment Types
export type ServiceType =
  | 'ITP'
  | 'ITP_REINSPECTIE'
  | 'DIAGNOSTIC'
  | 'OIL_CHANGE'
  | 'BRAKE_SERVICE'
  | 'TIRE_SERVICE'
  | 'AC_SERVICE'
  | 'GENERAL_SERVICE'
  | 'CONSULTATION'
  | 'OTHER';

export type VehicleCategory = 'AUTOTURISM' | 'AUTOUTILITARA' | 'MOTOCICLETA' | 'REMORCA' | 'ATV';

export type ItpResult = 'ADMIS' | 'RESPINS' | 'ADMIS_OBS';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'RAR_BLOCKED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleCategory: VehicleCategory;
  serviceType: ServiceType;
  serviceNotes?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  // RAR Blocking
  isRarBlocked: boolean;
  rarBlockedAt?: string;
  rarNotes?: string;
  // ITP Result
  itpResult?: ItpResult;
  itpNotes?: string;
  // Status
  status: AppointmentStatus;
  confirmationCode?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  reminderSent: boolean;
  clientId?: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleCategory?: VehicleCategory;
  serviceType: ServiceType;
  serviceNotes?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  clientId?: string;
}

export interface WorkingHours {
  id: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  slotDuration: number;
  maxAppointments: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  isOrthodox: boolean;
}

export interface TimeSlot {
  time: string;
  isBreak: boolean;
  available: boolean;
  appointmentsCount: number;
  maxAppointments: number;
}

export interface SlotsResponse {
  available: boolean;
  reason?: string;
  workingHours?: {
    open: string;
    close: string;
    breakStart?: string;
    breakEnd?: string;
  };
  slots: TimeSlot[];
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ITP: 'Inspecție Tehnică Periodică (ITP)',
  ITP_REINSPECTIE: 'Reinspecție ITP',
  DIAGNOSTIC: 'Diagnoză Auto',
  OIL_CHANGE: 'Schimb Ulei',
  BRAKE_SERVICE: 'Service Frâne',
  TIRE_SERVICE: 'Service Anvelope',
  AC_SERVICE: 'Service AC',
  GENERAL_SERVICE: 'Service General',
  CONSULTATION: 'Consultație',
  OTHER: 'Altele',
};

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  AUTOTURISM: 'Autoturism (M1)',
  AUTOUTILITARA: 'Autoutilitară (N1)',
  MOTOCICLETA: 'Motocicletă',
  REMORCA: 'Remorcă',
  ATV: 'ATV/Quad',
};

export const ITP_RESULT_LABELS: Record<ItpResult, string> = {
  ADMIS: 'Admis',
  RESPINS: 'Respins',
  ADMIS_OBS: 'Admis cu observații',
};

export const ITP_RESULT_COLORS: Record<ItpResult, string> = {
  ADMIS: 'bg-green-100 text-green-800',
  RESPINS: 'bg-red-100 text-red-800',
  ADMIS_OBS: 'bg-yellow-100 text-yellow-800',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'În așteptare',
  CONFIRMED: 'Confirmat',
  IN_PROGRESS: 'În desfășurare',
  RAR_BLOCKED: 'Blocat RAR',
  CANCELLED: 'Anulat',
  COMPLETED: 'Finalizat',
  NO_SHOW: 'Neprezentare',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RAR_BLOCKED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-gray-200 text-gray-600',
};

// Appointments Service
export const appointmentsService = {
  // CRUD
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    clientId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/appointments', { params });
    return data.data || data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const { data } = await api.get(`/appointments/${id}`);
    return data;
  },

  getByConfirmationCode: async (code: string): Promise<Appointment> => {
    const { data } = await api.get(`/appointments/confirmation/${code}`);
    return data;
  },

  getByPhone: async (phone: string): Promise<Appointment[]> => {
    const { data } = await api.get(`/appointments/by-phone/${phone}`);
    return data;
  },

  create: async (dto: CreateAppointmentDto): Promise<Appointment> => {
    const { data } = await api.post('/appointments', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateAppointmentDto>): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  // Status changes
  confirm: async (id: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/confirm`);
    return data;
  },

  cancel: async (id: string, reason?: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/cancel`, { reason });
    return data;
  },

  complete: async (id: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/complete`);
    return data;
  },

  noShow: async (id: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/no-show`);
    return data;
  },

  startInspection: async (id: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/start`);
    return data;
  },

  markRarBlocked: async (id: string, notes?: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/rar-block`, { notes });
    return data;
  },

  setItpResult: async (id: string, result: ItpResult, notes?: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/itp-result`, { result, notes });
    return data;
  },

  quickAdmis: async (id: string, notes?: string): Promise<Appointment> => {
    const { data } = await api.put(`/appointments/${id}/quick-admis`, { notes });
    return data;
  },

  // Calendar & Slots
  getCalendarData: async (month: number, year: number) => {
    const { data } = await api.get('/appointments/calendar', { params: { month, year } });
    return data;
  },

  getAvailableSlots: async (date: string, duration?: number): Promise<SlotsResponse> => {
    const { data } = await api.get('/appointments/slots', { params: { date, duration } });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/appointments/stats');
    return data;
  },

  // Working Hours
  getWorkingHours: async (): Promise<WorkingHours[]> => {
    const { data } = await api.get('/appointments/settings/working-hours');
    return data;
  },

  updateWorkingHours: async (dto: Partial<WorkingHours>): Promise<WorkingHours> => {
    const { data } = await api.put('/appointments/settings/working-hours', dto);
    return data;
  },

  updateAllWorkingHours: async (workingHours: Partial<WorkingHours>[]): Promise<WorkingHours[]> => {
    const { data } = await api.put('/appointments/settings/working-hours/bulk', { workingHours });
    return data;
  },

  seedDefaultWorkingHours: async () => {
    const { data } = await api.post('/appointments/settings/working-hours/seed');
    return data;
  },

  // Holidays
  getHolidays: async (year?: number): Promise<Holiday[]> => {
    const { data } = await api.get('/appointments/settings/holidays', { params: { year } });
    return data;
  },

  createHoliday: async (dto: { name: string; date: string; isRecurring?: boolean; isOrthodox?: boolean }): Promise<Holiday> => {
    const { data } = await api.post('/appointments/settings/holidays', dto);
    return data;
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await api.delete(`/appointments/settings/holidays/${id}`);
  },

  seedRomanianHolidays: async (year?: number) => {
    const { data } = await api.post('/appointments/settings/holidays/seed-romanian', null, { params: { year } });
    return data;
  },
};

// Holidays Service (direct endpoint for blocked days management)
export const holidaysService = {
  getAll: async (): Promise<Holiday[]> => {
    const { data } = await api.get('/holidays');
    return data;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Holiday[]> => {
    const { data } = await api.get('/holidays', { params: { startDate, endDate } });
    return data;
  },

  create: async (dto: { name: string; date: string; isRecurring?: boolean }): Promise<Holiday> => {
    const { data } = await api.post('/holidays', dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/holidays/${id}`);
  },
};
