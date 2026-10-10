import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { A, k, useCollection, Loading, PageHeader, Panel, tsMs, fmtDateTime, fmtDate } from '../../src/components/AdminKit';
import StatusBadge from '../../src/components/StatusBadge';
import { STEPS } from '../../src/lib/helpers';
import { refNo } from '../../src/lib/display';

const appMs = (a) => tsMs(a.dateSubmitted) || Date.now();

export default function Applications() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const apps = useCollection('applications');
  const users = useCollection('users');
  const [filter, setFilter] = useState('All');

  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (rawQ || '').trim().toLowerCase();

  const contentWidth = width >= 900 ? width - 250 : width;
  const tableMode = contentWidth >= 760;

  const userMap = useMemo(() => {
    const m = {};
    users.items.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users.items]);

  const counts = useMemo(() => {
    const c = { All: apps.items.length };
    STEPS.forEach((s) => { c[s] = apps.items.filter((a) => a.status === s).length; });
    return c;
  }, [apps.items]);

  const list = useMemo(
    () =>
      [...apps.items]
        .sort((a, b) => appMs(b) - appMs(a))
        .filter((a) => filter === 'All' || a.status === filter)
        .filter(
          (a) =>
            !term ||
            `${refNo(a)} ${a.serviceName || ''} ${a.status || ''} ${userMap[a.userId]?.fullName || ''}`
              .toLowerCase()
              .includes(term)
        ),
    [apps.items, filter, term, userMap]
  );

  if (!apps.ready) return <Loading />;

  const open = (a) => router.push(`/(admin)/application/${a.id}`);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll}>
      <View style={s.container}>
        <PageHeader
          icon="documents-outline"
          title="Applications"
          subtitle="All applications submitted by citizens. Staff review and assess them from the Review Queue."
        />

        <Panel title={`Applications (${list.length})`} icon="documents-outline">
          {!!term && <Text style={[k.muted, { marginBottom: 10 }]}>Showing results for {'\u201C'}{rawQ}{'\u201D'}</Text>}
          <View style={[k.chipRow, { marginBottom: 14 }]}>
            {['All', ...STEPS].map((st) => {
              const active = filter === st;
              return (
                <Pressable key={st} onPress={() => setFilter(st)} style={[k.chip, active && k.chipActive]}>
                  <Text style={[k.chipText, active && k.chipTextActive]}>{st} ({counts[st] || 0})</Text>
                </Pressable>
              );
            })}
          </View>

          {list.length === 0 && <Text style={k.muted}>No applications found.</Text>}

          {tableMode && list.length > 0 ? (
            <View style={s.table}>
              <View style={[s.tr, s.thRow]}>
                <Text style={[s.th, { width: 28 }]}>#</Text>
                <Text style={[s.th, { flex: 1.3 }]}>Reference No.</Text>
                <Text style={[s.th, { flex: 1.3 }]}>Citizen</Text>
                <Text style={[s.th, { flex: 1.5 }]}>Service</Text>
                <Text style={[s.th, { flex: 1.3 }]}>Submitted</Text>
                <Text style={[s.th, { flex: 1 }]}>Status</Text>
                <View style={{ width: 60 }} />
              </View>
              {list.map((a, i) => (
                <View key={a.id} style={s.tr}>
                  <Text style={[s.td, { width: 28 }]}>{i + 1}</Text>
                  <Text style={[s.td, { flex: 1.3, color: '#0369a1' }]} numberOfLines={1}>{refNo(a)}</Text>
                  <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{userMap[a.userId]?.fullName || '-'}</Text>
                  <Text style={[s.td, { flex: 1.5 }]} numberOfLines={1}>{a.serviceName}</Text>
                  <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{fmtDateTime(appMs(a))}</Text>
                  <View style={{ flex: 1 }}><StatusBadge status={a.status} /></View>
                  <Pressable onPress={() => open(a)} style={s.viewBtn}>
                    <Text style={s.viewBtnText}>View</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            list.map((a) => (
              <Pressable key={a.id} onPress={() => open(a)} style={s.card}>
                <View style={s.cardTop}>
                  <Text style={[s.td, { color: '#0369a1' }]}>{refNo(a)}</Text>
                  <StatusBadge status={a.status} />
                </View>
                <Text style={s.service}>{a.serviceName}</Text>
                <Text style={k.muted}>{userMap[a.userId]?.fullName || '-'} {'\u00B7'} {fmtDate(appMs(a))}</Text>
              </Pressable>
            ))
          )}
        </Panel>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: 1400, alignSelf: 'center' },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: A.border },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: A.border,
  },
  thRow: { backgroundColor: '#f8fafc', borderTopWidth: 0 },
  th: { fontSize: 12, fontWeight: '800', color: A.text },
  td: { fontSize: 13, color: A.text },
  viewBtn: {
    width: 60,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: A.primary,
    backgroundColor: '#fff',
  },
  viewBtnText: { color: A.primary, fontSize: 12, fontWeight: '800' },
  card: { borderWidth: 1, borderColor: A.border, borderRadius: 12, padding: 12, marginBottom: 8, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  service: { fontSize: 15, fontWeight: '700', color: A.text },
});