import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PublicMarketplacePage } from './PublicMarketplacePage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PublicMarketplacePage', () => {
  it('renders the main heading', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByText('Găsește cele mai bune servicii auto')).toBeInTheDocument();
  });

  it('renders service type selector', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByText('Inspecție ITP')).toBeInTheDocument();
    expect(screen.getByText('Asigurare RCA')).toBeInTheDocument();
    expect(screen.getByText('Service Auto')).toBeInTheDocument();
    expect(screen.getByText('Anvelope')).toBeInTheDocument();
  });

  it('renders search inputs', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByPlaceholderText('Caută după nume sau adresă...')).toBeInTheDocument();
  });

  it('renders station results', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByText('MISEDA INSPECT SRL')).toBeInTheDocument();
    expect(screen.getByText('AUTO SERVICE PRIMA')).toBeInTheDocument();
  });

  it('shows verified badge on verified stations', () => {
    renderWithRouter(<PublicMarketplacePage />);
    const verifiedBadges = screen.getAllByText('Verificat');
    expect(verifiedBadges.length).toBeGreaterThan(0);
  });

  it('allows changing service type', () => {
    renderWithRouter(<PublicMarketplacePage />);

    const rcaButton = screen.getByText('Asigurare RCA');
    fireEvent.click(rcaButton);

    // RCA button should now be selected (has blue background)
    expect(rcaButton.closest('button')).toHaveClass('bg-blue-600');
  });

  it('renders ITP check section', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByText('Verifică valabilitatea ITP-ului')).toBeInTheDocument();
  });

  it('renders how it works section', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByText('Cum funcționează?')).toBeInTheDocument();
    // These texts appear in multiple places, so use getAllByText
    const searchTexts = screen.getAllByText('Caută');
    expect(searchTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('Compară')).toBeInTheDocument();
    // Programează also appears as a button
    const programeazaTexts = screen.getAllByText(/Programează/i);
    expect(programeazaTexts.length).toBeGreaterThan(0);
  });

  it('renders business CTA', () => {
    renderWithRouter(<PublicMarketplacePage />);
    expect(screen.getByText('Ai o stație ITP sau service auto?')).toBeInTheDocument();
  });
});
