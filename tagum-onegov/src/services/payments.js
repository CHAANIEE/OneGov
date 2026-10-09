import {
  addDoc, collection, getDocs, query, where, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createNotification } from './notifications';

export async function getLatestAssessment(app) {
  const q = query(
    collection(db, 'assessments'),
    where('applicationId', '==', app.id),
    where('userId', '==', app.userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => (b.assessedAt?.seconds ?? 0) - (a.assessedAt?.seconds ?? 0))[0];
}

export async function simulatePayment(app) {
  const latest = await getLatestAssessment(app);
  if (!latest) throw new Error('No assessment yet.');

  const referenceNo =
    `SIM-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await new Promise((r) => setTimeout(r, 1200)); // fake processing delay

  await addDoc(collection(db, 'payments'), {
    applicationId: app.id,
    userId: app.userId,
    amount: latest.amount,
    paymentStatus: 'Paid',
    referenceNo,
    paidAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'applications', app.id), { status: 'Paid' });
  await createNotification(app.id, app.userId, `Simulated payment received. Ref: ${referenceNo}`);
  return referenceNo;
}