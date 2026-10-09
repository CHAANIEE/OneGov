import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createNotification = (applicationId, userId, message) =>
  addDoc(collection(db, 'notifications'), {
    applicationId, userId, message, sentAt: serverTimestamp(), isRead: false,
  });