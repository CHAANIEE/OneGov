// Small display helpers shared by the citizen screens

export const TILE_COLORS = [
  { bg: '#dcfce7', fg: '#166534' },
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#fef3c7', fg: '#b45309' },
  { bg: '#ede9fe', fg: '#6d28d9' },
  { bg: '#cffafe', fg: '#0e7490' },
  { bg: '#fce7f3', fg: '#be185d' },
];

// Picks an Ionicons name from the service name
export function serviceIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('business') || n.includes('permit')) return 'storefront-outline';
  if (n.includes('birth') || n.includes('marriage') || n.includes('death') || n.includes('certificate')) {
    return 'document-text-outline';
  }
  if (n.includes('clearance')) return 'shield-checkmark-outline';
  if (n.includes('tax') || n.includes('payment')) return 'cash-outline';
  if (n.includes('health')) return 'medkit-outline';
  return 'briefcase-outline';
}

// Reference number shown in tables, e.g. TG-2026-A1B2C3
export function refNo(app) {
  const year = app?.dateSubmitted?.seconds
    ? new Date(app.dateSubmitted.seconds * 1000).getFullYear()
    : new Date().getFullYear();
  return `TG-${year}-${(app?.id || '').slice(0, 6).toUpperCase()}`;
}

export function shortDate(ts) {
  return ts && ts.seconds
    ? new Date(ts.seconds * 1000).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}