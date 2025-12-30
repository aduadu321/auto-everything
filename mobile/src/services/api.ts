import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://api.misedainspectsrl.ro';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pentru a adauga token-ul JWT
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pentru a gestiona erori de autentificare
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
      // Redirect to login will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await SecureStore.setItemAsync('authToken', response.data.access_token);
    }
    return response.data;
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
  },
  getToken: async () => {
    return await SecureStore.getItemAsync('authToken');
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Appointments Service
export const appointmentsService = {
  getCalendarData: async (month: number, year: number) => {
    const response = await api.get('/appointments/calendar', {
      params: { month, year },
    });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/appointments/stats');
    return response.data;
  },
  getAll: async (params?: any) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  confirm: async (id: string) => {
    const response = await api.put(`/appointments/${id}/confirm`);
    return response.data;
  },
  cancel: async (id: string, reason?: string) => {
    const response = await api.put(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },
  quickAdmis: async (id: string, notes?: string) => {
    const response = await api.put(`/appointments/${id}/quick-admis`, { notes });
    return response.data;
  },
  noShow: async (id: string) => {
    const response = await api.put(`/appointments/${id}/no-show`);
    return response.data;
  },
  searchUnified: async (query: string) => {
    const response = await api.get(`/appointments/search/${query}`);
    return response.data;
  },
};

// Clients Service
export const clientsService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  search: async (query: string) => {
    const response = await api.get('/clients/search', { params: { q: query } });
    return response.data;
  },
};

// Vehicles Service
export const vehiclesService = {
  getAll: async () => {
    const response = await api.get('/vehicles');
    return response.data;
  },
  getByClient: async (clientId: string) => {
    const response = await api.get('/vehicles', { params: { clientId } });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },
};

// Documents Service
export const documentsService = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  getExpiring: async () => {
    const response = await api.get('/documents/expiring');
    return response.data;
  },
  getByVehicle: async (vehicleId: string) => {
    const response = await api.get('/documents', { params: { vehicleId } });
    return response.data;
  },
};

// Notifications Service
export const notificationsService = {
  getLogs: async (params?: any) => {
    const response = await api.get('/notifications/logs', { params });
    return response.data;
  },
  getSchedulerStats: async () => {
    const response = await api.get('/notifications/scheduler/stats');
    return response.data;
  },
  runManualCheck: async () => {
    const response = await api.post('/notifications/scheduler/run');
    return response.data;
  },
};

// Dashboard Service
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default api;
