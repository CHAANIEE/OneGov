import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { A, initialsOf } from '../../src/components/AdminKit';

const NAV = [
  { key: 'overview', label: 'Overview', icon: 'home-outline', href: '/(admin)', match: (p) => p === '/' || p === '' },
  { key: 'users', label: 'User Management', icon: 'people-outline', href: '/(admin)/users', match: (p) => p.startsWith('/users') },
  { key: 'services', label: 'Services & Requirements', icon: 'document-text-outline', href: '/(admin)/services', match: (p) => p.startsWith('/services') },
  { key: 'barangays', label: 'Barangays', icon: 'business-outline', href: '/(admin)/barangays', match: (p) => p.startsWith('/barangays') },
  { key: 'applications', label: 'Applications', icon: 'documents-outline', href: '/(admin)/applications', match: (p) => p.startsWith('/applications') || p.startsWith('/application') },
  { key: 'payments', label: 'Payments', icon: 'card-outline', href: '/(admin)/payments', match: (p) => p.startsWith('/payments') },
  { key: 'announcements', label: 'Announcements', icon: 'megaphone-outline', href: '/(admin)/announcements', match: (p) => p.startsWith('/announcements') },
];

export default function AdminShell() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState(0);

  // Pending staff/barangay/admin role requests (shown on the bell)
  useEffect(() => {
    const q = query(collection(db, 'users'), where('requestedRole', 'in', ['staff', 'barangay', 'admin']));
    return onSnapshot(
      q,
      (s) => setRequests(s.docs.filter((d) => d.data().role === 'citizen').length),
      (e) => console.warn(e.message)
    );
  }, []);

  const submitSearch = () => {
    const q = search.trim();
    const base = pathname.startsWith('/users')
      ? '/(admin)/users'
      : pathname.startsWith('/services')
        ? '/(admin)/services'
        : '/(admin)/applications';
    router.push({ pathname: base, params: q ? { q } : {} });
  };

  const showBack = pathname.startsWith('/application/');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(admin)/applications'));

  const searchBox = (
    <View style={s.search}>
      <Ionicons name="search-outline" size={18} color={A.muted} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={submitSearch}
        placeholder="Search users, applications, services, or reference number..."
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        style={s.searchInput}
      />
    </View>
  );

  const brand = (
    <Pressable onPress={() => router.push('/(admin)')} style={[s.brandBox, isWide && { width: 250 }]}>
      <View style={s.logo}>
        <Ionicons name="business" size={22} color={A.primary} />
      </View>
      <View>
        <Text style={s.brand}>OneGov</Text>
        <Text style={s.brandSub}>Tagum City</Text>
        {isWide && <Text style={s.brandTag}>One City. One Portal. Many Services.</Text>}
      </View>
    </Pressable>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          {brand}
          {isWide ? <View style={s.searchWrap}>{searchBox}</View> : <View style={{ flex: 1 }} />}

          <View style={s.headerRight}>
            <Pressable onPress={() => router.push('/(admin)/users')} style={s.bell} hitSlop={8}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {requests > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>{requests > 9 ? '9+' : requests}</Text>
                </View>
              )}
            </Pressable>

            <View style={s.userChip}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initialsOf(profile?.fullName || 'Admin')}</Text>
              </View>
              {isWide && (
                <View style={{ maxWidth: 160 }}>
                  <Text style={s.userName} numberOfLines={1}>{profile?.fullName || 'Admin'}</Text>
                  <Text style={s.userRole}>System Administrator</Text>
                </View>
              )}
            </View>

            <Pressable onPress={() => signOut(auth)} style={s.logout} hitSlop={8}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
              {isWide && <Text style={s.logoutText}>Logout</Text>}
            </Pressable>
          </View>
        </View>

        {!isWide && (
          <View style={{ marginTop: 10 }}>{searchBox}</View>
        )}
      </View>

      {/* Phone navigation */}
      {!isWide && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.navScroll}
          contentContainerStyle={s.navScrollContent}
        >
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.href)}
                style={[s.pill, active && s.pillActive]}
              >
                <Ionicons name={item.icon} size={16} color={active ? '#fff' : A.primary} />
                <Text style={[s.pillText, active && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={s.body}>
        {isWide && (
          <View style={s.sidebar}>
            <View style={{ padding: 12 }}>
              {NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => router.push(item.href)}
                    style={({ hovered }) => [
                      s.navItem,
                      active && s.navItemActive,
                      hovered && !active && s.navItemHover,
                    ]}
                  >
                    <Ionicons name={item.icon} size={21} color={active ? '#fff' : '#bbf7d0'} />
                    <Text style={[s.navText, active && { color: '#fff', fontWeight: '800' }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.footerCard}>
              <Ionicons name="business-outline" size={22} color="#bbf7d0" />
              <View>
                <Text style={s.footerTitle}>Tagum City Government</Text>
                <Text style={s.footerText}>Davao del Norte, Philippines</Text>
              </View>
            </View>
          </View>
        )}

        <View style={s.main}>
          {showBack && (
            <Pressable onPress={goBack} style={s.backRow}>
              <Ionicons name="chevron-back" size={18} color={A.primary} />
              <Text style={s.backText}>Back to applications</Text>
            </Pressable>
          )}
          <Slot />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bg },

  header: { backgroundColor: A.deep, paddingHorizontal: 14, paddingVertical: 10, zIndex: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 24 },
  brandSub: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  brandTag: { color: '#bbf7d0', fontSize: 10, marginTop: 1 },

  searchWrap: { flex: 1, alignItems: 'flex-start' },
  search: {
    width: '100%',
    maxWidth: 640,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: A.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bell: { padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  userChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: A.primary, fontWeight: '800', fontSize: 15 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userRole: { color: '#bbf7d0', fontSize: 11 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  navScroll: { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: A.border },
  navScrollContent: { gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: A.primary,
    backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: A.primary },
  pillText: { fontSize: 12, fontWeight: '700', color: A.primary },

  body: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },

  sidebar: { width: 250, backgroundColor: A.deep, justifyContent: 'space-between' },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: { backgroundColor: A.primary },
  navItemHover: { backgroundColor: 'rgba(255,255,255,0.07)' },
  navText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#d1fae5' },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  footerText: { color: '#bbf7d0', fontSize: 11, marginTop: 1 },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignSelf: 'flex-start',
  },
  backText: { color: A.primary, fontWeight: '700', fontSize: 14 },
});