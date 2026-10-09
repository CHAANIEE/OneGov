import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { ui } from '../../src/lib/ui';
import { notify } from '../../src/lib/helpers';

const ROLES = ['citizen', 'staff', 'barangay', 'admin'];

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [svcName, setSvcName] = useState('');
  const [svcReq, setSvcReq] = useState('');
  const [svcFee, setSvcFee] = useState('');
  const [brgyName, setBrgyName] = useState('');

  useEffect(() => {
    const map = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const u1 = onSnapshot(collection(db, 'users'), (s) => setUsers(map(s)));
    const u2 = onSnapshot(collection(db, 'services'), (s) => setServices(map(s)));
    const u3 = onSnapshot(collection(db, 'barangays'), (s) => setBarangays(map(s)));
    return () => { u1(); u2(); u3(); };
  }, []);

  const update = async (path, id, data) => {
    try { await updateDoc(doc(db, path, id), data); } catch (e) { notify('Error', e.message); }
  };

  const addService = async () => {
    if (!svcName.trim()) return notify('Missing name', 'Enter a service name.');
    try {
      await addDoc(collection(db, 'services'), {
        serviceName: svcName.trim(), description: '', requirements: svcReq.trim(), feeType: svcFee.trim() || 'Assessed',
      });
      setSvcName(''); setSvcReq(''); setSvcFee('');
    } catch (e) { notify('Error', e.message); }
  };

  const addBarangay = async () => {
    if (!brgyName.trim()) return notify('Missing name', 'Enter a barangay name.');
    try {
      await addDoc(collection(db, 'barangays'), { barangayName: brgyName.trim(), address: '' });
      setBrgyName('');
    } catch (e) { notify('Error', e.message); }
  };

  return (
    <ScrollView style={ui.screen}>
      <Text style={ui.h2}>Users</Text>
      {users.map((u) => (
        <View key={u.id} style={ui.card}>
          <Text style={{ fontWeight: '600' }}>{u.fullName}</Text>
          <Text style={ui.muted}>{u.email}</Text>
          <Text style={{ marginTop: 6 }}>Role:</Text>
          <View style={ui.row}>
            {ROLES.map((r) => (
              <Pressable key={r} onPress={() => update('users', u.id, { role: r })}
                style={[ui.chip, u.role === r && ui.chipActive]}>
                <Text style={[ui.chipText, u.role === r && ui.chipTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          {u.role === 'barangay' && (
            <>
              <Text style={{ marginTop: 6 }}>Assigned barangay:</Text>
              <View style={ui.row}>
                {barangays.map((b) => (
                  <Pressable key={b.id} onPress={() => update('users', u.id, { barangayId: b.id })}
                    style={[ui.chip, u.barangayId === b.id && ui.chipActive]}>
                    <Text style={[ui.chipText, u.barangayId === b.id && ui.chipTextActive]}>{b.barangayName}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      ))}

      <Text style={ui.h2}>Services ({services.length})</Text>
      {services.map((s) => (
        <View key={s.id} style={ui.card}><Text>{s.serviceName}</Text></View>
      ))}
      <TextInput placeholder="Service name" value={svcName} onChangeText={setSvcName} style={ui.input} />
      <TextInput placeholder="Requirements" value={svcReq} onChangeText={setSvcReq} style={ui.input} />
      <TextInput placeholder="Fee type (e.g. Assessed / Fixed)" value={svcFee} onChangeText={setSvcFee} style={ui.input} />
      <Pressable onPress={addService} style={ui.button}><Text style={ui.buttonText}>ADD SERVICE</Text></Pressable>

      <Text style={ui.h2}>Barangays ({barangays.length})</Text>
      {barangays.map((b) => (
        <View key={b.id} style={ui.card}><Text>{b.barangayName}</Text></View>
      ))}
      <TextInput placeholder="Barangay name" value={brgyName} onChangeText={setBrgyName} style={ui.input} />
      <Pressable onPress={addBarangay} style={ui.button}><Text style={ui.buttonText}>ADD BARANGAY</Text></Pressable>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}