import { describe, expect, it } from 'vitest';
import { calculatePoints, createRewardsReport, summarizeRewards } from './rewards.js';
import { transactions } from '../data/transactions.js';

const reportingStart = new Date('2026-07-01T00:00:00Z');
const purchase = (
  transactionId,
  amount,
  purchasedAt = '2026-07-15T12:00:00Z',
  customerId = 'C-001',
) => ({
  transactionId,
  customerId,
  customerName: 'Avery Morgan',
  amount,
  purchasedAt,
});

describe('calculatePoints', () => {
  it.each([
    [0, 0],
    [49.99, 0],
    [50, 0],
    [50.99, 0],
    [51, 1],
    [99.99, 49],
    [100, 50],
    [100.99, 50],
    [101, 52],
    [120, 90],
    [120.99, 90],
  ])('awards %s dollars exactly %s whole points', (amount, expectedPoints) => {
    expect(calculatePoints(amount)).toBe(expectedPoints);
  });

  it.each([-1, NaN, Infinity, '120', null, undefined])(
    'rejects invalid purchase amount %s',
    (amount) => {
      expect(() => calculatePoints(amount)).toThrow(TypeError);
    },
  );
});

describe('createRewardsReport', () => {
  it('calculates points per purchase before adding them together', () => {
    const report = createRewardsReport([purchase('T-1', 60), purchase('T-2', 60)], reportingStart);
    expect(report.customers[0].totalPoints).toBe(20);
    expect(report.customers[0].monthly.map((month) => month.points)).toEqual([20, 0, 0]);
  });

  it('includes the start and final millisecond but excludes surrounding records', () => {
    const report = createRewardsReport(
      [
        purchase('before', 120, '2026-06-30T23:59:59.999Z'),
        purchase('start', 120, '2026-07-01T00:00:00.000Z'),
        purchase('last', 120, '2026-09-30T23:59:59.999Z'),
        purchase('after', 120, '2026-10-01T00:00:00.000Z'),
      ],
      reportingStart,
    );
    expect(report.transactions.map((transaction) => transaction.transactionId)).toEqual([
      'last',
      'start',
    ]);
    expect(report.customers[0].monthly.map((month) => month.points)).toEqual([90, 0, 90]);
    expect(report.customers[0].totalSpendCents).toBe(24000);
  });

  it('uses the UTC month when a timestamp contains an offset', () => {
    const report = createRewardsReport(
      [purchase('T-1', 120, '2026-07-31T23:30:00-04:00')],
      reportingStart,
    );
    expect(report.customers[0].monthly.map((month) => month.points)).toEqual([0, 90, 0]);
  });

  it('handles reporting periods that cross a year boundary', () => {
    const report = createRewardsReport(
      [
        purchase('nov', 60, '2026-11-15T12:00:00Z'),
        purchase('dec', 100, '2026-12-15T12:00:00Z'),
        purchase('jan', 120, '2027-01-15T12:00:00Z'),
        purchase('feb', 200, '2027-02-01T00:00:00Z'),
      ],
      new Date('2026-11-01T00:00:00Z'),
    );
    expect(report.customers[0].monthly.map((month) => month.points)).toEqual([10, 50, 90]);
    expect(report.customers[0].totalPoints).toBe(150);
  });

  it('keeps customers with the same name separate by customer ID', () => {
    const report = createRewardsReport(
      [purchase('T-1', 60), purchase('T-2', 100, undefined, 'C-002')],
      reportingStart,
    );
    expect(report.customers.map((customer) => customer.totalPoints)).toEqual([10, 50]);
  });

  it('keeps zero-point purchases and sums currency in cents', () => {
    const report = createRewardsReport(
      [purchase('T-1', 20.1), purchase('T-2', 20.2)],
      reportingStart,
    );
    expect(summarizeRewards(report.customers)).toEqual({
      points: 0,
      spendCents: 4030,
      transactions: 2,
    });
  });

  it('returns three months and no customers for an empty period', () => {
    const report = createRewardsReport(
      [purchase('old', 120, '2026-06-15T12:00:00Z')],
      reportingStart,
    );
    expect(report.months).toHaveLength(3);
    expect(report.customers).toEqual([]);
    expect(report.transactions).toEqual([]);
    expect(summarizeRewards(report.customers)).toEqual({
      points: 0,
      spendCents: 0,
      transactions: 0,
    });
  });

  it('does not mutate or sort the input transactions', () => {
    const input = Object.freeze([
      Object.freeze(purchase('older', 60, '2026-07-05T12:00:00Z')),
      Object.freeze(purchase('newer', 100, '2026-08-05T12:00:00Z')),
    ]);
    const report = createRewardsReport(input, reportingStart);
    expect(input.map((transaction) => transaction.transactionId)).toEqual(['older', 'newer']);
    expect(report.transactions.map((transaction) => transaction.transactionId)).toEqual([
      'newer',
      'older',
    ]);
    expect(input[0]).not.toHaveProperty('points');
  });

  it('reports invalid transaction dates and invalid reporting dates', () => {
    expect(() => createRewardsReport([purchase('broken', 120, 'invalid')], reportingStart)).toThrow(
      'Invalid date for broken',
    );
    expect(() => createRewardsReport([], new Date('invalid'))).toThrow('Reporting start');
  });

  it('matches the independently calculated totals for the supplied sample data', () => {
    const report = createRewardsReport(transactions, reportingStart);
    expect(
      report.customers.map((customer) => ({
        customerId: customer.customerId,
        monthly: customer.monthly.map((month) => month.points),
        total: customer.totalPoints,
      })),
    ).toEqual([
      { customerId: 'C-001', monthly: [114, 170, 331], total: 615 },
      { customerId: 'C-002', monthly: [250, 65, 135], total: 450 },
      { customerId: 'C-003', monthly: [70, 552, 101], total: 723 },
      { customerId: 'C-004', monthly: [10, 260, 0], total: 270 },
    ]);
    expect(summarizeRewards(report.customers)).toMatchObject({ points: 2058, transactions: 23 });
  });
});
