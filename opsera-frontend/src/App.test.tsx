import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from './App.js';

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('renders the Opsera Voyage heading', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /opsera voyage/i })).toBeInTheDocument();
  });
});
