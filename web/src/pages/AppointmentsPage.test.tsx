import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppointmentsPage } from './AppointmentsPage';

// Mock the api service
vi.mock('../services/api', () => ({
  appointmentsService: {
    getCalendarData: vi.fn().mockResolvedValue({
      month: 1,
      year: 2025,
      appointments: {
        '2025-01-15': [
          {
            id: 'apt1',
            clientName: 'Ion Popescu',
            clientPhone: '0745123456',
            vehiclePlate: 'SV01ABC',
            serviceType: 'ITP',
            appointmentDate: '2025-01-15T00:00:00.000Z',
            startTime: '09:00',
            endTime: '09:30',
            duration: 30,
            status: 'PENDING',
            confirmationCode: 'ABC123',
          },
          {
            id: 'apt2',
            clientName: 'Maria Ionescu',
            clientPhone: '0722987654',
            vehiclePlate: 'SV02XYZ',
            serviceType: 'ITP',
            appointmentDate: '2025-01-15T00:00:00.000Z',
            startTime: '10:00',
            endTime: '10:30',
            duration: 30,
            status: 'CONFIRMED',
            confirmationCode: 'DEF456',
          },
        ],
      },
    }),
    getStats: vi.fn().mockResolvedValue({
      todayAppointments: 5,
      weekAppointments: 12,
      pendingAppointments: 3,
      totalThisMonth: 45,
    }),
    getAvailableSlots: vi.fn().mockResolvedValue({
      available: true,
      slots: [
        { time: '08:00', available: true },
        { time: '08:30', available: true },
        { time: '09:00', available: false },
        { time: '09:30', available: true },
        { time: '10:00', available: true },
      ],
    }),
    create: vi.fn().mockResolvedValue({ id: 'apt3', confirmationCode: 'GHI789' }),
    confirm: vi.fn().mockResolvedValue({ id: 'apt1', status: 'CONFIRMED' }),
    cancel: vi.fn().mockResolvedValue({ id: 'apt1', status: 'CANCELLED' }),
    quickAdmis: vi.fn().mockResolvedValue({ id: 'apt1', status: 'COMPLETED', itpResult: 'ADMIS' }),
    noShow: vi.fn().mockResolvedValue({ id: 'apt1', status: 'NO_SHOW' }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  clientsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'client1',
        firstName: 'Ion',
        lastName: 'Popescu',
        phone: '0745123456',
        email: 'ion@email.com',
      },
    ]),
  },
  SERVICE_TYPE_LABELS: {
    ITP: 'Inspecție Tehnică Periodică',
    RCA: 'Asigurare RCA',
    SERVICE: 'Service Auto',
    ROVINIETA: 'Rovinietă',
    OTHER: 'Altele',
  },
  STATUS_LABELS: {
    PENDING: 'În așteptare',
    CONFIRMED: 'Confirmat',
    IN_PROGRESS: 'În desfășurare',
    COMPLETED: 'Finalizat',
    CANCELLED: 'Anulat',
    NO_SHOW: 'Neprezentare',
    RAR_BLOCKED: 'Blocat RAR',
  },
  STATUS_COLORS: {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-700',
    RAR_BLOCKED: 'bg-orange-100 text-orange-700',
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AppointmentsPage', () => {
  it('renders the page title', async () => {
    renderWithRouter(<AppointmentsPage />);
    expect(screen.getByText('Programări')).toBeInTheDocument();
  });

  it('renders the new appointment button', async () => {
    renderWithRouter(<AppointmentsPage />);
    expect(screen.getByText('Programare Nouă')).toBeInTheDocument();
  });

  it('displays stats cards', async () => {
    renderWithRouter(<AppointmentsPage />);
    await waitFor(() => {
      expect(screen.getByText('Săptămâna aceasta')).toBeInTheDocument();
    });
    expect(screen.getByText('Total luna aceasta')).toBeInTheDocument();
  });

  it('renders calendar month navigation', async () => {
    renderWithRouter(<AppointmentsPage />);
    expect(screen.getByText('Astăzi')).toBeInTheDocument();
  });

  it('renders day headers', async () => {
    renderWithRouter(<AppointmentsPage />);
    await waitFor(() => {
      expect(screen.getByText('Lun')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
      expect(screen.getByText('Mie')).toBeInTheDocument();
      expect(screen.getByText('Joi')).toBeInTheDocument();
      expect(screen.getByText('Vin')).toBeInTheDocument();
      expect(screen.getByText('Sam')).toBeInTheDocument();
      expect(screen.getByText('Dum')).toBeInTheDocument();
    });
  });

  it('opens new appointment modal when clicking button', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Nume Client *')).toBeInTheDocument();
      expect(screen.getByText('Telefon *')).toBeInTheDocument();
    });
  });

  it('shows client selector in modal', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Client Existent')).toBeInTheDocument();
    });
  });

  it('shows vehicle fields in modal', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Nr. Înmatriculare')).toBeInTheDocument();
      expect(screen.getByText('Marcă')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
    });
  });

  it('shows service type selector in modal', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Tip Serviciu *')).toBeInTheDocument();
    });
  });

  it('shows duration selector in modal', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Durată (minute)')).toBeInTheDocument();
    });
  });

  it('has cancel button in modal', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Anulează')).toBeInTheDocument();
    });
  });

  it('has create button in modal', async () => {
    renderWithRouter(<AppointmentsPage />);

    const addButton = screen.getByText('Programare Nouă');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Creează Programare')).toBeInTheDocument();
    });
  });
});
