import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeAllApplications } from '../../src/services/applications';
import { ui } from '../../src/lib/ui';
import { shortId, formatTs } from '../../src/lib/helpers';

export default function StaffQueue() {
  const router = useRouter();
  const [apps, setApps] = useState([]);

  useEffect(() => subscribeAllApplications(setApps), []);

  return (
    <View style={ui.screen}>
      {apps.length === 0 && <Text style={ui.muted}>No applications yet.</Text>}
      <FlatList
        data={apps}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <Pressable style={ui.card} onPress={() => router.push(`/(staff)/review/${item.id}`)}>
            <Text style={{ fontWeight: '600' }}>#{shortId(item.id)} – {item.serviceName}</Text>
            <Text>Status: {item.status}</Text>
            <Text style={[ui.muted, { fontSize: 12 }]}>{formatTs(item.dateSubmitted)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}