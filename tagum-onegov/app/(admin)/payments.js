import { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { A, k, useCollection, Loading, PageHeader, Panel, tsMs, fmtDateTime } from '../../src/components/AdminKit';
import { refNo } from '../../src/lib/display';

export default function Payments() {
  const { width } = useWindowDimensions();
  const payments = useCollection('payments');
  const users = useCollection('users');
  const apps = useCollection('applications');

  const contentWidth = width >= 900 ? width - 250 : width;
  const tableMode = contentWidth >= 760;

  const userMap = useMemo(() => {
    const m = {};
    users.items.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users.items]);

  const appMap = useMemo(() => {
    const m = {};
    apps.items.forEach((a) => { m[a.id] = a; });
    return m;
  }, [apps.items]);

  const list = useMemo(
    () => [...payments.items].sort((a, b) => (tsMs(b.paidAt) || Date.now()) - (tsMs(a.paidAt) || Date.now())),
    [payments.items]
  );

  if (!payments.ready) return <Loading />;

  const total = payments.items.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll}>
      <View style={s.container}>
        <PageHeader
          icon="card-outline"
          title="Payments"
          subtitle="Simulated payments made by citizens. No real money is processed."
        />

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={k.muted}>Payments recorded</Text>
            <Text style={s.statValue}>{payments.items.length}</Text>
          </View>
          <View style={s.stat}>
            <Text style={k.muted}>Total simulated amount</Text>
            <Text style={s.statValue}>{'\u20B1'}{total.toFixed(2)}</Text>
          </View>
        </View>

        <Panel title="Payment history" icon="receipt-outline">
          {list.length === 0 && <Text style={k.muted}>No payments yet.</Text>}

          {tableMode && list.length > 0 ? (
            <View style={s.table}>
              <View style={[s.tr, s.thRow]}>
                <Text style={[s.th, { flex: 1.4 }]}>Reference No.</Text>
                <Text style={[s.th, { flex: 1.3 }]}>Citizen</Text>
                <Text style={[s.th, { flex: 1.4 }]}>Application</Text>
                <Text style={[s.th, { flex: 1 }]}>Amount</Text>
                <Text style={[s.th, { flex: 1.3 }]}>Date</Text>
                <Text style={[s.th, { flex: 0.8 }]}>Status</Text>
              </View>
              {list.map((p) => (
                <View key={p.id} style={s.tr}>
                  <Text style={[s.td, { flex: 1.4, color: '#0369a1' }]} numberOfLines={1}>{p.referenceNo}</Text>
                  <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{userMap[p.userId]?.fullName || '-'}</Text>
                  <Text style={[s.td, { flex: 1.4 }]} numberOfLines={1}>
                    {appMap[p.applicationId] ? refNo(appMap[p.applicationId]) : '-'}
                  </Text>
                  <Text style={[s.td, { flex: 1, fontWeight: '700' }]}>{'\u20B1'}{Number(p.amount || 0).toFixed(2)}</Text>
                  <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{fmtDateTime(tsMs(p.paidAt))}</Text>
                  <Text style={[s.td, { flex: 0.8, color: '#15803d', fontWeight: '700' }]}>{p.paymentStatus}</Text>
                </View>
              ))}
            </View>
          ) : (
            list.map((p) => (
              <View key={p.id} style={s.card}>
                <Text style={[s.td, { color: '#0369a1', fontWeight: '700' }]}>{p.referenceNo}</Text>
                <Text style={s.amount}>{'\u20B1'}{Number(p.amount || 0).toFixed(2)}</Text>
                <Text style={k.muted}>
                  {userMap[p.userId]?.fullName || '-'} {'\u00B7'} {fmtDateTime(tsMs(p.paidAt))}
                </Text>
              </View>
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
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  stat: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: A.border,
    padding: 16,
  },
  statValue: { fontSize: 30, fontWeight: '800', color: A.primary, marginTop: 4 },
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
  card: { borderWidth: 1, borderColor: A.border, borderRadius: 12, padding: 12, marginBottom: 8, gap: 4 },
  amount: { fontSize: 20, fontWeight: '800', color: A.text },
});