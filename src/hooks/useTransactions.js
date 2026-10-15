import { useEffect, useState } from 'react';
import { getTransactions } from '../api/transactions.js';

export function useTransactions(scenario) {
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ status: 'loading', transactions: [], error: null });

  useEffect(() => {
    const controller = new AbortController();
    setRequest({ status: 'loading', transactions: [], error: null });
    getTransactions({ signal: controller.signal, scenario })
      .then((transactions) => {
        if (!controller.signal.aborted)
          setRequest({ status: 'success', transactions, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRequest({
            status: 'error',
            transactions: [],
            error: error instanceof Error ? error : new Error('Unable to load transactions.'),
          });
        }
      });
    return () => controller.abort();
  }, [attempt, scenario]);

  return { ...request, retry: () => setAttempt((previousAttempt) => previousAttempt + 1) };
}
