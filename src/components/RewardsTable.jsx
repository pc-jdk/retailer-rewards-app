import { formatMonth, formatNumber } from '../utils/format.js';

export function RewardsTable({ customers, months }) {
  return (
    <div className="table-scroll" role="region" aria-label="Monthly rewards table" tabIndex={0}>
      <table>
        <caption className="sr-only">Monthly rewards</caption>
        <thead>
          <tr>
            <th scope="col">Customer</th>
            {months.map((month) => (
              <th scope="col" className="numeric" key={month}>
                {formatMonth(month)}
              </th>
            ))}
            <th scope="col" className="numeric total-column">
              Total points
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.customerId}>
              <th scope="row">
                <span className="customer-name">{customer.customerName}</span>
                <span className="customer-id">{customer.customerId}</span>
              </th>
              {customer.monthly.map((month) => (
                <td className="numeric" key={month.monthStart}>
                  {formatNumber(month.points)}
                </td>
              ))}
              <td className="numeric total-column">
                <strong>{formatNumber(customer.totalPoints)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
