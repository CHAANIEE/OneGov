import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { collection, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';
import { confirmAction } from '../../src/lib/confirm';
import { A, k, useCollection, Loading, PageHeader, Panel, Btn, tsMs, fmtDateTime } from '../../src/components/AdminKit';

export default function Announcements() {
  const { width } = useWindowDimensions();
  const announcements = useCollection('announcements');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const contentWidth = width >= 900 ? width - 250 : width;
  const twoCol = contentWidth >= 1000;

  const list = useMemo(
    () => [...announcements.items].sort((a, b) => (tsMs(b.createdAt) || Date.now()) - (tsMs(a.createdAt) || Date.now())),
    [announcements.items]
  );

  if (!announcements.ready) return <Loading />;

  const publish = async () => {
    if (!title.trim()) return notify('Missing title', 'Enter the announcement text.');
    setBusy(true);
    try {
      await addDoc(collection(db, 'announcements'), { title: title.trim(), createdAt: serverTimestamp() });
      setTitle('');
    } catch (e) {
      notify('Error', e.message);
    }
    setBusy(false);
  };

  const remove = (n) =>
    confirmAction('Delete announcement', `Delete "${n.title}"?`, async () => {
      try {
        await deleteDoc(doc(db, 'announcements', n.id));
      } catch (e) {
        notify('Error', e.message);
      }
    });

  const formPanel = (
    <Panel title="Publish an announcement" icon="megaphone-outline">
      <Text style={k.label}>Announcement</Text>
      <TextInput
        placeholder="e.g. Online Business Permit Renewal Now Available"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
        multiline
        style={[k.input, { height: 90, paddingTop: 12, textAlignVertical: 'top' }]}
      />
      <Btn label="PUBLISH" onPress={publish} busy={busy} />
      <Text style={[k.muted, { marginTop: 10 }]}>
        The latest four announcements are shown on every citizen's dashboard.
      </Text>
    </Panel>
  );

  const listPanel = (
    <Panel title={`Announcements (${announcements.items.length})`} icon="list-outline">
      {list.length === 0 && <Text style={k.muted}>No announcements yet.</Text>}
      {list.map((n) => (
        <View key={n.id} style={s.item}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemTitle}>{n.title}</Text>
            <Text style={k.muted}>{fmtDateTime(tsMs(n.createdAt))}</Text>
          </View>
          <Btn small kind="danger" label="Delete" icon="trash-outline" onPress={() => remove(n)} />
        </View>
      ))}
    </Panel>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.container}>
        <PageHeader
          icon="megaphone-outline"
          title="Announcements"
          subtitle="Publish city announcements for citizens."
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
  itemTitle: { fontSize: 15, fontWeight: '700', color: A.text, marginBottom: 2 },
});