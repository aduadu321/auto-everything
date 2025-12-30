import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LandingPage', () => {
  it('renders the main heading', () => {
    renderWithRouter(<LandingPage />);
    const autoEverythingElements = screen.getAllByText(/AutoEverything/i);
    expect(autoEverythingElements.length).toBeGreaterThan(0);
  });

  it('renders navigation links', () => {
    renderWithRouter(<LandingPage />);
    const loginLinks = screen.getAllByText(/Login/i);
    expect(loginLinks.length).toBeGreaterThan(0);
    // Look for register button - "Creează cont gratuit"
    const registerLink = screen.getByRole('link', { name: /Creează cont gratuit/i });
    expect(registerLink).toBeInTheDocument();
  });

  it('renders pricing section', () => {
    renderWithRouter(<LandingPage />);
    const pricingElements = screen.getAllByText(/Prețuri/i);
    expect(pricingElements.length).toBeGreaterThan(0);
  });

  it('renders features section', () => {
    renderWithRouter(<LandingPage />);
    expect(screen.getByText(/Notificări SMS automate/i)).toBeInTheDocument();
  });

  it('renders call to action buttons', () => {
    renderWithRouter(<LandingPage />);
    const startButtons = screen.getAllByText(/Începe gratuit/i);
    expect(startButtons.length).toBeGreaterThan(0);
  });
});
