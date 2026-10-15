import { useMemo, useState } from 'react';
import { createRewardsReport, summarizeRewards } from '../utils/rewards.js';
import { formatCurrency, formatNumber } from '../utils/format.js';
import { RewardsTable } from './RewardsTable.jsx';
import { TransactionsTable } from './TransactionsTable.jsx';
import { reportingStart } from '../config.js';

export function RewardsDashboard({ transactions }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const report = useMemo(() => createRewardsReport(transactions, reportingStart), [transactions]);
  const customers =
    selectedCustomerId === 'all'
      ? report.customers
      : report.customers.filter((customer) => customer.customerId === selectedCustomerId);
  const visibleTransactions =
    selectedCustomerId === 'all'
      ? report.transactions
      : report.transactions.filter((transaction) => transaction.customerId === selectedCustomerId);
  const totals = summarizeRewards(customers);

  if (report.transactions.length === 0) {
    return (
      <div className="state-panel" role="status">
        <h2>No transactions for this period</h2>
        <p>Rewards will appear when purchases are available for July through September 2026.</p>
      </div>
    );
  }

  return (
    <>
      <div className="view-controls">
        <p>
          <strong>{report.customers.length} customers</strong>
          <span> · July 1 – September 30, 2026</span>
        </p>
        <div className="customer-filter">
          <label htmlFor="customer">View customer</label>
          <select
            id="customer"
            value={selectedCustomerId}
            onChange={(event) => setSelectedCustomerId(event.target.value)}
          >
            <option value="all">All customers</option>
            {report.customers.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>
                {customer.customerName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <dl className="metrics" aria-live="polite">
        <div className="metric featured">
          <dt>Points earned</dt>
          <dd>
            {formatNumber(totals.points)}
            <span>pts</span>
          </dd>
          <dd className="metric-note">Across the selected customers</dd>
        </div>
        <div className="metric">
          <dt>Total purchase value</dt>
          <dd>{formatCurrency(totals.spendCents)}</dd>
          <dd className="metric-note">Purchases within the reporting period</dd>
        </div>
        <div className="metric">
          <dt>Transactions</dt>
          <dd>{formatNumber(totals.transactions)}</dd>
          <dd className="metric-note">Each purchase calculated separately</dd>
        </div>
      </dl>
      <section className="panel" aria-labelledby="monthly-heading">
        <div className="panel-heading">
          <div>
            <h2 id="monthly-heading">Monthly rewards</h2>
            <p>Points earned by customer, month by month.</p>
          </div>
          <span className="subtle-badge">3-month total</span>
        </div>
        <RewardsTable customers={customers} months={report.months} />
      </section>
      <section className="panel" aria-labelledby="transactions-heading">
        <div className="panel-heading">
          <div>
            <h2 id="transactions-heading">Transaction history</h2>
            <p>Every purchase behind the points. Most recent first.</p>
          </div>
          <span className="subtle-badge">{visibleTransactions.length} transactions</span>
        </div>
        <TransactionsTable transactions={visibleTransactions} />
      </section>
    </>
  );
}
