import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

describe('Home Page', () => {
  it('renders the Nagrik Mitra title', () => {
    render(<Page />);
    const headings = screen.getAllByText(/Nagrik Mitra/i);
    expect(headings.length).toBeGreaterThan(0);
  });
});
