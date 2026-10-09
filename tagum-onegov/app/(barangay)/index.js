import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeBarangayApplications, verifyByBarangay } from '../../src/services/applications';
import { ui } from '../../src/lib/ui';
import { notify, shortId } from '../../src/lib/helpers';

export default function BarangayHome() {
  const { profile } = useAuth();
  const [apps, setApps] = useState([]);

  useEffect(() => {
    if (!profile?.barangayId) return;
    return subscribeBarangayApplications(profile.barangayId, setApps);
  }, [profile]);

  if (!profile?.barangayId) {
    return (
      <View style={ui.screen}>
        <Text>Your account is not assigned to a barangay yet. Ask the System Administrator to assign one.</Text>
      </View>
    );
  }

  const verify = async (app) => {
    try { await verifyByBarangay(app); } catch (e) { notify('Error', e.message); }
  };

  return (
    <View style={ui.screen}>
      {apps.length === 0 && <Text style={ui.muted}>No applications from your barangay.</Text>}
      <FlatList
        data={apps}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={ui.card}>
            <Text style={{ fontWeight: '600' }}>#{shortId(item.id)} – {item.serviceName}</Text>
            <Text>Status: {item.status}</Text>
            {item.barangayVerified ? (
              <Text style={{ color: 'green', marginTop: 6 }}>✓ Verified</Text>
            ) : (
              <Pressable style={ui.button} onPress={() => verify(item)}>
                <Text style={ui.buttonText}>VERIFY RESIDENT</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}