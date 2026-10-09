import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { ui } from '../../src/lib/ui';
import { notify } from '../../src/lib/helpers';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const signUp = async () => {
    if (!fullName.trim()) return notify('Missing name', 'Please enter your full name.');
    if (password.length < 6) return notify('Weak password', 'Use at least 6 characters.');
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName: fullName.trim(),
        email: email.trim(),
        role: 'citizen',
        barangayId: null,
      });
      // The gate redirects automatically once the profile loads.
    } catch (e) {
      notify('Registration failed', e.message);
    }
    setBusy(false);
  };

  return (
    <View style={ui.center}>
      <Text style={ui.title}>Create Account</Text>
      <TextInput placeholder="Full name" value={fullName} onChangeText={setFullName} style={ui.input} />
      <TextInput placeholder="Email address" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail} style={ui.input} />
      <TextInput placeholder="Password (min 6 characters)" secureTextEntry value={password}
        onChangeText={setPassword} style={ui.input} />
      <Pressable onPress={signUp} disabled={busy} style={ui.button}>
        <Text style={ui.buttonText}>{busy ? 'CREATING...' : 'REGISTER'}</Text>
      </Pressable>
      <Link href="/(auth)/login" style={{ marginTop: 16, textAlign: 'center' }}>Back to login</Link>
    </View>
  );
}