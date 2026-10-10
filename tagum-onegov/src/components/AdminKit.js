import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Shared colors and small building blocks for the admin screens

export const A = {
  primary: '#166534',
  primaryDark: '#14532d',
  deep: '#0b3d26',
  deeper: '#082f1d',
  accent: '#dcfce7',
  bg: '#eef7f1',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
  danger: '#dc2626',
  warn: '#f59e0b',
};

export const tsMs = (ts) => (ts && ts.seconds != null ? ts.seconds * 1000 : 0);

export const fmtDate = (ms) =>
  ms ? new Date(ms).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const fmtDateTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

export const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

// Live list of a whole collection
export function useCollection(name) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setReady(true);
        },
        (e) => {
          console.warn(`${name}: ${e.message}`);
          setReady(true);
        }
      ),
    [name]
  );
  return { items, ready };
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: A.bg }}>
      <ActivityIndicator color={A.primary} />
    </View>
  );
}

export function PageHeader({ icon, title, subtitle, right }) {
  return (
    <View style={k.pageHeader}>
      <View style={k.pageIcon}>
        <Ionicons name={icon} size={26} color={A.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={k.pageTitle}>{title}</Text>
        {!!subtitle && <Text style={k.pageSub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Panel({ title, icon, right, children, style }) {
  return (
    <View style={[k.panel, style]}>
      {(!!title || !!right) && (
        <View style={k.panelHead}>
          {!!icon && <Ionicons name={icon} size={20} color={A.text} />}
          <Text style={k.panelTitle}>{title}</Text>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function Btn({ label, onPress, kind = 'primary', disabled, busy, icon, small }) {
  const isPrimary = kind === 'primary';
  const isDanger = kind === 'danger';
  const fg = isPrimary ? '#fff' : isDanger ? A.danger : A.primary;
  const border = isPrimary ? A.primary : isDanger ? '#fecaca' : A.primary;
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        k.btn,
        small && k.btnSmall,
        { backgroundColor: isPrimary ? A.primary : '#fff', borderColor: border },
        pressed && { opacity: 0.85 },
        off && { opacity: 0.5 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {!!icon && <Ionicons name={icon} size={small ? 14 : 16} color={fg} />}
          <Text style={[k.btnText, small && { fontSize: 12 }, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export const k = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' },
  pageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: A.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: A.text },
  pageSub: { fontSize: 14, color: A.muted, marginTop: 2 },

  panel: {
    backgroundColor: A.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: A.border,
    padding: 16,
    marginBottom: 16,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  panelTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: A.text },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  btnSmall: { height: 34, paddingHorizontal: 12, borderRadius: 9 },
  btnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: A.text,
    backgroundColor: '#fff',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  label: { fontSize: 12, fontWeight: '700', color: A.muted, marginBottom: 6, marginTop: 4 },
  muted: { fontSize: 13, color: A.muted, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: A.primary, borderColor: A.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: A.text },
  chipTextActive: { color: '#fff' },
});