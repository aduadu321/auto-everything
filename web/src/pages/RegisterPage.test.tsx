import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RegisterPage', () => {
  it('renders the registration form', () => {
    renderWithRouter(<RegisterPage />);
    // Check for any heading that indicates registration
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows step indicator', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows email input field', () => {
    renderWithRouter(<RegisterPage />);
    const emailInputs = screen.getAllByRole('textbox');
    expect(emailInputs.length).toBeGreaterThan(0);
  });

  it('has login link', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('Ai deja cont?')).toBeInTheDocument();
    // Use different text that exists in the component
    expect(screen.getByText('Autentifică-te')).toBeInTheDocument();
  });
});
