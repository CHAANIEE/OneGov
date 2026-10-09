import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const HOME = {
  citizen: '(citizen)',
  staff: '(staff)',
  barangay: '(barangay)',
  admin: '(admin)',
};

function Gate() {
  const { profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const group = segments[0];

    if (!profile) {
      if (group !== '(auth)') router.replace('/(auth)/login');
      return;
    }
    // Logged in: keep the user inside their own role's area
    const home = HOME[profile.role] ?? '(citizen)';
    if (group !== home) router.replace(`/${home}`);
  }, [profile, loading, segments]);

  return <Slot />;
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}