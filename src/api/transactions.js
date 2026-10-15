export async function getTransactions({ signal, scenario = 'success' } = {}) {
  const query = scenario === 'success' ? '' : `?scenario=${encodeURIComponent(scenario)}`;
  const response = await fetch(`/transactions${query}`, { signal, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(
      `Transactions could not be loaded (HTTP ${response.status}). Please try again.`,
    );
  }
  return response.json();
}
