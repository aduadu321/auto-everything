import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VehiclesPage } from './VehiclesPage';

// Mock the api service
vi.mock('../services/api', () => ({
  clientsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'client1',
        firstName: 'Ion',
        lastName: 'Popescu',
        phone: '0745123456',
        email: 'ion@email.com',
      },
      {
        id: 'client2',
        firstName: 'Maria',
        lastName: 'Ionescu',
        phone: '0722987654',
        email: 'maria@email.com',
      },
    ]),
  },
  vehiclesService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'v1',
        plateNumber: 'SV01ABC',
        make: 'Dacia',
        model: 'Logan',
        year: 2020,
        vin: 'VIN123456789',
        clientId: 'client1',
        client: {
          id: 'client1',
          firstName: 'Ion',
          lastName: 'Popescu',
          phone: '0745123456',
        },
        documents: [],
      },
      {
        id: 'v2',
        plateNumber: 'SV02XYZ',
        make: 'Volkswagen',
        model: 'Golf',
        year: 2019,
        vin: 'VIN987654321',
        clientId: 'client1',
        client: {
          id: 'client1',
          firstName: 'Ion',
          lastName: 'Popescu',
          phone: '0745123456',
        },
        documents: [{ id: 'd1', type: 'ITP', status: 'ACTIVE' }],
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 'v3', plateNumber: 'SV03NEW' }),
    update: vi.fn().mockResolvedValue({ id: 'v1', plateNumber: 'SV01UPD' }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  documentsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'd1',
        type: 'ITP',
        issueDate: '2024-01-15T00:00:00.000Z',
        expiryDate: '2025-01-15T00:00:00.000Z',
        status: 'ACTIVE',
        vehicleId: 'v1',
        documentNumber: 'ITP-001',
      },
      {
        id: 'd2',
        type: 'RCA',
        issueDate: '2024-06-01T00:00:00.000Z',
        expiryDate: '2025-06-01T00:00:00.000Z',
        status: 'ACTIVE',
        vehicleId: 'v1',
        documentNumber: 'RCA-001',
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: 'd3', type: 'CASCO' }),
    update: vi.fn().mockResolvedValue({ id: 'd1', type: 'ITP' }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  notificationsService: {
    sendNotification: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('VehiclesPage', () => {
  it('renders the page title', async () => {
    renderWithRouter(<VehiclesPage />);
    expect(screen.getByText('Vehicule & Documente')).toBeInTheDocument();
  });

  it('renders client selector', async () => {
    renderWithRouter(<VehiclesPage />);
    expect(screen.getByText('Selecteaza Clientul')).toBeInTheDocument();
  });

  it('loads and displays clients in dropdown', async () => {
    renderWithRouter(<VehiclesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });
  });

  it('shows vehicles section after selecting a client', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText('Vehicule')).toBeInTheDocument();
    });
  });

  it('displays vehicle list after selecting client', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText('SV01ABC')).toBeInTheDocument();
      expect(screen.getByText('SV02XYZ')).toBeInTheDocument();
    });
  });

  it('shows vehicle make and model', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText(/Dacia Logan/)).toBeInTheDocument();
      expect(screen.getByText(/Volkswagen Golf/)).toBeInTheDocument();
    });
  });

  it('opens vehicle modal when clicking add button', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText('Vehicule')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Adauga');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Adauga Vehicul Nou')).toBeInTheDocument();
    });
  });

  it('shows form fields in vehicle modal', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText('Vehicule')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Adauga');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Numar Inmatriculare *')).toBeInTheDocument();
      expect(screen.getByText('Marca *')).toBeInTheDocument();
      expect(screen.getByText('Model *')).toBeInTheDocument();
    });
  });

  it('shows documents panel placeholder when no vehicle selected', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText('Selecteaza un vehicul pentru a vedea documentele')).toBeInTheDocument();
    });
  });

  it('displays documents section title', async () => {
    renderWithRouter(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'client1' } });

    await waitFor(() => {
      expect(screen.getByText('Documente')).toBeInTheDocument();
    });
  });
});
