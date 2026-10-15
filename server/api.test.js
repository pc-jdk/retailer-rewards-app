// @vitest-environment node
import { createServer } from 'node:http';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { apiMiddleware } from './api.js';

const server = createServer((incoming, outgoing) =>
  apiMiddleware(incoming, outgoing, () => {
    outgoing.writeHead(404);
    outgoing.end();
  }),
);
let baseUrl;
beforeAll(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

it.each(['/Rewards', '/rewards'])('GET %s returns all customer rewards as JSON', async (path) => {
  const response = await fetch(`${baseUrl}${path}`);
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(response.headers.get('cache-control')).toBe('no-store');
  const rewards = await response.json();
  expect(rewards.map((customer) => customer.totalPoints)).toEqual([615, 450, 723, 270]);
  expect(rewards[0].monthly).toEqual([
    { monthStart: '2026-07-01T00:00:00.000Z', points: 114 },
    { monthStart: '2026-08-01T00:00:00.000Z', points: 170 },
    { monthStart: '2026-09-01T00:00:00.000Z', points: 331 },
  ]);
});

it.each([
  ['C-001', 615, 7],
  ['C-004', 270, 4],
])(
  'GET /Rewards/%s returns only that customer',
  async (customerId, totalPoints, transactionCount) => {
    const response = await fetch(`${baseUrl}/Rewards/${customerId}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ customerId, totalPoints, transactionCount });
  },
);

it('GET /transactions returns all raw purchases, including date-boundary fixtures', async () => {
  const response = await fetch(`${baseUrl}/transactions`);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const records = await response.json();
  expect(records).toHaveLength(25);
  expect(new Set(records.map((record) => record.transactionId)).size).toBe(25);
  expect(records[0]).toMatchObject({ customerName: 'Avery Morgan', amount: 120.75 });
  expect(records[0]).not.toHaveProperty('points');
  expect(records.some((record) => record.transactionId === 'TX-9001')).toBe(true);
});

it('returns 404 with a structured error for an unknown customer', async () => {
  const response = await fetch(`${baseUrl}/Rewards/unknown`);
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ error: { code: 'CUSTOMER_NOT_FOUND' } });
});

it.each(['/Rewards', '/Rewards/C-001', '/transactions'])(
  'rejects POST %s with 405',
  async (path) => {
    const response = await fetch(`${baseUrl}${path}`, { method: 'POST' });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  },
);

it('accepts an encoded customer ID and rejects malformed encoding', async () => {
  expect((await fetch(`${baseUrl}/Rewards/%43-001`)).status).toBe(200);
  const response = await fetch(`${baseUrl}/Rewards/%E0%A4%A`);
  expect(response.status).toBe(400);
});

it('serves the empty and failure scenarios through HTTP', async () => {
  const empty = await fetch(`${baseUrl}/transactions?scenario=empty`);
  expect(empty.status).toBe(200);
  expect(await empty.json()).toEqual([]);
  const failure = await fetch(`${baseUrl}/transactions?scenario=error`);
  expect(failure.status).toBe(503);
  expect(await failure.json()).toMatchObject({ error: { code: 'SERVICE_UNAVAILABLE' } });
});
