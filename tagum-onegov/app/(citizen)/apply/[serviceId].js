import { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getService, getBarangays, createApplication } from '../../../src/services/applications';
import { pickAndUpload } from '../../../src/services/documents';
import { ui } from '../../../src/lib/ui';
import { notify } from '../../../src/lib/helpers';

export default function Apply() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  const [service, setService] = useState(null);
  const [barangays, setBarangays] = useState([]);
  const [barangayId, setBarangayId] = useState(null);
  const [appId, setAppId] = useState(null);
  const [uploaded, setUploaded] = useState([]);

  useEffect(() => {
    getService(serviceId).then(setService).catch((e) => notify('Error', e.message));
    getBarangays().then(setBarangays).catch(() => {});
  }, [serviceId]);

  const submit = async () => {
    try {
      setAppId(await createApplication(service, barangayId));
    } catch (e) {
      notify('Error', e.message);
    }
  };

  const upload = async () => {
    try {
      const name = await pickAndUpload(appId);
      if (name) setUploaded((u) => [...u, name]);
    } catch (e) {
      notify('Upload failed', e.message);
    }
  };

  if (!service) return null;

  return (
    <ScrollView style={ui.screen}>
      <Text style={ui.title}>{service.serviceName}</Text>
      <Text>Requirements: {service.requirements}</Text>

      {!appId ? (
        <>
          <Text style={ui.h2}>Your barangay (optional)</Text>
          <Text style={{ flexDirection: 'row' }} />
          <ScrollViewChips
            items={barangays}
            selected={barangayId}
            onSelect={(id) => setBarangayId(id === barangayId ? null : id)}
          />
          <Pressable onPress={submit} style={ui.button}>
            <Text style={ui.buttonText}>SUBMIT APPLICATION</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={ui.h2}>Application submitted ✓</Text>
          <Text>Upload your requirements:</Text>
          <Pressable onPress={upload} style={ui.buttonOutline}>
            <Text style={ui.buttonOutlineText}>+ Upload document</Text>
          </Pressable>
          {uploaded.map((u, i) => <Text key={i} style={{ marginTop: 6 }}>✓ {u}</Text>)}
          <Pressable onPress={() => router.replace(`/(citizen)/track/${appId}`)} style={ui.button}>
            <Text style={ui.buttonText}>GO TO TRACKING</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

// Small helper: selectable barangay chips
function ScrollViewChips({ items, selected, onSelect }) {
  const { View } = require('react-native');
  return (
    <View style={ui.row}>
      {items.map((b) => (
        <Pressable key={b.id} onPress={() => onSelect(b.id)}
          style={[ui.chip, selected === b.id && ui.chipActive]}>
          <Text style={[ui.chipText, selected === b.id && ui.chipTextActive]}>{b.barangayName}</Text>
        </Pressable>
      ))}
    </View>
  );
}