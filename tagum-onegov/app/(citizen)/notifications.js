import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { ui } from '../../src/lib/ui';
import { formatTs } from '../../src/lib/helpers';

// Returns milliseconds for a Firestore Timestamp, or 0 if missing
const toMs = (ts) => ts?.toMillis?.() ?? 0;

export default function Notifications() {
  const { profile } = useAuth();
  const [personal, setPersonal] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Personal notifications (application updates, payments, etc.)
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', profile.uid));
    return onSnapshot(q, (snap) =>
      setPersonal(snap.docs.map((d) => ({ id: d.id, ...d.data(), kind: 'personal' })))
    );
  }, [profile]);

  // City-wide announcements (visible to all signed-in users)
  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) =>
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data(), kind: 'announcement' })))
    );
  }, [profile]);

  // Merge both lists, newest first
  const items = useMemo(() => {
    const all = [
      ...announcements.map((a) => ({ ...a, sortTime: toMs(a.createdAt) })),
      ...personal.map((n) => ({ ...n, sortTime: toMs(n.sentAt) })),
    ];
    return all.sort((a, b) => b.sortTime - a.sortTime);
  }, [personal, announcements]);

  const markRead = (item) => {
    if (item.kind !== 'personal' || item.isRead) return;
    updateDoc(doc(db, 'notifications', item.id), { isRead: true });
  };

  return (
    <View style={ui.screen}>
      {items.length === 0 && <Text style={ui.muted}>No notifications yet.</Text>}
      <FlatList
        data={items}
        keyExtractor={(n) => `${n.kind}-${n.id}`}
        renderItem={({ item }) => {
          const isAnnouncement = item.kind === 'announcement';
          const unread = !isAnnouncement && !item.isRead;
          return (
            <Pressable
              onPress={() => markRead(item)}
              style={[ui.card, { backgroundColor: unread ? '#E8F0FE' : '#fff' }]}
            >
              {isAnnouncement && (
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 4 }}>
                  ANNOUNCEMENT
                </Text>
              )}
              <Text style={{ fontWeight: unread ? '700' : '400' }}>{item.message}</Text>
              <Text style={[ui.muted, { fontSize: 12 }]}>
                {formatTs(isAnnouncement ? item.createdAt : item.sentAt)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}