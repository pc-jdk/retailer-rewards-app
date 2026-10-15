import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getTransactions } from './transactions.js';

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

it('fetches transactions over HTTP and passes the cancellation signal', async () => {
  const controller = new AbortController();
  const records = [{ transactionId: 'TX-1001', customerId: 'C-001', amount: 120.75 }];
  fetch.mockResolvedValue(Response.json(records));
  expect(await getTransactions({ signal: controller.signal })).toEqual(records);
  expect(fetch).toHaveBeenCalledWith('/transactions', {
    signal: controller.signal,
    cache: 'no-store',
  });
});

it('makes a fresh request each time', async () => {
  fetch.mockImplementation(async () => Response.json([]));
  await getTransactions();
  await getTransactions();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('reports unsuccessful HTTP responses as Error objects', async () => {
  fetch.mockResolvedValue(new Response('Service unavailable', { status: 503 }));
  await expect(getTransactions()).rejects.toThrow('HTTP 503');
});

it('keeps an empty response distinct from loading', async () => {
  fetch.mockResolvedValue(Response.json([]));
  expect(await getTransactions({ scenario: 'empty' })).toEqual([]);
  expect(fetch).toHaveBeenCalledWith('/transactions?scenario=empty', expect.any(Object));
});

it('propagates cancellation and network errors to the request hook', async () => {
  fetch.mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
  await expect(getTransactions()).rejects.toMatchObject({ name: 'AbortError' });
  fetch.mockRejectedValueOnce(new TypeError('Network unavailable'));
  await expect(getTransactions()).rejects.toThrow('Network unavailable');
});
