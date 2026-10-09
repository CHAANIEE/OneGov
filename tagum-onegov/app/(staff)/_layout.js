import { Stack } from 'expo-router';
import { LogoutButton } from '../../src/components/HeaderButtons';

export default function StaffLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#166534' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        headerRight: () => <LogoutButton />,
        contentStyle: { backgroundColor: '#f0fdf4' },
      }}>
      <Stack.Screen name="index" options={{ title: 'Review Queue' }} />
      <Stack.Screen name="review/[id]" options={{ title: 'Review Application' }} />
    </Stack>
  );
}