import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { ui } from '../../src/lib/ui';
import { notify } from '../../src/lib/helpers';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      notify('Login failed', e.message);
    }
    setBusy(false);
  };

  return (
    <View style={ui.center}>
      <Text style={ui.title}>Tagum OneGov</Text>
      <TextInput placeholder="Email address" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail} style={ui.input} />
      <TextInput placeholder="Password" secureTextEntry value={password}
        onChangeText={setPassword} style={ui.input} />
      <Pressable onPress={signIn} disabled={busy} style={ui.button}>
        <Text style={ui.buttonText}>{busy ? 'SIGNING IN...' : 'LOGIN'}</Text>
      </Pressable>
      <Link href="/(auth)/register" style={{ marginTop: 16, textAlign: 'center' }}>
        Create an account
      </Link>
    </View>
  );
}