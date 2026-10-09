import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeBarangayApplications, verifyByBarangay } from '../../src/services/applications';
import { ui, COLORS } from '../../src/lib/ui';
import { notify, shortId, formatTs } from '../../src/lib/helpers';
import StatusBadge from '../../src/components/StatusBadge';

export default function BarangayHome() {
  const { profile } = useAuth();
  const [apps, setApps] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!profile?.barangayId) return;
    return subscribeBarangayApplications(profile.barangayId, setApps);
  }, [profile?.barangayId]);

  if (!profile?.barangayId) {
    return (
      <View style={ui.screen}>
        <View style={ui.content}>
          <Text style={ui.title}>No barangay assigned</Text>
          <Text style={ui.muted}>
            Your account is not assigned to a barangay yet. Ask the System Administrator to assign one.
          </Text>
        </View>
      </View>
    );
  }

  const verify = async (app) => {
    if (busyId) return;
    setBusyId(app.id);
    try {
      await verifyByBarangay(app);
    } catch (e) {
      notify('Error', e.message);
    }
    setBusyId(null);
  };

  const unverified = apps.filter((a) => !a.barangayVerified).length;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.title}>{profile.barangayName ? `Barangay ${profile.barangayName}` : 'Barangay Verification'}</Text>
      <Text style={ui.muted}>
        {unverified} application{unverified === 1 ? '' : 's'} waiting for verification.
      </Text>

      <View style={{ marginTop: 14 }}>
        {apps.length === 0 && <Text style={ui.muted}>No applications from your barangay.</Text>}
        {apps.map((item) => (
          <View key={item.id} style={ui.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text, flex: 1 }}>
                #{shortId(item.id)} {'\u2013'} {item.serviceName}
              </Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={[ui.muted, { fontSize: 12, marginTop: 6 }]}>{formatTs(item.dateSubmitted)}</Text>
            {item.barangayVerified ? (
              <Text style={{ color: COLORS.primary, fontWeight: '700', marginTop: 8 }}>{'\u2713'} Verified</Text>
            ) : (
              <Pressable
                style={[ui.button, busyId === item.id && ui.buttonDisabled]}
                disabled={busyId === item.id}
                onPress={() => verify(item)}
              >
                {busyId === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={ui.buttonText}>VERIFY RESIDENT</Text>
                )}
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}