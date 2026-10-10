import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';
import { confirmAction } from '../../src/lib/confirm';
import { A, k, useCollection, Loading, PageHeader, Panel, Btn } from '../../src/components/AdminKit';

// Starting services based on the project document
const DEFAULT_SERVICES = [
  {
    serviceName: 'Business Permit (New / Renewal)',
    description: 'Apply for a new business permit or renew an existing one.',
    requirements:
      'Barangay Clearance; DTI/SEC/CDA Registration; Lease Contract or Tax Declaration; Fire Safety Inspection Certificate; Sanitary Permit',
    feeType: 'Assessed',
  },
  {
    serviceName: 'Birth Certificate Request',
    description: 'Request a copy of a birth certificate from the City Civil Registrar.',
    requirements: 'Valid ID; Full name of registrant; Date and place of birth; Purpose of request',
    feeType: 'Assessed',
  },
  {
    serviceName: 'Marriage Certificate Request',
    description: 'Request a copy of a marriage certificate from the City Civil Registrar.',
    requirements: 'Valid ID; Names of spouses; Date and place of marriage; Purpose of request',
    feeType: 'Assessed',
  },
  {
    serviceName: 'Death Certificate Request',
    description: 'Request a copy of a death certificate from the City Civil Registrar.',
    requirements:
      'Valid ID; Full name of the deceased; Date and place of death; Relationship to the deceased; Purpose of request',
    feeType: 'Assessed',
  },
];

export default function Services() {
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const services = useCollection('services');

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [req, setReq] = useState('');
  const [fee, setFee] = useState('');
  const [busy, setBusy] = useState(false);

  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (rawQ || '').trim().toLowerCase();

  const contentWidth = width >= 900 ? width - 250 : width;
  const twoCol = contentWidth >= 1000;

  const list = useMemo(
    () =>
      [...services.items]
        .sort((a, b) => (a.serviceName || '').localeCompare(b.serviceName || ''))
        .filter((x) => !term || `${x.serviceName || ''} ${x.description || ''}`.toLowerCase().includes(term)),
    [services.items, term]
  );

  if (!services.ready) return <Loading />;

  const reset = () => {
    setEditing(null);
    setName('');
    setDesc('');
    setReq('');
    setFee('');
  };

  const startEdit = (sv) => {
    setEditing(sv.id);
    setName(sv.serviceName || '');
    setDesc(sv.description || '');
    setReq(sv.requirements || '');
    setFee(sv.feeType || '');
  };

  const save = async () => {
    if (!name.trim()) return notify('Missing name', 'Enter a service name.');
    setBusy(true);
    try {
      const data = {
        serviceName: name.trim(),
        description: desc.trim(),
        requirements: req.trim(),
        feeType: fee.trim() || 'Assessed',
      };
      if (editing) await updateDoc(doc(db, 'services', editing), data);
      else await addDoc(collection(db, 'services'), data);
      reset();
    } catch (e) {
      notify('Error', e.message);
    }
    setBusy(false);
  };

  const remove = (sv) =>
    confirmAction('Delete service', `Delete "${sv.serviceName}"? Existing applications keep their service name.`, async () => {
      try {
        await deleteDoc(doc(db, 'services', sv.id));
        if (editing === sv.id) reset();
      } catch (e) {
        notify('Error', e.message);
      }
    });

  const seed = async () => {
    setBusy(true);
    try {
      for (const sv of DEFAULT_SERVICES) await addDoc(collection(db, 'services'), sv);
    } catch (e) {
      notify('Error', e.message);
    }
    setBusy(false);
  };

  const formPanel = (
    <Panel title={editing ? 'Edit service' : 'Add a service'} icon={editing ? 'create-outline' : 'add-circle-outline'}>
      <Text style={k.label}>Service name</Text>
      <TextInput placeholder="e.g. Business Permit" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} style={k.input} />
      <Text style={k.label}>Description</Text>
      <TextInput placeholder="Short line shown on the card" placeholderTextColor="#9ca3af" value={desc} onChangeText={setDesc} style={k.input} />
      <Text style={k.label}>Requirements (separate with semicolons)</Text>
      <TextInput
        placeholder="Barangay Clearance; DTI Registration"
        placeholderTextColor="#9ca3af"
        value={req}
        onChangeText={setReq}
        multiline
        style={[k.input, { height: 90, paddingTop: 12, textAlignVertical: 'top' }]}
      />
      <Text style={k.label}>Fee type</Text>
      <TextInput placeholder="Assessed / Fixed" placeholderTextColor="#9ca3af" value={fee} onChangeText={setFee} style={k.input} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Btn label={editing ? 'SAVE CHANGES' : 'ADD SERVICE'} onPress={save} busy={busy} />
        </View>
        {editing && <Btn kind="outline" label="Cancel" onPress={reset} />}
      </View>
    </Panel>
  );

  const listPanel = (
    <Panel title={`Services (${services.items.length})`} icon="document-text-outline">
      {services.items.length === 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[k.muted, { marginBottom: 10 }]}>
            No services yet. Add the default business permit and civil registration services, or add your own.
          </Text>
          <Btn kind="outline" label="ADD DEFAULT SERVICES" onPress={seed} busy={busy} />
        </View>
      )}
      {list.map((sv) => (
        <View key={sv.id} style={s.item}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemTitle}>{sv.serviceName}</Text>
            {!!sv.description && <Text style={k.muted}>{sv.description}</Text>}
            {!!sv.requirements && (
              <Text style={[k.muted, { marginTop: 4 }]} numberOfLines={3}>
                Requirements: {sv.requirements}
              </Text>
            )}
            {!!sv.feeType && <Text style={s.tag}>{sv.feeType}</Text>}
          </View>
          <View style={{ gap: 6 }}>
            <Btn small kind="outline" label="Edit" icon="create-outline" onPress={() => startEdit(sv)} />
            <Btn small kind="danger" label="Delete" icon="trash-outline" onPress={() => remove(sv)} />
          </View>
        </View>
      ))}
      {services.items.length > 0 && list.length === 0 && <Text style={k.muted}>No services match your search.</Text>}
    </Panel>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.container}>
        <PageHeader
          icon="document-text-outline"
          title="Services & Requirements"
          subtitle="Manage the services citizens can apply for and the documents they need."
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
    gap: 12,
    borderWidth: 1.5,
    borderColor: A.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  itemTitle: { fontSize: 15, fontWeight: '800', color: A.text, marginBottom: 2 },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: A.primary,
    backgroundColor: A.accent,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    overflow: 'hidden',
  },
});