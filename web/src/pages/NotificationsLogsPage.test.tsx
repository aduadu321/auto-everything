import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationsLogsPage } from './NotificationsLogsPage';

// Mock the api service
vi.mock('../services/api', () => ({
  notificationsService: {
    getLogs: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'log1',
          channel: 'SMS',
          recipient: '0745123456',
          content: 'ITP-ul pentru vehiculul SV01ABC expira in 7 zile.',
          status: 'SENT',
          createdAt: '2025-01-15T10:30:00.000Z',
          client: {
            id: 'client1',
            firstName: 'Ion',
            lastName: 'Popescu',
          },
          document: {
            id: 'doc1',
            type: 'ITP',
            expiryDate: '2025-01-22T00:00:00.000Z',
          },
        },
        {
          id: 'log2',
          channel: 'EMAIL',
          recipient: 'maria@email.com',
          content: 'RCA pentru vehiculul SV02XYZ expira in 14 zile.',
          status: 'SENT',
          createdAt: '2025-01-15T09:00:00.000Z',
          client: {
            id: 'client2',
            firstName: 'Maria',
            lastName: 'Ionescu',
          },
          document: {
            id: 'doc2',
            type: 'RCA',
            expiryDate: '2025-01-29T00:00:00.000Z',
          },
        },
        {
          id: 'log3',
          channel: 'SMS',
          recipient: '0722987654',
          content: 'Test notification',
          status: 'FAILED',
          errorMessage: 'Numar de telefon invalid',
          createdAt: '2025-01-14T15:00:00.000Z',
          client: null,
          document: null,
        },
      ],
      meta: {
        total: 3,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    }),
    getSchedulerStats: vi.fn().mockResolvedValue({
      totalDocuments: 150,
      expiringDocuments: 12,
      expiredDocuments: 5,
      todayNotifications: 8,
    }),
    runManualCheck: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotificationsLogsPage', () => {
  it('renders the page title', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    expect(screen.getByText('Istoric Notificari')).toBeInTheDocument();
  });

  it('renders the page description', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    expect(screen.getByText('Vizualizati toate notificarile trimise')).toBeInTheDocument();
  });

  it('renders the manual check button', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    expect(screen.getByText('Verifica Acum')).toBeInTheDocument();
  });

  it('displays stats cards after loading', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Documente')).toBeInTheDocument();
    });
    expect(screen.getByText('Expira in 30 zile')).toBeInTheDocument();
    expect(screen.getByText('Expirate')).toBeInTheDocument();
    expect(screen.getByText('Notificari Azi')).toBeInTheDocument();
  });

  it('displays stats values', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders channel filter buttons', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    expect(screen.getByText('Toate')).toBeInTheDocument();
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders table headers', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Data')).toBeInTheDocument();
    });
    expect(screen.getByText('Canal')).toBeInTheDocument();
    expect(screen.getByText('Destinatar')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Mesaj')).toBeInTheDocument();
  });

  it('displays notification logs', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Ion Popescu')).toBeInTheDocument();
    });
    expect(screen.getByText('Maria Ionescu')).toBeInTheDocument();
    expect(screen.getByText('0745123456')).toBeInTheDocument();
    expect(screen.getByText('maria@email.com')).toBeInTheDocument();
  });

  it('displays document types in logs', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('ITP')).toBeInTheDocument();
    });
    expect(screen.getByText('RCA')).toBeInTheDocument();
  });

  it('shows status labels', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Trimis').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Esuat')).toBeInTheDocument();
  });

  it('displays error message for failed notifications', async () => {
    renderWithRouter(<NotificationsLogsPage />);
    await waitFor(() => {
      expect(screen.getByText('Numar de telefon invalid')).toBeInTheDocument();
    });
  });

  it('can filter by SMS channel', async () => {
    const { notificationsService } = await import('../services/api');
    renderWithRouter(<NotificationsLogsPage />);

    await waitFor(() => {
      expect(screen.getByText('Ion Popescu')).toBeInTheDocument();
    });

    // Get the SMS filter button by looking for button elements with SMS text
    const smsButtons = screen.getAllByText('SMS');
    // First one should be the filter button in the filters section
    const smsFilterButton = smsButtons[0];
    fireEvent.click(smsFilterButton);

    await waitFor(() => {
      expect(notificationsService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'SMS' })
      );
    });
  });
});
