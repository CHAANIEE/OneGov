import { Stack } from 'expo-router';
import { LogoutButton } from '../../src/components/HeaderButtons';

export default function StaffLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#4285F4' },
        headerTintColor: 'white',
        headerRight: () => <LogoutButton />,
      }}>
      <Stack.Screen name="index" options={{ title: 'Review Queue' }} />
      <Stack.Screen name="review/[id]" options={{ title: 'Review Application' }} />
    </Stack>
  );
}