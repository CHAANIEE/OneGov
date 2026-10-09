import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { ui } from '../../src/lib/ui';
import { formatTs, sortNewest } from '../../src/lib/helpers';

export default function Notifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', profile.uid));
    return onSnapshot(q, (snap) =>
      setItems(sortNewest(snap.docs.map((d) => ({ id: d.id, ...d.data() })), 'sentAt'))
    );
  }, [profile]);

  const markRead = (id) => updateDoc(doc(db, 'notifications', id), { isRead: true });

  return (
    <View style={ui.screen}>
      {items.length === 0 && <Text style={ui.muted}>No notifications yet.</Text>}
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => markRead(item.id)}
            style={[ui.card, { backgroundColor: item.isRead ? '#fff' : '#E8F0FE' }]}>
            <Text style={{ fontWeight: item.isRead ? '400' : '700' }}>{item.message}</Text>
            <Text style={[ui.muted, { fontSize: 12 }]}>{formatTs(item.sentAt)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}