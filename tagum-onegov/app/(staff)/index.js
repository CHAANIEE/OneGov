import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeAllApplications } from '../../src/services/applications';
import { ui, COLORS } from '../../src/lib/ui';
import { shortId, formatTs, STEPS } from '../../src/lib/helpers';
import StatusBadge from '../../src/components/StatusBadge';

export default function StaffQueue() {
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => subscribeAllApplications(setApps), []);

  const counts = useMemo(() => {
    const c = { All: apps.length };
    STEPS.forEach((s) => { c[s] = apps.filter((a) => a.status === s).length; });
    return c;
  }, [apps]);

  const visible = filter === 'All' ? apps : apps.filter((a) => a.status === filter);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Text style={ui.title}>Review Queue</Text>
      <Text style={ui.muted}>Applications submitted by citizens.</Text>

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

      {visible.length === 0 && <Text style={ui.muted}>No applications in this list.</Text>}

      {visible.map((item) => (
        <Pressable
          key={item.id}
          style={({ hovered }) => [ui.card, hovered && { borderColor: COLORS.primary }]}
          onPress={() => router.push(`/(staff)/review/${item.id}`)}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text, flex: 1 }}>
              #{shortId(item.id)} {'\u2013'} {item.serviceName}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={[ui.muted, { fontSize: 12, marginTop: 6 }]}>{formatTs(item.dateSubmitted)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}