import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { collection, addDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';
import { confirmAction } from '../../src/lib/confirm';
import { A, k, useCollection, Loading, PageHeader, Panel, Btn } from '../../src/components/AdminKit';

// Tagum City's 23 barangays
const TAGUM_BARANGAYS = [
  'Apokon', 'Bincungan', 'Busaon', 'Canocotan', 'Cuambogan', 'La Filipina',
  'Liboganon', 'Madaum', 'Magdum', 'Magugpo East', 'Magugpo North',
  'Magugpo Poblacion', 'Magugpo South', 'Magugpo West', 'Mankilam',
  'New Balamban', 'Nueva Fuerza', 'Pagsabangan', 'Pandapan', 'San Agustin',
  'San Isidro', 'San Miguel', 'Visayan Village',
];

export default function Barangays() {
  const { width } = useWindowDimensions();
  const barangays = useCollection('barangays');
  const users = useCollection('users');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const contentWidth = width >= 900 ? width - 250 : width;
  const twoCol = contentWidth >= 1000;

  const list = useMemo(
    () => [...barangays.items].sort((a, b) => (a.barangayName || '').localeCompare(b.barangayName || '')),
    [barangays.items]
  );

  if (!barangays.ready) return <Loading />;

  const residents = (id) => users.items.filter((u) => u.barangayId === id).length;

  const add = async () => {
    if (!name.trim()) return notify('Missing name', 'Enter a barangay name.');
    setBusy(true);
    try {
      await addDoc(collection(db, 'barangays'), { barangayName: name.trim(), address: address.trim() });
      setName('');
      setAddress('');
    } catch (e) {
      notify('Error', e.message);
    }
    setBusy(false);
  };

  const seed = async () => {
    setBusy(true);
    try {
      const batch = writeBatch(db);
      TAGUM_BARANGAYS.forEach((n) => batch.set(doc(collection(db, 'barangays')), { barangayName: n, address: '' }));
      await batch.commit();
    } catch (e) {
      notify('Error', e.message);
    }
    setBusy(false);
  };

  const remove = (b) =>
    confirmAction('Delete barangay', `Delete "${b.barangayName}"? Users already assigned to it keep the saved name.`, async () => {
      try {
        await deleteDoc(doc(db, 'barangays', b.id));
      } catch (e) {
        notify('Error', e.message);
      }
    });

  const formPanel = (
    <Panel title="Add a barangay" icon="add-circle-outline">
      <Text style={k.label}>Barangay name</Text>
      <TextInput placeholder="e.g. Apokon" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} style={k.input} />
      <Text style={k.label}>Address (optional)</Text>
      <TextInput placeholder="Barangay hall or location" placeholderTextColor="#9ca3af" value={address} onChangeText={setAddress} style={k.input} />
      <Btn label="ADD BARANGAY" onPress={add} busy={busy} />
    </Panel>
  );

  const listPanel = (
    <Panel title={`Barangays (${barangays.items.length})`} icon="business-outline">
      {list.length === 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[k.muted, { marginBottom: 10 }]}>No barangays yet. Add Tagum City's 23 barangays in one tap.</Text>
          <Btn kind="outline" label="ADD TAGUM CITY BARANGAYS" onPress={seed} busy={busy} />
        </View>
      )}
      {list.map((b) => (
        <View key={b.id} style={s.item}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemTitle}>{b.barangayName}</Text>
            <Text style={k.muted}>
              {residents(b.id)} registered resident{residents(b.id) === 1 ? '' : 's'}
              {b.address ? ` \u00B7 ${b.address}` : ''}
            </Text>
          </View>
          <Btn small kind="danger" label="Delete" icon="trash-outline" onPress={() => remove(b)} />
        </View>
      ))}
    </Panel>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.container}>
        <PageHeader
          icon="business-outline"
          title="Barangays"
          subtitle="Barangays that citizens can pick and barangay personnel can be assigned to."
        />
        <View style={twoCol ? { flexDirection: 'row', gap: 20, alignItems: 'flex-start' } : null}>
          <View style={twoCol ? { flex: 1.4 } : null}>{listPanel}</View>
          <View style={twoCol ? { flex: 1 } : null}>{formPanel}</View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: 1400, alignSelf: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: A.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  itemTitle: { fontSize: 15, fontWeight: '800', color: A.text, marginBottom: 2 },
});