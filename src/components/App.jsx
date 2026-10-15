import { useTransactions } from '../hooks/useTransactions.js';
import { RewardsDashboard } from './RewardsDashboard.jsx';
import '../styles/app.css';

export function App({ scenario = 'success' }) {
  const { status, transactions, error, retry } = useTransactions(scenario);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to rewards
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            r.
          </span>{' '}
          rewards<span className="brand-divider">/</span>
          <span className="brand-section">Customer insights</span>
        </div>
        <span className="demo-badge">
          <span aria-hidden="true">●</span> Sample data
        </span>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">LOYALTY OVERVIEW</p>
            <h1>Every purchase. Every point.</h1>
          </div>
          <div className="period">
            <span>REPORTING PERIOD</span>
            <strong>Jul – Sep 2026</strong>
            <small>3 calendar months</small>
          </div>
        </div>
        {status === 'loading' && (
          <div className="state-panel" role="status">
            <span className="loading-dot" aria-hidden="true" />
            Loading transactions…
          </div>
        )}
        {status === 'error' && (
          <div className="state-panel" role="alert">
            <h2>We couldn’t load your transactions</h2>
            <p>{error.message}</p>
            <button className="primary-button" onClick={retry}>
              Try again
            </button>
          </div>
        )}
        {status === 'success' && <RewardsDashboard transactions={transactions} />}
        <aside className="rules" aria-labelledby="rules-heading">
          <div>
            <p className="eyebrow">THE REWARDS PROGRAM</p>
            <h2 id="rules-heading">Simple rules. More rewards.</h2>
          </div>
          <p>
            <strong>1 point</strong> per whole dollar over $50 up to $100.
            <br />
            <strong>2 points</strong> per whole dollar over $100.
          </p>
          <p className="rule-example">
            A $120 purchase earns <strong>90 points.</strong>
            <br />
            <span>Calculated per purchase. Partial dollars earn no points.</span>
          </p>
        </aside>
        <footer>
          Customer rewards <span>USD · Whole-dollar points · All dates in UTC</span>
        </footer>
      </main>
    </>
  );
}
