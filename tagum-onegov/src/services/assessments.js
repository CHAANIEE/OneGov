import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { shortId } from '../lib/helpers';
import { createNotification } from './notifications';

// `app` = { id, userId, ... }
export async function setStatus(app, status) {
  await updateDoc(doc(db, 'applications', app.id), { status });
  await createNotification(app.id, app.userId,
    `Your application #${shortId(app.id)} is now: ${status}`);
}

export const verifyDocument = (documentId, verificationStatus) =>
  updateDoc(doc(db, 'documents', documentId), { verificationStatus });

export async function createAssessment(app, amount) {
  await addDoc(collection(db, 'assessments'), {
    applicationId: app.id,
    userId: app.userId,
    amount: Number(amount),
    assessedAt: serverTimestamp(),
  });
  await setStatus(app, 'For Payment');
}