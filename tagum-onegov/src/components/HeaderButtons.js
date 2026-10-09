import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function LogoutButton() {
  return (
    <Pressable onPress={() => signOut(auth)} style={{ paddingHorizontal: 14 }}>
      <Text style={{ color: 'white', fontWeight: '600' }}>Logout</Text>
    </Pressable>
  );
}

export function BackButton({ fallback = '/(citizen)' }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      style={{ paddingHorizontal: 14 }}>
      <Text style={{ color: 'white', fontWeight: '600' }}>‹ Back</Text>
    </Pressable>
  );
}