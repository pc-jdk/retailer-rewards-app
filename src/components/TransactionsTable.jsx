import { formatCurrency, formatDate, formatNumber } from '../utils/format.js';

export function TransactionsTable({ transactions }) {
  return (
    <div
      className="table-scroll transaction-scroll"
      role="region"
      aria-label="Transaction history table"
      tabIndex={0}
    >
      <table>
        <caption className="sr-only">Transaction history</caption>
        <thead>
          <tr>
            <th scope="col">Transaction</th>
            <th scope="col">Customer</th>
            <th scope="col">Date</th>
            <th scope="col" className="numeric">
              Amount
            </th>
            <th scope="col" className="numeric">
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.transactionId}>
              <th scope="row" className="transaction-id">
                {transaction.transactionId}
              </th>
              <td>{transaction.customerName}</td>
              <td>
                <time dateTime={transaction.purchasedAt}>{formatDate(transaction.timestamp)}</time>
              </td>
              <td className="numeric">{formatCurrency(transaction.amountCents)}</td>
              <td className="numeric">
                <span className={transaction.points > 0 ? 'points-chip' : 'zero-points'}>
                  {formatNumber(transaction.points)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
