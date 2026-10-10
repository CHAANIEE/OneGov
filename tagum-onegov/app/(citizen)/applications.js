import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeMyApplications } from '../../src/services/applications';
import { ui, COLORS } from '../../src/lib/ui';
import { STEPS } from '../../src/lib/helpers';
import { refNo, shortDate } from '../../src/lib/display';
import StatusBadge from '../../src/components/StatusBadge';

export default function MyApplications() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState('All');

  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (rawQ || '').trim().toLowerCase();

  useEffect(() => {
    if (!profile) return;
    return subscribeMyApplications(profile.uid, setApps);
  }, [profile?.uid]);

  const counts = useMemo(() => {
    const c = { All: apps.length };
    STEPS.forEach((s) => { c[s] = apps.filter((a) => a.status === s).length; });
    return c;
  }, [apps]);

  const visible = apps
    .filter((a) => filter === 'All' || a.status === filter)
    .filter(
      (a) =>
        !term || `${a.serviceName || ''} ${a.status || ''} ${refNo(a)}`.toLowerCase().includes(term)
    );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.title}>My Applications</Text>
      <Text style={ui.muted}>Track every application you have submitted.</Text>

      <View style={[ui.row, { marginTop: 14, marginBottom: 14 }]}>
        {['All', ...STEPS].map((s) => {
          const active = filter === s;
          return (
            <Pressable key={s} onPress={() => setFilter(s)} style={[ui.chip, active && ui.chipActive]}>
              <Text style={[ui.chipText, active && ui.chipTextActive]}>
                {s} ({counts[s] || 0})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 && (
        <Text style={ui.muted}>
          {apps.length === 0 ? 'No applications yet. Choose a service to get started.' : 'No applications in this list.'}
        </Text>
      )}

      {visible.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => router.push(`/(citizen)/track/${a.id}`)}
          style={({ hovered }) => [ui.card, hovered && { borderColor: COLORS.primary }]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontWeight: '800', color: COLORS.text, flex: 1 }}>{a.serviceName}</Text>
            <StatusBadge status={a.status} />
          </View>
          <Text style={[ui.muted, { marginTop: 6 }]}>
            {refNo(a)} {'\u00B7'} {shortDate(a.dateSubmitted)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}