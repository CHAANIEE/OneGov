import { Tabs } from 'expo-router';
import { LogoutButton, BackButton } from '../../src/components/HeaderButtons';

export default function CitizenLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#4285F4' },
        headerTintColor: 'white',
        headerRight: () => <LogoutButton />,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="apply/[serviceId]"
        options={{ href: null, title: 'Apply', headerLeft: () => <BackButton /> }} />
      <Tabs.Screen name="track/[id]"
        options={{ href: null, title: 'Tracking', headerLeft: () => <BackButton /> }} />
    </Tabs>
  );
}