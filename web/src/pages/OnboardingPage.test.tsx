import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingPage } from './OnboardingPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('OnboardingPage', () => {
  it('renders welcome step', () => {
    renderWithRouter(<OnboardingPage />);
    expect(screen.getByText('Bine ai venit la AutoEverything!')).toBeInTheDocument();
  });

  it('shows step progress indicators', () => {
    renderWithRouter(<OnboardingPage />);
    // Should have 6 progress dots
    const progressDots = document.querySelectorAll('.rounded-full');
    expect(progressDots.length).toBeGreaterThanOrEqual(6);
  });

  it('shows start button on welcome step', () => {
    renderWithRouter(<OnboardingPage />);
    expect(screen.getByText('Să începem!')).toBeInTheDocument();
  });

  it('navigates to import step when clicking start', () => {
    renderWithRouter(<OnboardingPage />);

    const startButton = screen.getByText('Să începem!');
    fireEvent.click(startButton);

    expect(screen.getByText('Importă clienții')).toBeInTheDocument();
  });

  it('shows schedule configuration on schedule step', () => {
    renderWithRouter(<OnboardingPage />);

    // Navigate to schedule step (step 0 -> 1 -> 2)
    fireEvent.click(screen.getByText('Să începem!'));
    fireEvent.click(screen.getByText('Sari peste'));

    expect(screen.getByText('Program de lucru')).toBeInTheDocument();
    expect(screen.getByText('Luni')).toBeInTheDocument();
  });
});
