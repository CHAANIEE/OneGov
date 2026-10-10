import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Linking, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../../../src/lib/firebase';
import { notify } from '../../../src/lib/helpers';
import { refNo } from '../../../src/lib/display';
import StatusBadge from '../../../src/components/StatusBadge';
import { A, k, Loading, PageHeader, Panel, Btn, tsMs, fmtDateTime } from '../../../src/components/AdminKit';

export default function AdminApplication() {
  const { id } = useLocalSearchParams();
  const [app, setApp] = useState(null);
  const [missing, setMissing] = useState(false);
  const [applicant, setApplicant] = useState(null);
  const [docs, setDocs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const onErr = (e) => console.warn(e.message);
    const list = (setter) => (snap) => setter(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    const u1 = onSnapshot(
      doc(db, 'applications', id),
      (snap) => {
        if (snap.exists()) { setApp({ id: snap.id, ...snap.data() }); setMissing(false); }
        else setMissing(true);
      },
      (e) => { onErr(e); setMissing(true); }
    );
    const u2 = onSnapshot(query(collection(db, 'documents'), where('applicationId', '==', id)), list(setDocs), onErr);
    const u3 = onSnapshot(query(collection(db, 'assessments'), where('applicationId', '==', id)), list(setAssessments), onErr);
    const u4 = onSnapshot(query(collection(db, 'payments'), where('applicationId', '==', id)), list(setPayments), onErr);
    return () => { u1(); u2(); u3(); u4(); };
  }, [id]);

  useEffect(() => {
    if (!app?.userId) return;
    getDoc(doc(db, 'users', app.userId))
      .then((s) => setApplicant(s.exists() ? s.data() : null))
      .catch(() => {});
  }, [app?.userId]);

  if (missing) {
    return (
      <View style={{ flex: 1, backgroundColor: A.bg, padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: A.text }}>Application not found</Text>
      </View>
    );
  }
  if (!app) return <Loading />;

  const latest = (list, field) => [...list].sort((a, b) => tsMs(b[field]) - tsMs(a[field]))[0];
  const assessment = latest(assessments, 'assessedAt');
  const payment = latest(payments, 'paidAt');

  const openFile = async (d) => {
    try {
      Linking.openURL(await getDownloadURL(ref(storage, d.filePath)));
    } catch (e) {
      notify('Cannot open file', e.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll}>
      <View style={s.container}>
        <PageHeader
          icon="document-text-outline"
          title={refNo(app)}
          subtitle={app.serviceName}
          right={<StatusBadge status={app.status} />}
        />

        <View style={s.grid}>
          <View style={s.col}>
            <Panel title="Application" icon="information-circle-outline">
              <Row label="Service" value={app.serviceName} />
              <Row label="Submitted" value={fmtDateTime(tsMs(app.dateSubmitted))} />
              <Row label="Barangay verified" value={app.barangayVerified ? 'Yes' : 'No'} />
              <Row
                label="Fee assessment"
                value={assessment ? `\u20B1${Number(assessment.amount).toFixed(2)}` : 'Not assessed yet'}
              />
              <Row
                label="Payment (simulated)"
                value={payment ? `${payment.referenceNo} \u00B7 ${fmtDateTime(tsMs(payment.paidAt))}` : 'No payment yet'}
              />
            </Panel>

            <Panel title="Applicant" icon="person-outline">
              {applicant ? (
                <>
                  <Row label="Name" value={applicant.fullName} />
                  <Row label="Email" value={applicant.email} />
                  <Row label="Mobile" value={applicant.phone || '-'} />
                  <Row label="Barangay" value={applicant.barangayName || '-'} />
                </>
              ) : (
                <Text style={k.muted}>Applicant details are not available.</Text>
              )}
            </Panel>
          </View>

          <View style={s.col}>
            <Panel title={`Documents (${docs.length})`} icon="attach-outline">
              {docs.length === 0 && <Text style={k.muted}>No documents uploaded.</Text>}
              {docs.map((d) => (
                <View key={d.id} style={s.docRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.docName} numberOfLines={1}>{d.documentName}</Text>
                    <Text style={k.muted}>Verification: {d.verificationStatus}</Text>
                  </View>
                  <Btn small kind="outline" label="View" onPress={() => openFile(d)} />
                </View>
              ))}
            </Panel>
            <Text style={k.muted}>
              This page is read-only. City staff review documents, assess fees and update the status from the Review Queue.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: 1200, alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  col: { flexGrow: 1, flexBasis: 340 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: A.border,
  },
  rowLabel: { fontSize: 13, color: A.muted, width: 140 },
  rowValue: { flex: 1, fontSize: 14, fontWeight: '600', color: A.text, textAlign: 'right' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: A.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  docName: { fontSize: 14, fontWeight: '700', color: A.text },
});