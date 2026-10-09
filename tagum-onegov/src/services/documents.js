import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytes } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { auth, storage, db } from '../lib/firebase';

export async function pickAndUpload(applicationId) {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
  if (res.canceled) return null;
  const file = res.assets[0];

  const path = `documents/${applicationId}/${Date.now()}_${file.name}`;
  const blob = await (await fetch(file.uri)).blob(); // works on web and native
  await uploadBytes(ref(storage, path), blob, { contentType: file.mimeType });

  await addDoc(collection(db, 'documents'), {
    applicationId,
    userId: auth.currentUser.uid,
    documentName: file.name,
    filePath: path,
    verificationStatus: 'Pending',
  });
  return file.name;
}