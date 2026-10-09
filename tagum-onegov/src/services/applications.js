import {
  collection, addDoc, getDocs, getDoc, doc, query, where, onSnapshot, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sortNewest } from '../lib/helpers';
import { createNotification } from './notifications';

const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

export async function getServices() {
  return mapDocs(await getDocs(collection(db, 'services')));
}

export async function getService(id) {
  const snap = await getDoc(doc(db, 'services', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getBarangays() {
  return mapDocs(await getDocs(collection(db, 'barangays')));
}

export async function createApplication(service, barangayId = null) {
  const ref = await addDoc(collection(db, 'applications'), {
    userId: auth.currentUser.uid,
    serviceId: service.id,
    serviceName: service.serviceName,
    barangayId,
    barangayVerified: false,
    dateSubmitted: serverTimestamp(),
    status: 'Submitted',
  });
  return ref.id;
}

// Citizen: live list of own applications
export function subscribeMyApplications(uid, cb) {
  const q = query(collection(db, 'applications'), where('userId', '==', uid));
  return onSnapshot(q, (snap) => cb(sortNewest(mapDocs(snap))), (e) => console.warn(e.message));
}

// Staff: live list of ALL applications
export function subscribeAllApplications(cb) {
  return onSnapshot(
    collection(db, 'applications'),
    (snap) => cb(sortNewest(mapDocs(snap))),
    (e) => console.warn(e.message)
  );
}

// Barangay personnel: applications tied to their barangay
export function subscribeBarangayApplications(barangayId, cb) {
  const q = query(collection(db, 'applications'), where('barangayId', '==', barangayId));
  return onSnapshot(q, (snap) => cb(sortNewest(mapDocs(snap))), (e) => console.warn(e.message));
}

export async function verifyByBarangay(app) {
  await updateDoc(doc(db, 'applications', app.id), { barangayVerified: true });
  await createNotification(app.id, app.userId, 'Your barangay has verified your application.');
}