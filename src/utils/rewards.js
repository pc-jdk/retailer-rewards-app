export function calculatePoints(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new TypeError('Purchase amount must be a finite, nonnegative number.');
  }
  const wholeDollars = Math.floor(amount);
  return Math.max(wholeDollars - 100, 0) * 2 + Math.max(Math.min(wholeDollars, 100) - 50, 0);
}

export function createRewardsReport(transactions, startDate) {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    throw new TypeError('Reporting start must be a valid Date.');
  }
  const startYear = startDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();
  const months = Array.from({ length: 3 }, (_, offset) =>
    Date.UTC(startYear, startMonth + offset, 1),
  );
  const end = Date.UTC(startYear, startMonth + 3, 1);
  const customersById = new Map();
  const includedTransactions = [];

  for (const transaction of transactions) {
    const date = new Date(transaction.purchasedAt);
    const timestamp = date.getTime();
    if (Number.isNaN(timestamp))
      throw new TypeError(`Invalid date for ${transaction.transactionId}.`);
    if (timestamp < months[0] || timestamp >= end) continue;

    const points = calculatePoints(transaction.amount);
    const amountCents = Math.round(transaction.amount * 100);
    const monthIndex = (date.getUTCFullYear() - startYear) * 12 + date.getUTCMonth() - startMonth;
    if (!customersById.has(transaction.customerId)) {
      customersById.set(transaction.customerId, {
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        monthly: months.map((monthStart) => ({ monthStart, points: 0 })),
        totalPoints: 0,
        totalSpendCents: 0,
        transactionCount: 0,
      });
    }
    const customer = customersById.get(transaction.customerId);
    customer.monthly[monthIndex].points += points;
    customer.totalPoints += points;
    customer.totalSpendCents += amountCents;
    customer.transactionCount += 1;
    includedTransactions.push({ ...transaction, timestamp, amountCents, points });
  }

  return {
    months,
    customers: [...customersById.values()].sort((first, second) =>
      first.customerName.localeCompare(second.customerName),
    ),
    transactions: includedTransactions.sort((first, second) => second.timestamp - first.timestamp),
  };
}

export function summarizeRewards(customers) {
  return customers.reduce(
    (totals, customer) => ({
      points: totals.points + customer.totalPoints,
      spendCents: totals.spendCents + customer.totalSpendCents,
      transactions: totals.transactions + customer.transactionCount,
    }),
    { points: 0, spendCents: 0, transactions: 0 },
  );
}
