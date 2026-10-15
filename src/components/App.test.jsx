import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { App } from './App.jsx';
import { getTransactions } from '../api/transactions.js';
import { transactions } from '../data/transactions.js';

vi.mock('../api/transactions.js', () => ({ getTransactions: vi.fn() }));
beforeEach(() => getTransactions.mockReset());

function createPendingResponse() {
  let resolve;
  const promise = new Promise((resolveResponse) => {
    resolve = resolveResponse;
  });
  return { promise, resolve };
}

it('shows a loading state until the response arrives, then renders monthly totals', async () => {
  const pending = createPendingResponse();
  getTransactions.mockReturnValue(pending.promise);
  render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading transactions');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  await act(async () => pending.resolve(transactions));
  const table = screen.getByRole('table', { name: 'Monthly rewards' });
  expect(within(table).getByRole('row', { name: /Avery Morgan/ })).toHaveTextContent(
    '114170331615',
  );
  expect(screen.getByText('2,058')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByText('TX-9001')).not.toBeInTheDocument();
  expect(screen.queryByText('TX-9002')).not.toBeInTheDocument();
});

it('filters both tables and updates totals using the customer selector', async () => {
  getTransactions.mockResolvedValue(transactions);
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('table', { name: 'Monthly rewards' });
  await user.selectOptions(screen.getByRole('combobox', { name: 'View customer' }), 'C-004');
  const rewards = screen.getByRole('table', { name: 'Monthly rewards' });
  expect(within(rewards).getAllByRole('row')).toHaveLength(2);
  expect(within(rewards).getByRole('row', { name: /Taylor Reed/ })).toHaveTextContent('102600270');
  const history = screen.getByRole('table', { name: 'Transaction history' });
  expect(within(history).getAllByRole('row')).toHaveLength(5);
  expect(within(history).queryByText('Avery Morgan')).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox'), 'all');
  expect(within(rewards).getAllByRole('row')).toHaveLength(5);
  expect(within(history).getAllByRole('row')).toHaveLength(24);
});

it('shows the real error message and recovers after retry', async () => {
  getTransactions
    .mockRejectedValueOnce(new Error('The connection was interrupted.'))
    .mockResolvedValueOnce(transactions);
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('The connection was interrupted.');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('table', { name: 'Monthly rewards' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(getTransactions).toHaveBeenCalledTimes(2);
});

it('shows an empty state instead of leaving an empty response loading', async () => {
  getTransactions.mockResolvedValue([]);
  render(<App />);
  expect(await screen.findByText('No transactions for this period')).toBeInTheDocument();
  expect(screen.queryByText('Loading transactions…')).not.toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('shows the empty state when all returned purchases fall outside the reporting period', async () => {
  getTransactions.mockResolvedValue(
    transactions.filter((transaction) => transaction.transactionId.startsWith('TX-9')),
  );
  render(<App />);
  expect(await screen.findByText('No transactions for this period')).toBeInTheDocument();
});

it('cancels the old request and ignores its late response after input changes', async () => {
  const first = createPendingResponse();
  const second = createPendingResponse();
  getTransactions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { rerender, unmount } = render(<App scenario="success" />);
  const oldSignal = getTransactions.mock.calls[0][0].signal;
  rerender(<App scenario="empty" />);
  expect(oldSignal.aborted).toBe(true);
  await act(async () => second.resolve([]));
  await act(async () => first.resolve(transactions));
  expect(screen.getByText('No transactions for this period')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  const activeSignal = getTransactions.mock.calls[1][0].signal;
  unmount();
  expect(activeSignal.aborted).toBe(true);
});

it('remains correct when Strict Mode repeats effect setup and cleanup', async () => {
  getTransactions.mockResolvedValue(transactions);
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await waitFor(() =>
    expect(screen.getByRole('table', { name: 'Monthly rewards' })).toBeInTheDocument(),
  );
  expect(screen.getByText('2,058')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
