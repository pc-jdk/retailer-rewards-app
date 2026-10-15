# retailer-rewards-app

React app showing each customer's monthly and total reward points. A small HTTP API serves mock transaction data.

## Run

Install Node.js and npm.

```sh
npm ci
npm run dev
```
Open http://localhost:3000. The app and API use the same server. No `.env` file is needed.

```sh
npm test
```

## API

| Method | Path | Response |
| --- | --- | --- |
| GET | `/Rewards` | All customers' monthly rewards and totals |
| GET | `/Rewards/:customerId` | Rewards for one customer, such as `C-001` |
| GET | `/transactions` | Raw transactions with IDs, customer names, amounts, and timestamps |

```sh
curl http://localhost:3000/Rewards
curl http://localhost:3000/Rewards/C-001
curl http://localhost:3000/transactions
```

Responses are JSON. Lowercase `/rewards` also works. Unknown customers return `404`; unsupported methods return `405`. Responses are not cached.
## Rules

- Calculate points separately for each purchase: one point per whole dollar over $50 up to $100, plus two points per whole dollar over $100.
- The calculator handles cents internally. A $100 purchase earns 50 points; $120.99 earns 90 points.
- The report covers July through September 2026. Transactions outside those dates are excluded, and missing months show zero.
- The UI and rewards endpoints use the same calculation utility.
