import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getServices, subscribeMyApplications } from '../../src/services/applications';
import { ui } from '../../src/lib/ui';
import { shortId } from '../../src/lib/helpers';

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [services, setServices] = useState([]);
  const [apps, setApps] = useState([]);

  useEffect(() => {
    getServices().then(setServices).catch((e) => console.warn(e.message));
  }, []);

  useEffect(() => {
    if (!profile) return;
    return subscribeMyApplications(profile.uid, setApps);
  }, [profile]);

  const completed = apps.filter((a) => a.status === 'Completed').length;
  const pending = apps.filter((a) => ['Submitted', 'Under Review'].includes(a.status)).length;

  return (
    <ScrollView style={ui.screen}>
      <Text style={ui.title}>Hello, {profile?.fullName}</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {[['Active', apps.length - completed], ['Pending', pending], ['Completed', completed]].map(([l, n]) => (
          <View key={l} style={[ui.card, { flex: 1 }]}>
            <Text style={ui.muted}>{l}</Text>
            <Text style={{ fontSize: 22, fontWeight: '700' }}>{n}</Text>
          </View>
        ))}
      </View>

      <Text style={ui.h2}>Available Services</Text>
      {services.map((s) => (
        <Pressable key={s.id} style={ui.card} onPress={() => router.push(`/(citizen)/apply/${s.id}`)}>
          <Text style={{ fontWeight: '600' }}>{s.serviceName}</Text>
          <Text style={ui.muted}>{s.description}</Text>
        </Pressable>
      ))}

      <Text style={ui.h2}>My Applications</Text>
      {apps.length === 0 && <Text style={ui.muted}>No applications yet.</Text>}
      {apps.map((a) => (
        <Pressable key={a.id} style={ui.card} onPress={() => router.push(`/(citizen)/track/${a.id}`)}>
          <Text style={{ fontWeight: '600' }}>#{shortId(a.id)} – {a.serviceName}</Text>
          <Text style={ui.muted}>Status: {a.status}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}