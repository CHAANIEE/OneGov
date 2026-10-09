import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getServices, subscribeMyApplications } from '../../src/services/applications';
import { shortId } from '../../src/lib/helpers';

const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#d1d5db',
  borderSoft: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
};

// Status badge colors (tracking steps: Submitted > Under Review > Assessment > Payment > Release)
const STATUS_STYLES = {
  Submitted: { bg: '#dbeafe', fg: '#1e40af' },
  'Under Review': { bg: '#fef3c7', fg: '#92400e' },
  Assessment: { bg: '#ede9fe', fg: '#5b21b6' },
  Payment: { bg: '#ffedd5', fg: '#9a3412' },
  Release: { bg: '#cffafe', fg: '#155e75' },
  Completed: { bg: '#dcfce7', fg: '#166534' },
};
const DEFAULT_STATUS = { bg: '#f1f5f9', fg: '#334155' };

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [services, setServices] = useState([]);
  const [apps, setApps] = useState([]);

  const { width } = useWindowDimensions();
  const serviceCols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const appCols = width >= 900 ? 2 : 1;

  useEffect(() => {
    getServices().then(setServices).catch((e) => console.warn(e.message));
  }, []);

  useEffect(() => {
    if (!profile) return;
    return subscribeMyApplications(profile.uid, setApps);
  }, [profile]);

  const completed = apps.filter((a) => a.status === 'Completed').length;
  const pending = apps.filter((a) => ['Submitted', 'Under Review'].includes(a.status)).length;
  const active = apps.length - completed;

  const stats = [
    { label: 'Active Applications', value: active },
    { label: 'Pending', value: pending },
    { label: 'Completed', value: completed },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      {/* Brand header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>TAGUM ONEGOV</Text>
            <Text style={styles.headerSub}>Citizen Dashboard</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Hello, {profile?.fullName || 'Citizen'}</Text>
        <Text style={styles.greetingSub}>Here is a summary of your applications.</Text>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Available services */}
        <Text style={styles.h2}>Available Services</Text>
        {services.length === 0 ? (
          <Text style={styles.muted}>No services available right now.</Text>
        ) : (
          <View style={styles.grid}>
            {services.map((s) => (
              <View key={s.id} style={[styles.gridItem, { width: `${100 / serviceCols}%` }]}>
                <Pressable
                  onPress={() => router.push(`/(citizen)/apply/${s.id}`)}
                  style={({ pressed, hovered }) => [
                    styles.serviceCard,
                    hovered && styles.cardHover,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.serviceIcon}>
                    <Text style={styles.serviceIconText}>
                      {(s.serviceName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{s.serviceName}</Text>
                    {!!s.description && (
                      <Text style={styles.muted} numberOfLines={2}>
                        {s.description}
                      </Text>
                    )}
                    <Text style={styles.applyLink}>Apply now</Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* My applications */}
        <Text style={styles.h2}>My Applications</Text>
        {apps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.muted}>No applications yet. Choose a service above to get started.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {apps.map((a) => {
              const st = STATUS_STYLES[a.status] || DEFAULT_STATUS;
              return (
                <View key={a.id} style={[styles.gridItem, { width: `${100 / appCols}%` }]}>
                  <Pressable
                    onPress={() => router.push(`/(citizen)/track/${a.id}`)}
                    style={({ pressed, hovered }) => [
                      styles.appCard,
                      hovered && styles.cardHover,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appTitle}>{a.serviceName}</Text>
                      <Text style={styles.muted}>Application #{shortId(a.id)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeText, { color: st.fg }]}>{a.status}</Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  brand: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSub: {
    color: COLORS.accent,
    fontSize: 13,
    marginTop: 2,
  },

  // Content
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  greetingSub: {
    marginTop: 2,
    marginBottom: 16,
    fontSize: 14,
    color: COLORS.muted,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderTopWidth: 4,
    borderTopColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  statValue: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Sections
  h2: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  muted: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    padding: 6,
  },

  // Service cards
  serviceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderSoft,
    padding: 14,
    minHeight: 96,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  applyLink: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardHover: {
    borderColor: COLORS.primary,
  },
  cardPressed: {
    backgroundColor: COLORS.bg,
  },

  // Application cards
  appCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderSoft,
    padding: 14,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    padding: 18,
  },
});