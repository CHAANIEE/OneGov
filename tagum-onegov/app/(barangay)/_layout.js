import { Stack } from 'expo-router';
import { LogoutButton } from '../../src/components/HeaderButtons';

export default function BarangayLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#4285F4' },
      headerTintColor: 'white',
      headerRight: () => <LogoutButton />,
    }}>
      <Stack.Screen name="index" options={{ title: 'Barangay Verification' }} />
    </Stack>
  );
}