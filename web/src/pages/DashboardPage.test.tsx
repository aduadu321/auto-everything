import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock axios/api
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
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
        recentActivity: [],
        subscription: {
          plan: 'STARTER',
          status: 'active',
          smsCredits: 850,
          currentPeriodEnd: null,
        },
      },
    }),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  it('renders dashboard heading', async () => {
    renderWithProviders(<DashboardPage />);
    // Wait for loading to complete - multiple Dashboard texts exist
    const headings = await screen.findAllByText('Dashboard');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders sidebar menu items', async () => {
    renderWithProviders(<DashboardPage />);
    await screen.findAllByText('Dashboard');
    expect(screen.getByText('Programări')).toBeInTheDocument();
    expect(screen.getByText('Clienți')).toBeInTheDocument();
    expect(screen.getByText('Vehicule')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderWithProviders(<DashboardPage />);
    await screen.findAllByText('Dashboard');
    expect(screen.getByText('Total Clienți')).toBeInTheDocument();
    expect(screen.getByText('Total Vehicule')).toBeInTheDocument();
    expect(screen.getByText('Credite SMS')).toBeInTheDocument();
  });

  it('renders ITP expiring section', async () => {
    renderWithProviders(<DashboardPage />);
    await screen.findAllByText('Dashboard');
    expect(screen.getByText('ITP-uri care expiră')).toBeInTheDocument();
    expect(screen.getByText('În 7 zile')).toBeInTheDocument();
    expect(screen.getByText('În 30 zile')).toBeInTheDocument();
  });

  it('renders subscription section', async () => {
    renderWithProviders(<DashboardPage />);
    await screen.findAllByText('Dashboard');
    expect(screen.getByText('Abonament')).toBeInTheDocument();
  });

  it('renders logout button', async () => {
    renderWithProviders(<DashboardPage />);
    await screen.findAllByText('Dashboard');
    expect(screen.getByText('Deconectare')).toBeInTheDocument();
  });
});
