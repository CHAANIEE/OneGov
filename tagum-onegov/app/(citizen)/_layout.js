import { View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutButton, BackButton } from '../../src/components/HeaderButtons';

const COLORS = {
  primary: '#166534',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  muted: '#64748b',
  border: '#d1fae5',
};

export default function CitizenLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <Tabs
      screenOptions={{
        // Header
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800', letterSpacing: 0.5 },
        headerShadowVisible: false,
        headerRight: () => (
          <View style={{ marginRight: 12 }}>
            <LogoutButton />
          </View>
        ),

        // Tab bar (bottom on phones, side bar on wide screens when supported)
        tabBarPosition: isWide ? 'left' : 'bottom',
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarActiveBackgroundColor: isWide ? COLORS.accent : undefined,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderColor: COLORS.border,
          paddingTop: 4,
          ...(isWide ? { width: 200 } : { height: 62, paddingBottom: 8 }),
        },

        // Screen background
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="apply/[serviceId]"
        options={{
          href: null,
          title: 'Apply',
          headerLeft: () => (
            <View style={{ marginLeft: 12 }}>
              <BackButton />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="track/[id]"
        options={{
          href: null,
          title: 'Tracking',
          headerLeft: () => (
            <View style={{ marginLeft: 12 }}>
              <BackButton />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}