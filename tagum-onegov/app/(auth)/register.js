import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';

const EMBLEM = require('../../src/assets/TagumEmblem.jpg');

const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  primaryLight: '#22c55e',
  panel: '#14532d',
  accent: '#dcfce7',
  bg: '#ecfdf3',
  card: '#ffffff',
  border: '#d1d5db',
  text: '#0f172a',
  muted: '#64748b',
  icon: '#94a3b8',
  strengthOff: '#e5e7eb',
};

// Used only when the "barangays" collection in Firestore is still empty.
const TAGUM_BARANGAYS = [
  'Apokon', 'Bincungan', 'Busaon', 'Canocotan', 'Cuambogan', 'La Filipina',
  'Liboganon', 'Madaum', 'Magdum', 'Magugpo East', 'Magugpo North',
  'Magugpo Poblacion', 'Magugpo South', 'Magugpo West', 'Mankilam',
  'New Balamban', 'Nueva Fuerza', 'Pagsabangan', 'Pandapan', 'San Agustin',
  'San Isidro', 'San Miguel', 'Visayan Village',
];

// Accepts 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX, returns 09XXXXXXXXX or null
const normalizePhone = (input) => {
  let s = (input || '').replace(/[\s-]/g, '');
  if (s.startsWith('+63')) s = '0' + s.slice(3);
  else if (s.startsWith('63') && s.length === 12) s = '0' + s.slice(2);
  return /^09\d{9}$/.test(s) ? s : null;
};

// Simple strength score: 0 to 3
const passwordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10 && /[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 8) score++;
  return score;
};

// Defined at module level so its identity stays stable across renders.
// If it were defined inside Register, each keystroke would remount the inputs.
const Field = ({ label, icon, children }) => (
  <View style={styles.field}>
    <View style={styles.labelRow}>
      <Ionicons name={icon} size={15} color={COLORS.primary} />
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
    </View>
    {children}
  </View>
);

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [barangay, setBarangay] = useState(null); // { id, name }
  const [barangays, setBarangays] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Load barangays from Firestore (public read); fall back to the built-in list
  useEffect(() => {
    getDocs(collection(db, 'barangays'))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, name: d.data().barangayName }))
          .filter((b) => !!b.name);
        setBarangays(list);
      })
      .catch((e) => console.warn(e.message));
  }, []);

  const options = useMemo(() => {
    const base = barangays.length
      ? barangays
      : TAGUM_BARANGAYS.map((name) => ({ id: null, name }));
    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [barangays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((b) => b.name.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const strength = passwordStrength(password);
  const strengthLabel = ['Weak', 'Weak', 'Good', 'Strong'][strength];

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    !!barangay &&
    password.length > 0 &&
    confirm.length > 0 &&
    agreed &&
    !busy;

  const signUp = async () => {
    if (!fullName.trim()) return notify('Missing name', 'Please enter your full name.');
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      return notify('Invalid phone number', 'Enter a valid mobile number, e.g. 09123456789.');
    }
    if (!barangay) return notify('Missing barangay', 'Please select your barangay.');
    if (password.length < 6) return notify('Weak password', 'Use at least 6 characters.');
    if (password !== confirm) return notify('Passwords do not match', 'Please re-enter your password.');
    if (!agreed) return notify('Terms required', 'Please agree to the Terms of Service and Privacy Policy.');
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: cleanPhone,
        role: 'citizen',
        barangayId: barangay.id,
        barangayName: barangay.name,
      });
      // The gate redirects automatically once the profile loads.
    } catch (e) {
      notify('Registration failed', e.message);
    }
    setBusy(false);
  };

  const pickBarangay = (b) => {
    setBarangay(b);
    setPickerOpen(false);
    setSearch('');
  };

  const form = (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="person-add-outline" size={30} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Register an Account</Text>
          <Text style={styles.subheading}>Fill in the details below to create your Tagum OneGov account.</Text>
        </View>
      </View>

      <View style={[styles.row, isWide && styles.rowWide]}>
        <Field label="Full name" icon="person-outline">
          <TextInput
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            textContentType="name"
            autoComplete="name"
            returnKeyType="next"
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={() => emailRef.current?.focus()}
            style={[styles.input, focused === 'name' && styles.inputFocused]}
          />
        </Field>
        <Field label="Email address" icon="mail-outline">
          <TextInput
            ref={emailRef}
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
            onSubmitEditing={() => phoneRef.current?.focus()}
            style={[styles.input, focused === 'email' && styles.inputFocused]}
          />
        </Field>
      </View>

      <View style={[styles.row, isWide && styles.rowWide]}>
        <Field label="Mobile number" icon="call-outline">
          <TextInput
            ref={phoneRef}
            placeholder="09XX XXX XXXX"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            maxLength={16}
            returnKeyType="next"
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            style={[styles.input, focused === 'phone' && styles.inputFocused]}
          />
        </Field>
        <Field label="Barangay (Tagum City)" icon="home-outline">
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.select, pickerOpen && styles.inputFocused]}
          >
            <Text style={[styles.selectText, !barangay && styles.selectPlaceholder]}>
              {barangay ? barangay.name : 'Select your barangay'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
          </Pressable>
        </Field>
      </View>

      <Field label="Password" icon="lock-closed-outline">
        <View style={[styles.inputWrap, focused === 'password' && styles.inputFocused]}>
          <TextInput
            ref={passwordRef}
            placeholder="Create a password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            textContentType="newPassword"
            autoComplete="password-new"
            returnKeyType="next"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={() => confirmRef.current?.focus()}
            style={styles.input}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.toggle}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.icon} />
          </Pressable>
        </View>
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  { backgroundColor: i < strength ? COLORS.primaryLight : COLORS.strengthOff },
                ]}
              />
            ))}
            <Text style={styles.strengthText}>
              Password strength: <Text style={styles.strengthLabel}>{strengthLabel}</Text>
            </Text>
          </View>
        )}
      </Field>

      <Field label="Confirm password" icon="lock-closed-outline">
        <View style={[styles.inputWrap, focused === 'confirm' && styles.inputFocused]}>
          <TextInput
            ref={confirmRef}
            placeholder="Re-enter your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            textContentType="newPassword"
            autoComplete="password-new"
            returnKeyType="go"
            value={confirm}
            onChangeText={setConfirm}
            onFocus={() => setFocused('confirm')}
            onBlur={() => setFocused(null)}
            onSubmitEditing={signUp}
            style={styles.input}
          />
          <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8} style={styles.toggle}>
            <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.icon} />
          </Pressable>
        </View>
      </Field>

      <Pressable onPress={() => setAgreed((v) => !v)} style={styles.termsRow}>
        <Ionicons
          name={agreed ? 'checkbox' : 'square-outline'}
          size={20}
          color={agreed ? COLORS.primary : COLORS.muted}
        />
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text> <Text style={styles.required}>*</Text>
        </Text>
      </Pressable>

      <Pressable
        onPress={signUp}
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
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Create Account</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Link href="/(auth)/login" asChild>
        <Pressable style={styles.loginButton}>
          <Ionicons name="log-in-outline" size={18} color={COLORS.primary} />
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </Pressable>
      </Link>

      <View style={styles.secureBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
        <Text style={styles.secureText}>
          Your information is safe and secure. We use industry-standard security measures to protect your data.
        </Text>
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
          <View style={[styles.brand, isWide && styles.brandWide]}>
            <View style={styles.brandTop}>
              <Image source={EMBLEM} style={styles.emblem} resizeMode="contain" />
              <View style={styles.brandDivider} />
              <View>
                <Text style={[styles.title, isWide && styles.titleWide]}>Tagum OneGov</Text>
                <Text style={styles.cityName}>City Government of Tagum</Text>
                <Text style={styles.cityName}>One portal for city services</Text>
              </View>
            </View>

            <Text style={[styles.headline, isWide && styles.headlineWide]}>Create Your Account</Text>
            <Text style={styles.headlineSub}>
              Join Tagum OneGov and enjoy easy access to city services, updates, and more.
            </Text>

            <View style={styles.perks}>
              {[
                { icon: 'document-text-outline', title: 'Apply for Services', text: 'Fast and convenient online applications' },
                { icon: 'notifications-outline', title: 'Get Updates', text: 'News, announcements and alerts' },
                { icon: 'person-outline', title: 'Track Your Requests', text: 'Monitor the status of your applications' },
              ].map((p) => (
                <View key={p.title} style={styles.perkRow}>
                  <View style={styles.perkIcon}>
                    <Ionicons name={p.icon} size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkTitle}>{p.title}</Text>
                    <Text style={styles.perkText}>{p.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.formSide, isWide && styles.formSideWide]}>{form}</View>
        </View>
      </ScrollView>

      {/* Barangay picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Select your barangay</Text>
            <TextInput
              placeholder="Search barangay"
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              style={[styles.input, styles.searchInput]}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id || item.name}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>No barangay found.</Text>}
              renderItem={({ item }) => {
                const active = barangay?.name === item.name;
                return (
                  <Pressable
                    onPress={() => pickBarangay(item)}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.name}</Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  brandWide: {
    flex: 1,
    borderRadius: 0,
    paddingVertical: 56,
    paddingHorizontal: 56,
    justifyContent: 'center',
  },
  brandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  emblem: { width: 84, height: 84 },
  brandDivider: { width: 1, height: 64, backgroundColor: 'rgba(255,255,255,0.35)' },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  titleWide: { fontSize: 36 },
  cityName: { fontSize: 13, color: COLORS.accent, marginTop: 2 },
  headline: { fontSize: 30, fontWeight: '800', color: '#ffffff' },
  headlineWide: { fontSize: 42 },
  headlineSub: { marginTop: 8, fontSize: 15, lineHeight: 22, color: COLORS.accent, marginBottom: 28 },
  perks: { gap: 18 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  perkText: { fontSize: 12, color: COLORS.accent, marginTop: 1 },

  // Form side
  formSide: { paddingHorizontal: 20, marginTop: -40, paddingBottom: 32, alignItems: 'center' },
  formSideWide: {
    flex: 1,
    marginTop: 0,
    paddingVertical: 48,
    paddingHorizontal: 48,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subheading: { marginTop: 2, fontSize: 13, color: COLORS.muted },

  row: { gap: 0 },
  rowWide: { flexDirection: 'row', gap: 16 },
  field: { flex: 1, marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  required: { color: '#dc2626' },

  input: {
    height: 48,
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
  },
  inputFocused: { borderColor: COLORS.primary },
  inputWrap: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggle: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },

  select: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  selectText: { flex: 1, fontSize: 15, color: COLORS.text },
  selectPlaceholder: { color: '#9ca3af' },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, maxWidth: 60 },
  strengthText: { fontSize: 11, color: COLORS.muted, marginLeft: 6 },
  strengthLabel: { fontWeight: '700', color: COLORS.primary },

  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 18 },
  termsText: { flex: 1, fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  termsLink: { color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },

  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: COLORS.primaryDark },
  buttonDisabled: { opacity: 0.55 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText: { marginHorizontal: 12, fontSize: 12, color: COLORS.muted },

  loginButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginText: { fontSize: 14, color: COLORS.muted },
  loginLink: { color: COLORS.primary, fontWeight: '700' },

  secureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  secureText: { flex: 1, fontSize: 11, lineHeight: 16, color: COLORS.muted },

  // Picker modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 520,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  searchInput: { flex: 0, marginBottom: 8 },
  option: { paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 },
  optionActive: { backgroundColor: COLORS.accent },
  optionText: { fontSize: 15, color: COLORS.text },
  optionTextActive: { fontWeight: '800', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.muted, paddingVertical: 20 },
});