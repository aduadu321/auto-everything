import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ClientsPage } from './ClientsPage';

// Mock the api service
vi.mock('../services/api', () => ({
  clientsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: '1',
        firstName: 'Ion',
        lastName: 'Popescu',
        phone: '0745123456',
        email: 'ion@email.com',
        city: 'Suceava',
        county: 'Suceava',
        preferSms: true,
        preferEmail: false,
        isActive: true,
        vehicles: [],
      },
      {
        id: '2',
        firstName: 'Maria',
        lastName: 'Ionescu',
        phone: '0722987654',
        email: 'maria@email.com',
        city: 'Rădăuți',
        county: 'Suceava',
        preferSms: true,
        preferEmail: true,
        isActive: true,
        vehicles: [{ id: 'v1', plateNumber: 'SV 01 ABC' }],
      },
    ]),
    create: vi.fn().mockResolvedValue({ id: '3', firstName: 'Test', lastName: 'Client' }),
    update: vi.fn().mockResolvedValue({ id: '1', firstName: 'Updated', lastName: 'Client' }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ClientsPage', () => {
  it('renders the page title', async () => {
    renderWithRouter(<ClientsPage />);
    expect(screen.getByText('Clienti')).toBeInTheDocument();
  });

  it('renders add client button', async () => {
    renderWithRouter(<ClientsPage />);
    expect(screen.getByText('Adauga Client')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderWithRouter(<ClientsPage />);
    expect(screen.getByPlaceholderText(/Cauta dupa nume sau telefon/i)).toBeInTheDocument();
  });

  it('displays client list after loading', async () => {
    renderWithRouter(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText('Ion Popescu')).toBeInTheDocument();
    });
    expect(screen.getByText('Maria Ionescu')).toBeInTheDocument();
  });

  it('shows SMS and Email preference badges', async () => {
    renderWithRouter(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('SMS').length).toBeGreaterThan(0);
    });
  });

  it('opens modal when clicking add button', async () => {
    renderWithRouter(<ClientsPage />);
    const addButton = screen.getByText('Adauga Client');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Adauga Client Nou')).toBeInTheDocument();
    });
  });

  it('shows form fields in modal', async () => {
    renderWithRouter(<ClientsPage />);
    const addButton = screen.getByText('Adauga Client');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Prenume *')).toBeInTheDocument();
      expect(screen.getByText('Telefon *')).toBeInTheDocument();
    });
  });

  it('displays vehicle count for each client', async () => {
    renderWithRouter(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText('0 vehicule')).toBeInTheDocument();
      expect(screen.getByText('1 vehicule')).toBeInTheDocument();
    });
  });
});
