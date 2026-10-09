import { View, Text } from 'react-native';

// Colors for the statuses used by the app (see STEPS in src/lib/helpers.js)
const STYLES = {
  Submitted: { bg: '#dbeafe', fg: '#1e40af' },
  'Under Review': { bg: '#fef3c7', fg: '#92400e' },
  'For Payment': { bg: '#ffedd5', fg: '#9a3412' },
  Paid: { bg: '#cffafe', fg: '#155e75' },
  Approved: { bg: '#ede9fe', fg: '#5b21b6' },
  'For Release': { bg: '#e0e7ff', fg: '#3730a3' },
  Completed: { bg: '#dcfce7', fg: '#166534' },
};
const DEFAULT = { bg: '#f1f5f9', fg: '#334155' };

export default function StatusBadge({ status }) {
  const c = STYLES[status] || DEFAULT;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: c.fg, fontSize: 12, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}