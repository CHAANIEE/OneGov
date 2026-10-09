import { Alert, Platform } from 'react-native';

// Alert that works on web AND mobile
export function notify(title, message) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export const shortId = (id) => (id ? id.slice(0, 6).toUpperCase() : '');

export const formatTs = (ts) =>
  ts && ts.seconds ? new Date(ts.seconds * 1000).toLocaleString() : '';

// Newest first. A server timestamp that has not resolved yet counts as "now" (newest).
export const sortNewest = (list, field = 'dateSubmitted') => {
  const t = (x) => (x[field] && x[field].seconds != null ? x[field].seconds : Number.MAX_SAFE_INTEGER);
  return [...list].sort((a, b) => t(b) - t(a));
};

export const STEPS = [
  'Submitted', 'Under Review', 'For Payment', 'Paid', 'Approved', 'For Release', 'Completed',
];