import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { getServices, subscribeMyApplications } from '../../src/services/applications';
import StatusBadge from '../../src/components/StatusBadge';
import { serviceIcon, TILE_COLORS, refNo, shortDate } from '../../src/lib/display';

const C = {
  primary: '#166534',
  primaryDark: '#14532d',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
};

const DOT_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#9333ea'];

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();

  const [services, setServices] = useState([]);
  const [apps, setApps] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unread, setUnread] = useState(0);
  const [now, setNow] = useState(new Date());

  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (rawQ || '').trim().toLowerCase();

  // Layout breakpoints (the sidebar takes 250px on wide screens)
  const contentWidth = width >= 900 ? width - 250 : width;
  const twoCol = contentWidth >= 1000;
  const mainWidth = twoCol ? contentWidth - 340 - 56 : contentWidth - 32;
  const serviceCols = mainWidth >= 720 ? 3 : mainWidth >= 440 ? 2 : 1;
  const tableMode = mainWidth >= 600;

  useEffect(() => {
    getServices().then(setServices).catch((e) => console.warn(e.message));
  }, []);

  useEffect(() => {
    if (!profile) return;
    return subscribeMyApplications(profile.uid, setApps);
  }, [profile?.uid]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(4));
    return onSnapshot(
      q,
      (s) => setAnnouncements(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.warn(e.message)
    );
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      where('isRead', '==', false)
    );
    return onSnapshot(q, (s) => setUnread(s.size), (e) => console.warn(e.message));
  }, [profile?.uid]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const completed = apps.filter((a) => a.status === 'Completed').length;
  const pending = apps.filter((a) => ['Submitted', 'Under Review'].includes(a.status)).length;
  const active = apps.length - completed;

  const stats = [
    { label: 'Active Applications', value: active, icon: 'storefront-outline', tint: '#dcfce7', fg: '#166534', to: '/(citizen)/applications' },
    { label: 'Pending', value: pending, icon: 'hourglass-outline', tint: '#dbeafe', fg: '#1d4ed8', to: '/(citizen)/applications' },
    { label: 'Completed', value: completed, icon: 'checkmark-circle-outline', tint: '#dcfce7', fg: '#16a34a', to: '/(citizen)/applications' },
    { label: 'Unread Notifications', value: unread, icon: 'notifications-outline', tint: '#ede9fe', fg: '#6d28d9', to: '/(citizen)/notifications' },
  ];

  const shownServices = useMemo(() => {
    const list = term
      ? services.filter((s) => `${s.serviceName || ''} ${s.description || ''}`.toLowerCase().includes(term))
      : services;
    return term ? list : list.slice(0, 6);
  }, [services, term]);

  const filteredApps = useMemo(
    () =>
      term
        ? apps.filter((a) => `${a.serviceName || ''} ${a.status || ''} ${refNo(a)}`.toLowerCase().includes(term))
        : apps,
    [apps, term]
  );
  const recent = filteredApps.slice(0, 5);

  const dateText = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeText = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const profileIncomplete = !profile?.phone || !profile?.barangayName;

  // ---------- Sections ----------
  const banner = (
    <View style={s.banner}>
      <View style={s.bannerCircleA} />
      <View style={s.bannerCircleB} />
      <View style={s.bannerRow}>
        <View style={s.bannerAvatar}>
          <Text style={s.bannerAvatarText}>{initialsOf(profile?.fullName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>Hello, {profile?.fullName || 'Citizen'}</Text>
          <Text style={s.bannerText}>Welcome to your OneGov Citizen Dashboard!</Text>
          <Text style={s.bannerSmall}>Easier. Faster. Closer to You.</Text>
        </View>
        {contentWidth >= 700 && (
          <View style={s.clock}>
            <View style={s.clockRow}>
              <Ionicons name="calendar-outline" size={14} color={C.accent} />
              <Text style={s.clockText}>{dateText}</Text>
            </View>
            <View style={s.clockRow}>
              <Ionicons name="time-outline" size={14} color={C.accent} />
              <Text style={s.clockText}>{timeText}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const statCards = (
    <View style={s.statsRow}>
      {stats.map((st) => (
        <Pressable
          key={st.label}
          onPress={() => router.push(st.to)}
          style={({ hovered }) => [s.statCard, hovered && { borderColor: C.primary }]}
        >
          <View style={[s.statIcon, { backgroundColor: st.tint }]}>
            <Ionicons name={st.icon} size={22} color={st.fg} />
          </View>
          <Text style={s.statLabel}>{st.label}</Text>
          <Text style={s.statValue}>{st.value}</Text>
          <Text style={s.statLink}>View all {'\u2192'}</Text>
        </Pressable>
      ))}
    </View>
  );

  const quickServices = (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.panelTitle}>Quick Services</Text>
          <Text style={s.panelSub}>Access the most used services from Tagum City Government.</Text>
        </View>
        <Pressable onPress={() => router.push('/(citizen)/services')}>
          <Text style={s.link}>View all services {'\u2192'}</Text>
        </Pressable>
      </View>

      {shownServices.length === 0 ? (
        <Text style={s.muted}>
          {term ? 'No services match your search.' : 'No services available right now.'}
        </Text>
      ) : (
        <View style={s.grid}>
          {shownServices.map((sv, i) => {
            const tile = TILE_COLORS[i % TILE_COLORS.length];
            return (
              <View key={sv.id} style={[s.gridItem, { width: `${100 / serviceCols}%` }]}>
                <Pressable
                  onPress={() => router.push(`/(citizen)/apply/${sv.id}`)}
                  style={({ hovered }) => [s.serviceCard, hovered && { borderColor: C.primary }]}
                >
                  <View style={[s.serviceTile, { backgroundColor: tile.bg }]}>
                    <Ionicons name={serviceIcon(sv.serviceName)} size={24} color={tile.fg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.serviceName} numberOfLines={2}>{sv.serviceName}</Text>
                    {!!sv.description && (
                      <Text style={s.serviceDesc} numberOfLines={2}>{sv.description}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const recentApps = (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <Text style={[s.panelTitle, { flex: 1 }]}>Recent Applications</Text>
        <Pressable onPress={() => router.push('/(citizen)/applications')}>
          <Text style={s.link}>View all {'\u2192'}</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <Text style={s.muted}>
          {term ? 'No applications match your search.' : 'No applications yet. Choose a service to get started.'}
        </Text>
      ) : tableMode ? (
        <View style={s.table}>
          <View style={[s.tr, s.thRow]}>
            <Text style={[s.th, { flex: 1.3 }]}>Reference No.</Text>
            <Text style={[s.th, { flex: 1.6 }]}>Service</Text>
            <Text style={[s.th, { flex: 1 }]}>Status</Text>
            <Text style={[s.th, { flex: 1 }]}>Date Submitted</Text>
            <View style={{ width: 64 }} />
          </View>
          {recent.map((a) => (
            <View key={a.id} style={s.tr}>
              <Text style={[s.td, { flex: 1.3 }]} numberOfLines={1}>{refNo(a)}</Text>
              <Text style={[s.td, { flex: 1.6 }]} numberOfLines={1}>{a.serviceName}</Text>
              <View style={{ flex: 1 }}><StatusBadge status={a.status} /></View>
              <Text style={[s.td, { flex: 1 }]}>{shortDate(a.dateSubmitted)}</Text>
              <Pressable onPress={() => router.push(`/(citizen)/track/${a.id}`)} style={s.viewBtn}>
                <Text style={s.viewBtnText}>View</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        recent.map((a) => (
          <View key={a.id} style={s.appCard}>
            <View style={s.appCardTop}>
              <Text style={s.td} numberOfLines={1}>{refNo(a)}</Text>
              <StatusBadge status={a.status} />
            </View>
            <Text style={s.appService}>{a.serviceName}</Text>
            <View style={s.appCardTop}>
              <Text style={s.muted}>{shortDate(a.dateSubmitted)}</Text>
              <Pressable onPress={() => router.push(`/(citizen)/track/${a.id}`)} style={s.viewBtn}>
                <Text style={s.viewBtnText}>View</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const announcementsPanel = (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <Ionicons name="megaphone-outline" size={22} color={C.text} />
        <Text style={[s.panelTitle, { flex: 1, marginLeft: 8 }]}>City Announcements</Text>
      </View>
      {announcements.length === 0 ? (
        <Text style={s.muted}>No announcements yet.</Text>
      ) : (
        announcements.map((a, i) => (
          <View key={a.id} style={[s.annRow, i > 0 && s.annDivider]}>
            <View style={[s.dot, { backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.annTitle}>{a.title}</Text>
              <Text style={s.muted}>{shortDate(a.createdAt)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const quickActions = [
    { label: 'Apply for Service', icon: 'add-circle-outline', to: '/(citizen)/services' },
    { label: 'Track Application', icon: 'search-outline', to: '/(citizen)/applications' },
    { label: 'Notifications', icon: 'notifications-outline', to: '/(citizen)/notifications' },
    { label: 'Update Profile', icon: 'person-outline', to: '/(citizen)/profile' },
  ];

  const actionsPanel = (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <Ionicons name="flash-outline" size={22} color={C.text} />
        <Text style={[s.panelTitle, { flex: 1, marginLeft: 8 }]}>Quick Actions</Text>
      </View>
      <View style={s.actionsGrid}>
        {quickActions.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => router.push(q.to)}
            style={({ hovered }) => [s.actionTile, hovered && { borderColor: C.primary }]}
          >
            <Ionicons name={q.icon} size={22} color={C.primary} />
            <Text style={s.actionText}>{q.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const profilePanel = (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <Ionicons name="person-outline" size={22} color={C.text} />
        <Text style={[s.panelTitle, { flex: 1, marginLeft: 8 }]}>My Profile</Text>
        <Pressable onPress={() => router.push('/(citizen)/profile')}>
          <Text style={s.link}>View Profile {'\u2192'}</Text>
        </Pressable>
      </View>
      <View style={s.profileRow}>
        <View style={s.profileAvatar}>
          <Text style={s.profileAvatarText}>{initialsOf(profile?.fullName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.profileName}>{profile?.fullName}</Text>
          <Text style={s.muted}>
            {profile?.barangayName ? `Brgy. ${profile.barangayName}, Tagum City` : 'Tagum City'}
          </Text>
          {!!profile?.phone && <Text style={s.muted}>{profile.phone}</Text>}
          <Text style={s.muted} numberOfLines={1}>{profile?.email}</Text>
        </View>
      </View>
      {profileIncomplete ? (
        <Pressable onPress={() => router.push('/(citizen)/profile')} style={[s.note, s.noteWarn]}>
          <Ionicons name="alert-circle-outline" size={22} color="#b45309" />
          <View style={{ flex: 1 }}>
            <Text style={[s.noteTitle, { color: '#92400e' }]}>Complete your profile</Text>
            <Text style={[s.noteText, { color: '#92400e' }]}>Add your mobile number and barangay.</Text>
          </View>
        </Pressable>
      ) : (
        <View style={s.note}>
          <Ionicons name="checkmark-circle" size={22} color={C.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.noteTitle}>Your profile is complete</Text>
            <Text style={s.noteText}>You can use all available services.</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <View style={s.container}>
        {!!term && (
          <View style={s.searchNote}>
            <Text style={s.searchNoteText}>Showing results for {'\u201C'}{rawQ}{'\u201D'}</Text>
            <Pressable onPress={() => router.setParams({ q: '' })}>
              <Text style={s.link}>Clear</Text>
            </Pressable>
          </View>
        )}

        <View style={twoCol ? s.twoCol : null}>
          <View style={twoCol ? s.mainCol : null}>
            {banner}
            {statCards}
            {quickServices}
            {recentApps}
          </View>
          <View style={twoCol ? s.sideCol : null}>
            {announcementsPanel}
            {actionsPanel}
            {profilePanel}
          </View>
        </View>

        <Text style={s.footer}>OneGov {'\u2022'} City Government of Tagum</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: 1400, alignSelf: 'center' },
  twoCol: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  mainCol: { flex: 1 },
  sideCol: { width: 340 },

  searchNote: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchNoteText: { color: C.primaryDark, fontWeight: '700', fontSize: 14 },

  // Banner
  banner: {
    backgroundColor: C.primary,
    borderRadius: 18,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 14,
  },
  bannerCircleA: {
    position: 'absolute',
    right: -40,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bannerCircleB: {
    position: 'absolute',
    right: 120,
    bottom: -90,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAvatarText: { color: C.primary, fontSize: 26, fontWeight: '800' },
  bannerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  bannerText: { color: '#fff', fontSize: 15, marginTop: 4 },
  bannerSmall: { color: C.accent, fontSize: 13, marginTop: 10 },
  clock: { alignSelf: 'flex-start', gap: 8 },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  clockText: { color: '#fff', fontSize: 13 },

  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  statCard: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 16,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  statValue: { fontSize: 32, fontWeight: '800', color: C.text, marginVertical: 2 },
  statLink: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Panels
  panel: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  panelTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  panelSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  link: { fontSize: 13, fontWeight: '700', color: C.primary },
  muted: { fontSize: 13, color: C.muted, lineHeight: 18 },

  // Services
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { padding: 6 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 88,
    backgroundColor: '#fff',
  },
  serviceTile: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 14, fontWeight: '800', color: C.text },
  serviceDesc: { fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 16 },

  // Table
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  thRow: { backgroundColor: '#f8fafc', borderTopWidth: 0 },
  th: { fontSize: 12, fontWeight: '800', color: C.text },
  td: { fontSize: 13, color: C.text },
  viewBtn: {
    width: 64,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: '#fff',
  },
  viewBtnText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  appCard: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8, gap: 8 },
  appCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  appService: { fontSize: 15, fontWeight: '700', color: C.text },

  // Announcements
  annRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  annDivider: { borderTopWidth: 1, borderTopColor: C.border },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  annTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },

  // Quick actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  actionText: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },

  // Profile
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileName: { fontSize: 16, fontWeight: '800', color: C.text },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  noteWarn: { backgroundColor: '#fef3c7' },
  noteTitle: { fontSize: 14, fontWeight: '800', color: C.primaryDark },
  noteText: { fontSize: 12, color: C.primaryDark, marginTop: 1 },

  footer: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 10 },
});