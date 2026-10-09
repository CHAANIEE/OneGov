import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { ui, COLORS } from '../../src/lib/ui';
import { formatTs, sortNewest, notify } from '../../src/lib/helpers';

export default function Notifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', profile.uid));
    return onSnapshot(
      q,
      (snap) => setItems(sortNewest(snap.docs.map((d) => ({ id: d.id, ...d.data() })), 'sentAt')),
      (e) => console.warn(e.message)
    );
  }, [profile?.uid]);

  const markRead = async (item) => {
    if (item.isRead) return;
    try {
      await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
    } catch (e) {
      notify('Error', e.message);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <View style={ui.screen}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={ui.content}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Text style={ui.title}>Notifications</Text>
            <Text style={ui.muted}>
              {unread > 0 ? `${unread} unread. Tap a notification to mark it as read.` : 'You are all caught up.'}
            </Text>
          </View>
        }
        ListEmptyComponent={<Text style={ui.muted}>No notifications yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markRead(item)}
            style={[
              ui.card,
              item.isRead
                ? null
                : { backgroundColor: COLORS.accent, borderColor: COLORS.primary },
            ]}
          >
            <Text style={{ fontWeight: item.isRead ? '400' : '700', color: COLORS.text, fontSize: 15 }}>
              {item.message}
            </Text>
            <Text style={[ui.muted, { fontSize: 12, marginTop: 4 }]}>{formatTs(item.sentAt)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}