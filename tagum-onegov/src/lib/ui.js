import { Platform, StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#d1d5db',
  borderSoft: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
  danger: '#b91c1c',
};

export const PRIMARY = COLORS.primary;

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  // Centered, readable width on desktop; full width on phones
  content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  h2: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: 20, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.borderSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#fff',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '800', letterSpacing: 0.5 },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonOutlineText: { color: COLORS.primary, textAlign: 'center', fontWeight: '800' },
  buttonDisabled: { opacity: 0.5 },
  muted: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: 'white' },
});