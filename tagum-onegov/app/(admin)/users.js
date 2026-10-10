import { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { notify } from '../../src/lib/helpers';
import { A, k, useCollection, Loading, PageHeader, Panel, Btn, initialsOf } from '../../src/components/AdminKit';

const ROLES = ['citizen', 'staff', 'barangay', 'admin'];
const ROLE_LABELS = { citizen: 'Citizen', staff: 'City Staff', barangay: 'Barangay', admin: 'Administrator' };

export default function Users() {
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const users = useCollection('users');
  const barangays = useCollection('barangays');
  const [roleFilter, setRoleFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (localSearch || rawQ || '').trim().toLowerCase();

  const contentWidth = width >= 900 ? width - 250 : width;
  const cols = contentWidth >= 1100 ? 2 : 1;

  const pending = useMemo(
    () => users.items.filter((u) => u.role === 'citizen' && u.requestedRole && u.requestedRole !== 'citizen'),
    [users.items]
  );

  const sortedBarangays = useMemo(
    () => [...barangays.items].sort((a, b) => (a.barangayName || '').localeCompare(b.barangayName || '')),
    [barangays.items]
  );

  const list = useMemo(() => {
    return [...users.items]
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
      .filter((u) => roleFilter === 'All' || u.role === roleFilter)
      .filter(
        (u) =>
          !term ||
          `${u.fullName || ''} ${u.email || ''} ${u.phone || ''}`.toLowerCase().includes(term)
      );
  }, [users.items, roleFilter, term]);

  if (!users.ready) return <Loading />;

  const update = async (id, data) => {
    try {
      await updateDoc(doc(db, 'users', id), data);
    } catch (e) {
      notify('Error', e.message);
    }
  };

  const setRole = (u, r) => {
    if (u.id === profile?.uid) return notify('Not allowed', 'You cannot change your own role.');
    update(u.id, { role: r });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: A.bg }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.container}>
        <PageHeader
          icon="people-outline"
          title="User Management"
          subtitle="Approve role requests, change roles and assign barangays."
        />

        {pending.length > 0 && (
          <Panel title={`Role Requests (${pending.length})`} icon="person-add-outline">
            {pending.map((u) => (
              <View key={u.id} style={s.request}>
                <View style={{ flex: 1, minWidth: 180 }}>
                  <Text style={s.name}>{u.fullName}</Text>
                  <Text style={k.muted}>{u.email}</Text>
                  <Text style={s.requestText}>Requests: {ROLE_LABELS[u.requestedRole] || u.requestedRole}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Btn small label="Approve" onPress={() => update(u.id, { role: u.requestedRole, requestedRole: deleteField() })} />
                  <Btn small kind="outline" label="Decline" onPress={() => update(u.id, { requestedRole: deleteField() })} />
                </View>
              </View>
            ))}
          </Panel>
        )}

        <Panel title={`Users (${users.items.length})`} icon="people-outline">
          <TextInput
            placeholder="Search by name, email or phone"
            placeholderTextColor="#9ca3af"
            value={localSearch}
            onChangeText={setLocalSearch}
            autoCapitalize="none"
            style={k.input}
          />
          <View style={[k.chipRow, { marginBottom: 14 }]}>
            {['All', ...ROLES].map((r) => {
              const active = roleFilter === r;
              return (
                <Pressable key={r} onPress={() => setRoleFilter(r)} style={[k.chip, active && k.chipActive]}>
                  <Text style={[k.chipText, active && k.chipTextActive]}>{r === 'All' ? 'All' : ROLE_LABELS[r]}</Text>
                </Pressable>
              );
            })}
          </View>

          {list.length === 0 && <Text style={k.muted}>No users found.</Text>}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            {list.map((u) => {
              const isMe = u.id === profile?.uid;
              return (
                <View key={u.id} style={{ width: `${100 / cols}%`, padding: 6 }}>
                  <View style={s.card}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{initialsOf(u.fullName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.name}>{u.fullName} {isMe ? '(you)' : ''}</Text>
                        <Text style={k.muted} numberOfLines={1}>{u.email}</Text>
                        {!!u.phone && <Text style={k.muted}>{u.phone}</Text>}
                        {!!u.barangayName && <Text style={k.muted}>Brgy. {u.barangayName}</Text>}
                      </View>
                    </View>

                    <Text style={k.label}>Role</Text>
                    <View style={k.chipRow}>
                      {ROLES.map((r) => (
                        <Pressable
                          key={r}
                          disabled={isMe}
                          onPress={() => setRole(u, r)}
                          style={[k.chip, u.role === r && k.chipActive, isMe && { opacity: 0.6 }]}
                        >
                          <Text style={[k.chipText, u.role === r && k.chipTextActive]}>{ROLE_LABELS[r]}</Text>
                        </Pressable>
                      ))}
                    </View>

                    {u.role === 'barangay' && (
                      <>
                        <Text style={k.label}>Assigned barangay</Text>
                        <View style={k.chipRow}>
                          {sortedBarangays.map((b) => (
                            <Pressable
                              key={b.id}
                              onPress={() => update(u.id, { barangayId: b.id, barangayName: b.barangayName })}
                              style={[k.chip, u.barangayId === b.id && k.chipActive]}
                            >
                              <Text style={[k.chipText, u.barangayId === b.id && k.chipTextActive]}>{b.barangayName}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Panel>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  container: { width: '100%', maxWidth: 1400, alignSelf: 'center' },
  request: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  requestText: { marginTop: 3, fontSize: 13, fontWeight: '700', color: '#92400e' },
  card: { borderWidth: 1.5, borderColor: A.border, borderRadius: 14, padding: 14, backgroundColor: '#fff' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: A.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: A.primary, fontWeight: '800', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '800', color: A.text },
});