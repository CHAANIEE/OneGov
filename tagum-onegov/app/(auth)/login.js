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
  Image,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';

const EMBLEM = require('../../src/assets/TagumEmblem.jpg');

const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  panel: '#14532d',
  accent: '#dcfce7',
  bg: '#ecfdf3',
  card: '#ffffff',
  border: '#d1d5db',
  text: '#0f172a',
  muted: '#64748b',
  icon: '#94a3b8',
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

  const brand = (
    <View style={[styles.brand, isWide && styles.brandWide]}>
      <Image source={EMBLEM} style={styles.emblem} resizeMode="contain" />
      <Text style={[styles.title, isWide && styles.titleWide]}>Tagum OneGov</Text>
      <Text style={[styles.cityName, isWide && styles.cityNameWide]}>City Government of Tagum</Text>
      <View style={styles.divider} />
      <Text style={[styles.tagline, isWide && styles.taglineWide]}>One portal for city services</Text>
    </View>
  );

  const form = (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>Sign in to continue to your account</Text>

      <Text style={styles.label}>Email address</Text>
      <View style={[styles.inputWrap, focused === 'email' && styles.inputFocused]}>
        <Ionicons name="mail-outline" size={20} color={COLORS.icon} style={styles.leftIcon} />
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
          style={styles.input}
        />
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={[styles.inputWrap, focused === 'password' && styles.inputFocused]}>
        <Ionicons name="lock-closed-outline" size={20} color={COLORS.icon} style={styles.leftIcon} />
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
          style={styles.input}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.icon}
          />
        </Pressable>
      </View>

      <Pressable
        style={styles.forgotRow}
        onPress={() => notify('Forgot password', 'Please contact the city helpdesk to reset your password.')}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

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
          <View style={styles.buttonInner}>
            <Text style={styles.buttonText}>LOG IN</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        )}
      </Pressable>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/register" style={styles.link}>
          Create an account
        </Link>
      </View>

      <View style={styles.secureBox}>
        <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
        <View style={styles.secureTextWrap}>
          <Text style={styles.secureTitle}>Your information is safe and secure.</Text>
          <Text style={styles.secureText}>
            We use industry-standard security measures to protect your data.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.layout, isWide && styles.layoutWide]}>
          {brand}
          <View style={[styles.formSide, isWide && styles.formSideWide]}>{form}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1 },
  layout: { flex: 1, width: '100%' },
  layoutWide: { flexDirection: 'row', minHeight: '100%' },

  // Brand panel
  brand: {
    backgroundColor: COLORS.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: 80,
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
  emblem: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  titleWide: { fontSize: 44 },
  cityName: {
    marginTop: 6,
    fontSize: 17,
    color: '#ffffff',
    textAlign: 'center',
  },
  cityNameWide: { fontSize: 20 },
  divider: {
    width: 56,
    height: 2,
    backgroundColor: COLORS.primaryLight ?? '#22c55e',
    marginVertical: 16,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.accent,
    textAlign: 'center',
  },
  taglineWide: { fontSize: 17 },

  // Form side
  formSide: {
    paddingHorizontal: 20,
    marginTop: -48,
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
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  accentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginBottom: 14,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  subheading: {
    marginTop: 4,
    marginBottom: 22,
    fontSize: 14,
    color: COLORS.muted,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingLeft: 14,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
    paddingRight: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  toggle: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: COLORS.primaryDark },
  buttonDisabled: { opacity: 0.55 },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.muted,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
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
  secureBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  secureTextWrap: { flex: 1 },
  secureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  secureText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },
});