const numberFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatNumber = (value) => numberFormatter.format(value);
export const formatCurrency = (cents) => currencyFormatter.format(cents / 100);
export const formatDate = (timestamp) => dateFormatter.format(timestamp);
export const formatMonth = (timestamp) => monthFormatter.format(timestamp);
