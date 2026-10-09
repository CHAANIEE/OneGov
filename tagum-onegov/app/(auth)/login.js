import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';

const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  primaryLight: '#22c55e',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#d1d5db',
  text: '#0f172a',
  muted: '#64748b',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  const signIn = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      notify('Login failed', e.message);
    }
    setBusy(false);
  };

  const form = (
    <View style={styles.card}>
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>Sign in to continue to your account</Text>

      <Text style={styles.label}>Email address</Text>
      <TextInput
        placeholder="you@example.com"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocused('email')}
        onBlur={() => setFocused(null)}
        onSubmitEditing={() => passwordRef.current?.focus()}
        style={[styles.input, focused === 'email' && styles.inputFocused]}
      />

      <Text style={styles.label}>Password</Text>
      <View style={[styles.passwordWrap, focused === 'password' && styles.inputFocused]}>
        <TextInput
          ref={passwordRef}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          textContentType="password"
          autoComplete="password"
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
          onSubmitEditing={signIn}
          style={styles.passwordInput}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={signIn}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.button,
          !canSubmit && styles.buttonDisabled,
          pressed && canSubmit && styles.buttonPressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>LOGIN</Text>
        )}
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/register" style={styles.link}>
          Create an account
        </Link>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.layout, isWide && styles.layoutWide]}>
          <View style={[styles.brand, isWide && styles.brandWide]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>T</Text>
            </View>
            <Text style={[styles.title, isWide && styles.titleWide]}>Tagum OneGov</Text>
            <Text style={[styles.tagline, isWide && styles.taglineWide]}>
              City Government of Tagum{'\n'}One portal for city services
            </Text>
          </View>

          <View style={[styles.formSide, isWide && styles.formSideWide]}>{form}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  layout: {
    flex: 1,
    width: '100%',
  },
  layoutWide: {
    flexDirection: 'row',
    minHeight: '100%',
  },

  // Brand panel (top banner on mobile, left panel on desktop)
  brand: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: 72,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  brandWide: {
    flex: 1,
    borderRadius: 0,
    paddingVertical: 48,
    paddingHorizontal: 48,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleWide: {
    fontSize: 40,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.accent,
    textAlign: 'center',
  },
  taglineWide: {
    fontSize: 17,
    lineHeight: 26,
  },

  // Form side
  formSide: {
    paddingHorizontal: 20,
    marginTop: -40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  formSideWide: {
    flex: 1,
    marginTop: 0,
    paddingVertical: 48,
    paddingHorizontal: 48,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subheading: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 14,
    color: COLORS.muted,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#fff',
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  passwordWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  toggle: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});