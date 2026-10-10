import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getServices } from '../../src/services/applications';
import { ui, COLORS } from '../../src/lib/ui';
import { serviceIcon, TILE_COLORS } from '../../src/lib/display';

export default function Services() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [services, setServices] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (rawQ || '').trim().toLowerCase();

  const contentWidth = width >= 900 ? width - 250 : width;
  const cols = contentWidth >= 1000 ? 3 : contentWidth >= 600 ? 2 : 1;

  useEffect(() => {
    getServices()
      .then((list) => { setServices(list); setLoaded(true); })
      .catch((e) => { console.warn(e.message); setLoaded(true); });
  }, []);

  const shown = useMemo(
    () =>
      term
        ? services.filter((s) => `${s.serviceName || ''} ${s.description || ''}`.toLowerCase().includes(term))
        : services,
    [services, term]
  );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={[ui.content, { maxWidth: 1200 }]}>
      <Text style={ui.title}>Services</Text>
      <Text style={ui.muted}>Choose a service to apply online.</Text>

      {loaded && shown.length === 0 && (
        <Text style={[ui.muted, { marginTop: 16 }]}>
          {term ? 'No services match your search.' : 'No services available right now.'}
        </Text>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 14 }}>
        {shown.map((sv, i) => {
          const tile = TILE_COLORS[i % TILE_COLORS.length];
          return (
            <View key={sv.id} style={{ width: `${100 / cols}%`, padding: 6 }}>
              <Pressable
                onPress={() => router.push(`/(citizen)/apply/${sv.id}`)}
                style={({ hovered }) => [
                  ui.card,
                  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 92, marginBottom: 0 },
                  hovered && { borderColor: COLORS.primary },
                ]}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: tile.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={serviceIcon(sv.serviceName)} size={24} color={tile.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }} numberOfLines={2}>
                    {sv.serviceName}
                  </Text>
                  {!!sv.description && (
                    <Text style={[ui.muted, { fontSize: 12, marginTop: 2 }]} numberOfLines={2}>
                      {sv.description}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}