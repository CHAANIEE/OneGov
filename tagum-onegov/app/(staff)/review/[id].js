import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../../../src/lib/firebase';
import { setStatus, verifyDocument, createAssessment } from '../../../src/services/assessments';
import { ui } from '../../../src/lib/ui';
import { notify, shortId } from '../../../src/lib/helpers';

const NEXT_STATUSES = ['Under Review', 'Approved', 'For Release', 'Completed'];

export default function Review() {
  const { id } = useLocalSearchParams();
  const [app, setApp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const u1 = onSnapshot(doc(db, 'applications', id), (snap) => {
      if (snap.exists()) setApp({ id: snap.id, ...snap.data() });
    });
    const q = query(collection(db, 'documents'), where('applicationId', '==', id));
    const u2 = onSnapshot(q, (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [id]);

  if (!app) return null;

  const openFile = async (d) => {
    try {
      Linking.openURL(await getDownloadURL(ref(storage, d.filePath)));
    } catch (e) {
      notify('Cannot open file', e.message);
    }
  };

  const assess = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return notify('Invalid amount', 'Enter a number greater than 0.');
    try {
      await createAssessment(app, n);
      setAmount('');
      notify('Assessment saved', 'The citizen has been notified.');
    } catch (e) {
      notify('Error', e.message);
    }
  };

  const changeStatus = async (s) => {
    try { await setStatus(app, s); } catch (e) { notify('Error', e.message); }
  };

  return (
    <ScrollView style={ui.screen}>
      <Text style={ui.title}>#{shortId(app.id)} – {app.serviceName}</Text>
      <Text>Current status: <Text style={{ fontWeight: '700' }}>{app.status}</Text></Text>
      <Text>Barangay verified: {app.barangayVerified ? 'Yes' : 'No'}</Text>

      <Text style={ui.h2}>Submitted Documents</Text>
      {docs.length === 0 && <Text style={ui.muted}>No documents uploaded.</Text>}
      {docs.map((d) => (
        <View key={d.id} style={ui.card}>
          <Text style={{ fontWeight: '600' }}>{d.documentName}</Text>
          <Text style={ui.muted}>Verification: {d.verificationStatus}</Text>
          <View style={[ui.row, { marginTop: 8 }]}>
            <Pressable style={ui.chip} onPress={() => openFile(d)}><Text style={ui.chipText}>View</Text></Pressable>
            <Pressable style={ui.chip} onPress={() => verifyDocument(d.id, 'Verified')}><Text style={ui.chipText}>Verify</Text></Pressable>
            <Pressable style={ui.chip} onPress={() => verifyDocument(d.id, 'Rejected')}><Text style={ui.chipText}>Reject</Text></Pressable>
          </View>
        </View>
      ))}

      <Text style={ui.h2}>Fee Assessment</Text>
      <TextInput placeholder="Amount (PHP)" keyboardType="numeric" value={amount}
        onChangeText={setAmount} style={ui.input} />
      <Pressable onPress={assess} style={ui.button}>
        <Text style={ui.buttonText}>SAVE ASSESSMENT (sets "For Payment")</Text>
      </Pressable>

      <Text style={ui.h2}>Update Status</Text>
      <View style={ui.row}>
        {NEXT_STATUSES.map((s) => (
          <Pressable key={s} onPress={() => changeStatus(s)}
            style={[ui.chip, app.status === s && ui.chipActive]}>
            <Text style={[ui.chipText, app.status === s && ui.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[ui.muted, { marginTop: 8 }]}>
        "Paid" is set automatically when the citizen completes the simulated payment.
      </Text>
    </ScrollView>
  );
}