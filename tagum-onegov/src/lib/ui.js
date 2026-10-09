import { StyleSheet } from 'react-native';

export const PRIMARY = '#4285F4';

export const ui = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#d0d7de', borderRadius: 8, padding: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: PRIMARY, padding: 14, borderRadius: 8, marginTop: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  buttonOutline: { borderWidth: 1, borderColor: PRIMARY, padding: 12, borderRadius: 8, marginTop: 8 },
  buttonOutlineText: { color: PRIMARY, textAlign: 'center', fontWeight: '600' },
  muted: { color: '#666' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: PRIMARY, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: PRIMARY },
  chipText: { color: PRIMARY },
  chipTextActive: { color: 'white' },
});