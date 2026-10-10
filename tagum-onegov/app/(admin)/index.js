import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { useAuth } from '../../src/context/AuthContext';
import { A, useCollection, Loading, Panel, tsMs, fmtDateTime, fmtDate } from '../../src/components/AdminKit';
import StatusBadge from '../../src/components/StatusBadge';
import { refNo } from '../../src/lib/display';

const GROUP_COLORS = { pending: '#f59e0b', processing: '#0e9aa7', completed: '#15803d' };
const GROUP_LABELS = { pending: 'Pending', processing: 'Processing', completed: 'Completed' };

const groupOf = (status) =>
  ['Submitted', 'Under Review'].includes(status) ? 'pending' : status === 'Completed' ? 'completed' : 'processing';

// A server timestamp that has not resolved yet counts as "now"
const appMs = (a) => tsMs(a.dateSubmitted) || Date.now();

export default function Overview() {
  const router = useRouter();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();

  const users = useCollection('users');
  const services = useCollection('services');
  const barangays = useCollection('barangays');
  const apps = useCollection('applications');
  const payments = useCollection('payments');
  const announcements = useCollection('announcements');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const contentWidth = width >= 900 ? width - 250 : width;
  const twoCol = contentWidth >= 1250;
  const mainWidth = twoCol ? contentWidth - 320 - 20 - 40 : contentWidth - 32;
  const chartsRow = mainWidth >= 760;
  const tableMode = mainWidth >= 640;

  const userMap = useMemo(() => {
    const m = {};
    users.items.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users.items]);

  const months = useMemo(() => {
    const base = new Date();
    const list = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      list.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        pending: 0,
        processing: 0,
        completed: 0,
        total: 0,
      });
    }
    apps.items.forEach((a) => {
      const d = new Date(appMs(a));
      const b = list.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (!b) return;
      b[groupOf(a.status)] += 1;
      b.total += 1;
    });
    return list;
  }, [apps.items]);

  if (!users.ready || !apps.ready) return <Loading />;

  const thisMonth = months[5].total;
  const lastMonth = months[4].total;
  const delta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const citizens = users.items.filter((u) => u.role === 'citizen').length;
  const personnel = users.items.length - citizens;
  const pendingCount = apps.items.filter((a) => groupOf(a.status) === 'pending').length;

  const stats = [
    {
      label: 'Total Users',
      value: users.items.length,
      icon: 'person-outline',
      tint: '#dcfce7',
      fg: A.primary,
      sub: `${citizens} citizens, ${personnel} personnel`,
    },
    {
      label: 'Active Services',
      value: services.items.length,
      icon: 'grid-outline',
      tint: '#dcfce7',
      fg: A.primary,
      sub: `${barangays.items.length} barangays`,
    },
    {
      label: 'Applications This Month',
      value: thisMonth,
      icon: 'document-text-outline',
      tint: '#dcfce7',
      fg: A.primary,
      delta,
    },
    {
      label: 'Pending Applications',
      value: pendingCount,
      icon: 'time-outline',
      tint: '#fef3c7',
      fg: '#d97706',
      sub: 'Awaiting review',
    },
  ];

  const statusSegments = ['pending', 'processing', 'completed'].map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    color: GROUP_COLORS[g],
    value: apps.items.filter((a) => groupOf(a.status) === g).length,
  }));

  const recent = [...apps.items].sort((a, b) => appMs(b) - appMs(a)).slice(0, 5);

  const activity = [
    ...apps.items.map((a) => ({
      id: `a${a.id}`,
      t: appMs(a),
      icon: 'document-text-outline',
      title: 'New application submitted',
      sub: `${a.serviceName} (Ref: ${refNo(a)})`,
    })),
    ...payments.items.map((p) => ({
      id: `p${p.id}`,
      t: tsMs(p.paidAt),
      icon: 'card-outline',
      title: 'Simulated payment received',
      sub: `\u20B1${Number(p.amount || 0).toFixed(2)} (Ref: ${p.referenceNo})`,
    })),
    ...announcements.items.map((n) => ({
      id: `n${n.id}`,
      t: tsMs(n.createdAt),
      icon: 'megaphone-outline',
      title: 'Announcement published',
      sub: n.title,
    })),
  ]
    .filter((e) => e.t > 0)
    .sort((a, b) => b.t - a.t)
    .slice(0, 6);

  const quick = [
    { label: 'Add Service', icon: 'add', to: '/(admin)/services' },
    { label: 'Manage Users', icon: 'people-outline', to: '/(admin)/users' },
    { label: 'Add Barangay', icon: 'business-outline', to: '/(admin)/barangays' },
    { label: 'Publish Announcement', icon: 'megaphone-outline', to: '/(admin)/announcements' },
  ];

  const dateText = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeText = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const header = (
    <View style={s.titleRow}>
      <View style={s.titleIcon}>
        <Ionicons name="shield-checkmark-outline" size={28} color={A.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Admin Overview</Text>
        <Text style={s.subtitle}>
          Welcome back, {profile?.fullName || 'Admin'}! Here's what's happening in your system today.
        </Text>
      </View>
      {contentWidth >= 700 && (
        <View style={{ alignItems: 'flex-end' }}>
          <View style={s.clockRow}>
            <Ionicons name="calendar-outline" size={14} color={A.text} />
            <Text style={s.clockText}>{dateText}</Text>
          </View>
          <Text style={s.clockSub}>{timeText}</Text>
        </View>
      )}
    </View>
  );

  const statCards = (
    <View style={s.statsRow}>
      {stats.map((st) => (
        <View key={st.label} style={s.statCard}>
          <View style={[s.statIcon, { backgroundColor: st.tint }]}>
            <Ionicons name={st.icon} size={24} color={st.fg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.statLabel}>{st.label}</Text>
            <Text style={s.statValue}>{st.value}</Text>
            {'delta' in st ? (
              st.delta === null ? (
                <Text style={s.statSub}>No data last month</Text>
              ) : (
                <Text style={[s.statSub, { color: st.delta >= 0 ? '#15803d' : A.danger, fontWeight: '700' }]}>
                  {st.delta >= 0 ? '\u2191 +' : '\u2193 '}
                  {st.delta}% <Text style={{ color: A.muted, fontWeight: '400' }}>vs. last month</Text>
                </Text>
              )
            ) : (
              <Text style={s.statSub}>{st.sub}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const barPanel = (
    <Panel
      title="Applications Overview"
      icon="bar-chart-outline"
      style={chartsRow ? { flex: 1.6, marginBottom: 0 } : null}
    >
      <Text style={[s.muted, { marginTop: -6, marginBottom: 10 }]}>Monthly application count for the last 6 months.</Text>
      <BarChart data={months} />
      <View style={s.legendRow}>
        {['completed', 'processing', 'pending'].map((g) => (
          <View key={g} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: GROUP_COLORS[g] }]} />
            <Text style={s.muted}>{GROUP_LABELS[g]}</Text>
          </View>
        ))}
      </View>
    </Panel>
  );

  const total = apps.items.length;
  const donutPanel = (
    <Panel
      title="Application Status"
      icon="stats-chart-outline"
      style={chartsRow ? { flex: 1, marginBottom: 0 } : null}
    >
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Donut segments={statusSegments} total={total} />
      </View>
      {statusSegments.map((sg) => (
        <View key={sg.key} style={s.statusRow}>
          <View style={[s.legendDot, { backgroundColor: sg.color }]} />
          <Text style={[s.statusLabel, { flex: 1 }]}>{sg.label}</Text>
          <Text style={s.statusValue}>{sg.value}</Text>
          <Text style={s.statusPct}>{total ? Math.round((sg.value / total) * 100) : 0}%</Text>
        </View>
      ))}
    </Panel>
  );

  const recentPanel = (
    <Panel
      title="Recent Applications"
      icon="document-text-outline"
      right={
        <Pressable onPress={() => router.push('/(admin)/applications')}>
          <Text style={s.link}>View all {'\u2192'}</Text>
        </Pressable>
      }
    >
      {recent.length === 0 ? (
        <Text style={s.muted}>No applications yet.</Text>
      ) : tableMode ? (
        <View style={s.table}>
          <View style={[s.tr, s.thRow]}>
            <Text style={[s.th, { width: 28 }]}>#</Text>
            <Text style={[s.th, { flex: 1.3 }]}>Reference No.</Text>
            <Text style={[s.th, { flex: 1.3 }]}>Citizen</Text>
            <Text style={[s.th, { flex: 1.4 }]}>Service</Text>
            <Text style={[s.th, { flex: 1.3 }]}>Submitted Date</Text>
            <Text style={[s.th, { flex: 1 }]}>Status</Text>
            <View style={{ width: 60 }} />
          </View>
          {recent.map((a, i) => (
            <View key={a.id} style={s.tr}>
              <Text style={[s.td, { width: 28 }]}>{i + 1}</Text>
              <Text style={[s.td, { flex: 1.3, color: '#0369a1' }]} numberOfLines={1}>{refNo(a)}</Text>
              <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{userMap[a.userId]?.fullName || '-'}</Text>
              <Text style={[s.td, { flex: 1.4 }]} numberOfLines={1}>{a.serviceName}</Text>
              <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{fmtDateTime(appMs(a))}</Text>
              <View style={{ flex: 1 }}><StatusBadge status={a.status} /></View>
              <Pressable onPress={() => router.push(`/(admin)/application/${a.id}`)} style={s.viewBtn}>
                <Text style={s.viewBtnText}>View</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        recent.map((a) => (
          <View key={a.id} style={s.appCard}>
            <View style={s.appCardTop}>
              <Text style={[s.td, { color: '#0369a1' }]}>{refNo(a)}</Text>
              <StatusBadge status={a.status} />
            </View>
            <Text style={s.appService}>{a.serviceName}</Text>
            <Text style={s.muted}>{userMap[a.userId]?.fullName || '-'} {'\u00B7'} {fmtDate(appMs(a))}</Text>
            <Pressable onPress={() => router.push(`/(admin)/application/${a.id}`)} style={[s.viewBtn, { alignSelf: 'flex-start' }]}>
              <Text style={s.viewBtnText}>View</Text>
            </Pressable>
          </View>
        ))
      )}
    </Panel>
  );

  const quickPanel = (
    <Panel title="Quick Administration" icon="settings-outline">
      <View style={s.quickGrid}>
        {quick.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => router.push(q.to)}
            style={({ hovered }) => [s.quickTile, hovered && { borderColor: A.primary }]}
          >
            <View style={s.quickIcon}>
              <Ionicons name={q.icon} size={22} color="#fff" />
            </View>
            <Text style={s.quickText}>{q.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </Pressable>
        ))}
      </View>
    </Panel>
  );

  const activityPanel = (
    <Panel title="System Activity" icon="time-outline">
      {activity.length === 0 ? (
        <Text style={s.muted}>No activity yet.</Text>
      ) : (
        activity.map((e, i) => (
          <View key={e.id} style={[s.actRow, i > 0 && s.actDivider]}>
            <View style={s.actIcon}>
              <Ionicons name={e.icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actTitle}>{e.title}</Text>
              <Text style={s.actSub} numberOfLines={1}>{e.sub}</Text>
              <Text style={s.muted}>{fmtDateTime(e.t)}</Text>
            </View>
          </View>
        ))
      )}
    </Panel>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <View style={s.container}>
        {header}
        <View style={twoCol ? s.twoCol : null}>
          <View style={twoCol ? { flex: 1 } : null}>
            {statCards}
            <View style={chartsRow ? s.chartsRow : null}>
              {barPanel}
              {donutPanel}
            </View>
            <View style={{ height: 16 }} />
            {recentPanel}
          </View>
          <View style={twoCol ? { width: 320 } : null}>
            {quickPanel}
            {activityPanel}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function BarChart({ data }) {
  const max = Math.max(4, ...data.map((d) => d.total));
  const top = Math.ceil(max / 4) * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);
  const H = 190;
  const scale = (H - 22) / top;
  const AXIS = 32;

  return (
    <View>
      <View style={{ flexDirection: 'row', height: H }}>
        <View style={{ width: AXIS, height: H }}>
          {ticks.map((t) => (
            <Text key={t} style={[s.tick, { position: 'absolute', right: 6, bottom: t * scale - 7 }]}>{t}</Text>
          ))}
        </View>
        <View style={{ flex: 1, height: H }}>
          {ticks.map((t) => (
            <View
              key={t}
              style={{ position: 'absolute', left: 0, right: 0, bottom: t * scale, height: 1, backgroundColor: '#eef2f0' }}
            />
          ))}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {data.map((d) => (
              <View key={d.key} style={{ alignItems: 'center', width: 44 }}>
                <Text style={s.barValue}>{d.total}</Text>
                <View style={{ width: 34, flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: d.completed * scale, backgroundColor: GROUP_COLORS.completed }} />
                  <View style={{ height: d.processing * scale, backgroundColor: GROUP_COLORS.processing }} />
                  <View style={{ height: d.pending * scale, backgroundColor: GROUP_COLORS.pending }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: AXIS, marginTop: 6 }}>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
          {data.map((d) => (
            <Text key={d.key} style={[s.tick, { width: 44, textAlign: 'center' }]} numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Donut({ segments, total }) {
  const size = 170;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${c}, ${c}`}>
          <Circle cx={c} cy={c} r={r} stroke="#eef2f0" strokeWidth={stroke} fill="none" />
          {total > 0 &&
            segments
              .filter((sg) => sg.value > 0)
              .map((sg) => {
                const len = (sg.value / total) * circ;
                const el = (
                  <Circle
                    key={sg.key}
                    cx={c}
                    cy={c}
                    r={r}
                    stroke={sg.color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${len} ${circ - len}`}
                    strokeDashoffset={-acc}
                  />
                );
                acc += len;
                return el;
              })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: A.text }}>{total}</Text>
        <Text style={{ fontSize: 11, color: A.muted }}>Total applications</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: A.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: 1500, alignSelf: 'center' },
  twoCol: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  chartsRow: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' },
  titleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: A.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: A.text },
  subtitle: { fontSize: 14, color: A.muted, marginTop: 2 },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clockText: { fontSize: 14, fontWeight: '600', color: A.text },
  clockSub: { fontSize: 13, color: A.muted, marginTop: 2 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    flexGrow: 1,
    flexBasis: 210,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: A.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: A.border,
    padding: 16,
  },
  statIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 13, color: A.muted, fontWeight: '600' },
  statValue: { fontSize: 32, fontWeight: '800', color: A.text, marginVertical: 2 },
  statSub: { fontSize: 12, color: A.muted },

  muted: { fontSize: 13, color: A.muted, lineHeight: 18 },
  link: { fontSize: 13, fontWeight: '700', color: A.primary },
  tick: { fontSize: 11, color: A.muted },
  barValue: { fontSize: 11, fontWeight: '700', color: A.text, marginBottom: 3 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  statusLabel: { fontSize: 13, color: A.text },
  statusValue: { fontSize: 13, fontWeight: '800', color: A.text, width: 36, textAlign: 'right' },
  statusPct: { fontSize: 12, color: A.muted, width: 40, textAlign: 'right' },

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
  appCard: { borderWidth: 1, borderColor: A.border, borderRadius: 12, padding: 12, marginBottom: 8, gap: 6 },
  appCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appService: { fontSize: 15, fontWeight: '700', color: A.text },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickTile: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: A.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: A.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { flex: 1, fontSize: 13, fontWeight: '700', color: A.text },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actDivider: { borderTopWidth: 1, borderTopColor: A.border },
  actIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: A.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actTitle: { fontSize: 14, fontWeight: '700', color: A.text },
  actSub: { fontSize: 12, color: '#0369a1', marginVertical: 1 },
});