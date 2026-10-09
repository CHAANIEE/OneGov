import { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/lib/firebase';
import { simulatePayment, getLatestAssessment } from '../../../src/services/payments';
import { ui, PRIMARY } from '../../../src/lib/ui';
import { notify, shortId, STEPS } from '../../../src/lib/helpers';

export default function Track() {
  const { id } = useLocalSearchParams();
  const [app, setApp] = useState(null);
  const [amountDue, setAmountDue] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'applications', id), (snap) => {
      if (snap.exists()) setApp({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (app && ['For Payment', 'Paid'].includes(app.status)) {
      getLatestAssessment(app).then((a) => setAmountDue(a ? a.amount : null)).catch(() => {});
    }
  }, [app?.status]);

  if (!app) return null;
  const current = STEPS.indexOf(app.status);

  const pay = async () => {
    setPaying(true);
    try {
      const ref = await simulatePayment(app);
      notify('Payment simulated', `Reference No: ${ref}\n(No real money was charged.)`);
    } catch (e) {
      notify('Error', e.message);
    }
    setPaying(false);
  };

  return (
    <ScrollView style={ui.screen}>
      <Text style={ui.title}>Application #{shortId(app.id)}</Text>
      <Text>{app.serviceName}</Text>
      {app.barangayVerified && <Text style={{ color: 'green', marginTop: 4 }}>✓ Verified by barangay</Text>}

      <Text style={ui.h2}>Progress</Text>
      {STEPS.map((s, i) => (
        <Text key={s} style={{ marginVertical: 4, fontSize: 16, color: i <= current ? PRIMARY : '#aaa' }}>
          {i <= current ? '●' : '○'} {s}
        </Text>
      ))}

      {amountDue !== null && (
        <Text style={[ui.h2, { color: '#000' }]}>Assessed fee: ₱{Number(amountDue).toFixed(2)}</Text>
      )}

      {app.status === 'For Payment' && (
        <Pressable onPress={pay} disabled={paying} style={ui.button}>
          <Text style={ui.buttonText}>{paying ? 'PROCESSING...' : 'PAY (SIMULATED)'}</Text>
        </Pressable>
      )}
      <Text style={[ui.muted, { marginTop: 16 }]}>Prototype only. No real payments are processed.</Text>
    </ScrollView>
  );
}