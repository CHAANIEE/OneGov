import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
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

const C = {
  primary: '#166534',
  primaryDark: '#14532d',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
  danger: '#ef4444',
};

const NAV = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'home-outline',
    href: '/(citizen)',
    match: (p) => p === '/' || p === '',
  },
  {
    key: 'applications',
    label: 'My Applications',
    icon: 'document-text-outline',
    href: '/(citizen)/applications',
    match: (p) => p.startsWith('/applications') || p.startsWith('/track'),
  },
  {
    key: 'services',
    label: 'Services',
    icon: 'grid-outline',
    href: '/(citizen)/services',
    match: (p) => p.startsWith('/services') || p.startsWith('/apply'),
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'notifications-outline',
    href: '/(citizen)/notifications',
    match: (p) => p.startsWith('/notifications'),
    badge: true,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    href: '/(citizen)/profile',
    match: (p) => p.startsWith('/profile'),
  },
];

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export default function CitizenShell() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      where('isRead', '==', false)
    );
    return onSnapshot(q, (s) => setUnread(s.size), (e) => console.warn(e.message));
  }, [profile?.uid]);

  const go = (href) => {
    setMenuOpen(false);
    router.push(href);
  };

  const submitSearch = () => {
    setMenuOpen(false);
    const q = search.trim();
    router.push({ pathname: '/(citizen)', params: q ? { q } : {} });
  };

  const showBack = pathname.startsWith('/apply') || pathname.startsWith('/track');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(citizen)'));

  const badgeText = unread > 9 ? '9+' : String(unread);

  const searchBox = (
    <View style={s.search}>
      <Ionicons name="search-outline" size={18} color={C.muted} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={submitSearch}
        placeholder="Search for services, permits, or information..."
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        style={s.searchInput}
      />
    </View>
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Pressable onPress={() => go('/(citizen)')} style={s.brandRow}>
            <View style={s.logo}>
              <Ionicons name="business" size={22} color={C.primary} />
            </View>
            <View>
              <Text style={s.brand}>OneGov</Text>
              {isWide && <Text style={s.tagline}>Tagum City {'\u2022'} One Portal. Many Services.</Text>}
            </View>
          </Pressable>

          {isWide && <View style={s.searchWrap}>{searchBox}</View>}
          {!isWide && <View style={{ flex: 1 }} />}

          <View style={s.headerRight}>
            <Pressable onPress={() => go('/(citizen)/notifications')} style={s.bell} hitSlop={8}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {unread > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>{badgeText}</Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={() => setMenuOpen((v) => !v)} style={s.userChip}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initialsOf(profile?.fullName)}</Text>
              </View>
              {isWide && (
                <View style={{ maxWidth: 160 }}>
                  <Text style={s.userName} numberOfLines={1}>{profile?.fullName || 'Citizen'}</Text>
                  <Text style={s.userRole}>Citizen</Text>
                </View>
              )}
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {!isWide && <View style={s.searchRowNarrow}>{searchBox}</View>}
      </View>

      {/* User menu */}
      {menuOpen && (
        <>
          <Pressable style={s.backdrop} onPress={() => setMenuOpen(false)} />
          <View style={[s.menu, { top: isWide ? 74 : 62 }]}>
            <Pressable style={s.menuItem} onPress={() => go('/(citizen)/profile')}>
              <Ionicons name="person-outline" size={18} color={C.text} />
              <Text style={s.menuText}>My Profile</Text>
            </Pressable>
            <Pressable
              style={s.menuItem}
              onPress={() => {
                setMenuOpen(false);
                signOut(auth);
              }}
            >
              <Ionicons name="log-out-outline" size={18} color={C.danger} />
              <Text style={[s.menuText, { color: C.danger }]}>Logout</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Body */}
      <View style={s.body}>
        {isWide && (
          <View style={s.sidebar}>
            <View style={{ padding: 12 }}>
              {NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => go(item.href)}
                    style={({ hovered }) => [
                      s.navItem,
                      active && s.navItemActive,
                      hovered && !active && s.navItemHover,
                    ]}
                  >
                    <Ionicons name={item.icon} size={22} color={active ? C.primary : '#475569'} />
                    <Text style={[s.navText, active && s.navTextActive]}>{item.label}</Text>
                    {item.badge && unread > 0 && (
                      <View style={s.navBadge}>
                        <Text style={s.navBadgeText}>{badgeText}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={s.cityCard}>
              <Text style={s.cityTitle}>Tagum City</Text>
              <Text style={s.cityText}>A more convenient, transparent and connected city.</Text>
            </View>
          </View>
        )}

        <View style={s.main}>
          {showBack && (
            <Pressable onPress={goBack} style={s.backRow}>
              <Ionicons name="chevron-back" size={18} color={C.primary} />
              <Text style={s.backText}>Back</Text>
            </Pressable>
          )}
          <Slot />
        </View>
      </View>

      {/* Bottom navigation (phones) */}
      {!isWide && (
        <View style={s.bottomBar}>
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Pressable key={item.key} onPress={() => go(item.href)} style={s.bottomItem}>
                <View>
                  <Ionicons name={item.icon} size={22} color={active ? C.primary : C.muted} />
                  {item.badge && unread > 0 && (
                    <View style={s.bottomBadge}>
                      <Text style={s.navBadgeText}>{badgeText}</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.bottomText, active && { color: C.primary }]} numberOfLines={1}>
                  {item.key === 'applications' ? 'Applications' : item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  tagline: { color: C.accent, fontSize: 11, marginTop: -2 },
  searchWrap: { flex: 1, alignItems: 'center' },
  search: {
    width: '100%',
    maxWidth: 560,
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
    color: C.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  searchRowNarrow: { marginTop: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bell: { padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.danger,
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
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.primary, fontWeight: '800', fontSize: 15 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  userRole: { color: C.accent, fontSize: 12 },

  // Menu
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  menu: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  menuText: { fontSize: 14, fontWeight: '600', color: C.text },

  // Body
  body: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },

  // Sidebar
  sidebar: {
    width: 250,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: 'space-between',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: { backgroundColor: C.accent },
  navItemHover: { backgroundColor: '#f8fafc' },
  navText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  navTextActive: { color: C.primary, fontWeight: '800' },
  navBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  navBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cityCard: {
    margin: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.primary,
    minHeight: 150,
    justifyContent: 'flex-end',
  },
  cityTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cityText: { color: C.accent, fontSize: 13, lineHeight: 18, marginTop: 4 },

  // Back
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignSelf: 'flex-start',
  },
  backText: { color: C.primary, fontWeight: '700', fontSize: 14 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    paddingBottom: 10,
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 3 },
  bottomText: { fontSize: 10, fontWeight: '700', color: C.muted },
  bottomBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});