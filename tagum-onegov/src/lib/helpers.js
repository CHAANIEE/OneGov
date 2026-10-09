import { Alert, Platform } from 'react-native';

// Alert that works on web AND mobile
export function notify(title, message) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export const shortId = (id) => (id ? id.slice(0, 6).toUpperCase() : '');

export const formatTs = (ts) =>
  ts && ts.seconds ? new Date(ts.seconds * 1000).toLocaleString() : '';

export const sortNewest = (list, field = 'dateSubmitted') =>
  [...list].sort((a, b) => (b[field]?.seconds ?? 0) - (a[field]?.seconds ?? 0));

export const STEPS = [
  'Submitted', 'Under Review', 'For Payment', 'Paid', 'Approved', 'For Release', 'Completed',
];