import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../../../src/lib/firebase';
import { setStatus, verifyDocument, createAssessment } from '../../../src/services/assessments';
import { ui, COLORS } from '../../../src/lib/ui';
import { notify, shortId, formatTs } from '../../../src/lib/helpers';
import StatusBadge from '../../../src/components/StatusBadge';

const NEXT_STATUSES = ['Under Review', 'Approved', 'For Release', 'Completed'];

export default function Review() {
  const { id } = useLocalSearchParams();
  const [app, setApp] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [docs, setDocs] = useState([]);
  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onErr = (e) => console.warn(e.message);
    const u1 = onSnapshot(
      doc(db, 'applications', id),
      (snap) => { if (snap.exists()) setApp({ id: snap.id, ...snap.data() }); },
      onErr
    );
    const u2 = onSnapshot(
      query(collection(db, 'documents'), where('applicationId', '==', id)),
      (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onErr
    );
    const u3 = onSnapshot(
      query(collection(db, 'payments'), where('applicationId', '==', id)),
      (snap) => setPaid(!snap.empty),
      onErr
    );
    return () => { u1(); u2(); u3(); };
  }, [id]);

  // Applicant details (name, phone, barangay)
  useEffect(() => {
    if (!app?.userId) return;
    getDoc(doc(db, 'users', app.userId))
      .then((s) => setApplicant(s.exists() ? s.data() : null))
      .catch(() => {});
  }, [app?.userId]);

  if (!app) {
    return (
      <View style={[ui.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const openFile = async (d) => {
    try {
      Linking.openURL(await getDownloadURL(ref(storage, d.filePath)));
    } catch (e) {
      notify('Cannot open file', e.message);
    }
  };

  const verify = async (d, result) => {
    try { await verifyDocument(d.id, result); } catch (e) { notify('Error', e.message); }
  };

  const assess = async () => {
    if (busy) return;
    if (paid) return notify('Not allowed', 'This application has already been paid.');
    const n = Number(amount);
    if (!n || n <= 0) return notify('Invalid amount', 'Enter a number greater than 0.');
    setBusy(true);
    try {
      await createAssessment(app, n);
      setAmount('');
      notify('Assessment saved', 'The citizen has been notified.');
    } catch (e) {
      notify('Error', e.message);
    }
    setBusy(false);
  };

  const changeStatus = async (s) => {
    if (s === app.status) return;
    try { await setStatus(app, s); } catch (e) { notify('Error', e.message); }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Text style={ui.title}>#{shortId(app.id)} {'\u2013'} {app.serviceName}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StatusBadge status={app.status} />
        <Text style={ui.muted}>
          {formatTs(app.dateSubmitted)} {'\u00B7'} Barangay verified: {app.barangayVerified ? 'Yes' : 'No'}
        </Text>
      </View>

      <Text style={ui.h2}>Applicant</Text>
      <View style={ui.card}>
        {applicant ? (
          <>
            <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text }}>{applicant.fullName}</Text>
            {!!applicant.email && <Text style={ui.muted}>{applicant.email}</Text>}
            {!!applicant.phone && <Text style={ui.muted}>{applicant.phone}</Text>}
            {!!applicant.barangayName && <Text style={ui.muted}>Brgy. {applicant.barangayName}</Text>}
          </>
        ) : (
          <Text style={ui.muted}>Applicant details are not available.</Text>
        )}
      </View>

      <Text style={ui.h2}>Submitted Documents</Text>
      {docs.length === 0 && <Text style={ui.muted}>No documents uploaded.</Text>}
      {docs.map((d) => (
        <View key={d.id} style={ui.card}>
          <Text style={{ fontWeight: '700', color: COLORS.text }}>{d.documentName}</Text>
          <Text style={ui.muted}>Verification: {d.verificationStatus}</Text>
          <View style={[ui.row, { marginTop: 10 }]}>
            <Pressable style={ui.chip} onPress={() => openFile(d)}><Text style={ui.chipText}>View</Text></Pressable>
            <Pressable style={ui.chip} onPress={() => verify(d, 'Verified')}><Text style={ui.chipText}>Verify</Text></Pressable>
            <Pressable style={ui.chip} onPress={() => verify(d, 'Rejected')}><Text style={ui.chipText}>Reject</Text></Pressable>
          </View>
        </View>
      ))}

      <Text style={ui.h2}>Fee Assessment</Text>
      {paid ? (
        <Text style={ui.muted}>This application has been paid. The fee can no longer be changed.</Text>
      ) : (
        <>
          <TextInput
            placeholder="Amount (PHP)"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={ui.input}
          />
          <Pressable onPress={assess} disabled={busy} style={[ui.button, busy && ui.buttonDisabled]}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={ui.buttonText}>SAVE ASSESSMENT (sets "For Payment")</Text>
            )}
          </Pressable>
        </>
      )}

      <Text style={ui.h2}>Update Status</Text>
      <View style={ui.row}>
        {NEXT_STATUSES.map((s) => (
          <Pressable key={s} onPress={() => changeStatus(s)} style={[ui.chip, app.status === s && ui.chipActive]}>
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