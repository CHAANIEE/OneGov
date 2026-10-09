import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const Ctx = createContext({ profile: null, loading: true });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (!user) { setProfile(null); setLoading(false); return; }
      // Listen (not one-time get): the profile doc is created right AFTER the auth user.
      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          setProfile(snap.exists() ? { uid: user.uid, ...snap.data() } : null);
          setLoading(false);
        },
        (e) => {
          // e.g. permission denied: do not stay on a loading state forever
          console.warn(e.message);
          setProfile(null);
          setLoading(false);
        }
      );
    });
    return () => { unsubAuth(); if (unsubProfile) unsubProfile(); };
  }, []);

  return <Ctx.Provider value={{ profile, loading }}>{children}</Ctx.Provider>;
}