import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PricingPage } from './PricingPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PricingPage', () => {
  it('renders all pricing plans', () => {
    renderWithRouter(<PricingPage />);
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows annual prices by default', () => {
    renderWithRouter(<PricingPage />);
    // Annual price for Starter should be 79
    expect(screen.getByText('79')).toBeInTheDocument();
  });

  it('toggles to monthly pricing', () => {
    renderWithRouter(<PricingPage />);

    const monthlyButton = screen.getByText('Lunar');
    fireEvent.click(monthlyButton);

    // Monthly price for Starter should be 99
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('shows popular badge on Professional plan', () => {
    renderWithRouter(<PricingPage />);
    expect(screen.getByText('Cel mai popular')).toBeInTheDocument();
  });

  it('renders FAQ section', () => {
    renderWithRouter(<PricingPage />);
    expect(screen.getByText('Întrebări frecvente')).toBeInTheDocument();
  });

  it('renders call to action', () => {
    renderWithRouter(<PricingPage />);
    expect(screen.getByText('Gata să începi?')).toBeInTheDocument();
  });
});
