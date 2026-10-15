import { transactions } from '../src/data/transactions.js';
import { reportingStart } from '../src/config.js';
import { createRewardsReport } from '../src/utils/rewards.js';

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function handleApiRequest(request) {
  const { pathname, searchParams } = new URL(request.url);
  const transactionsRoute = /^\/transactions\/?$/i.test(pathname);
  const rewardsRoute = pathname.match(/^\/rewards(?:\/([^/]+))?\/?$/i);
  if (!transactionsRoute && !rewardsRoute) return null;
  if (request.method !== 'GET') {
    return json(
      { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET for this endpoint.' } },
      405,
      { Allow: 'GET' },
    );
  }
  if (searchParams.get('scenario') === 'error') {
    return json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Simulated service failure.' } },
      503,
    );
  }
  const records = searchParams.get('scenario') === 'empty' ? [] : transactions;
  if (transactionsRoute) return json(records);

  const { customers } = createRewardsReport(records, reportingStart);
  const rewards = customers.map((customer) => ({
    ...customer,
    monthly: customer.monthly.map((month) => ({
      monthStart: new Date(month.monthStart).toISOString(),
      points: month.points,
    })),
  }));
  if (!rewardsRoute[1]) return json(rewards);

  let customerId;
  try {
    customerId = decodeURIComponent(rewardsRoute[1]);
  } catch {
    return json(
      { error: { code: 'INVALID_CUSTOMER_ID', message: 'Customer ID has invalid URL encoding.' } },
      400,
    );
  }
  const customer = rewards.find((reward) => reward.customerId === customerId);
  return customer
    ? json(customer)
    : json(
        { error: { code: 'CUSTOMER_NOT_FOUND', message: 'No rewards found for this customer.' } },
        404,
      );
}

export async function apiMiddleware(incoming, outgoing, next) {
  try {
    const request = new Request(new URL(incoming.url, 'http://localhost'), {
      method: incoming.method,
    });
    const response = handleApiRequest(request);
    if (!response) return next();
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('API request failed:', error);
    outgoing.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    outgoing.end(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'Unable to complete the request.' },
      }),
    );
  }
}
