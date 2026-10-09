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
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/lib/firebase';
import { notify } from '../../src/lib/helpers';

const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  primaryLight: '#22c55e',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#d1d5db',
  borderSoft: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
};

// Used only when the "barangays" collection in Firestore is still empty,
// so registration is never blocked. Tagum City's 23 barangays.
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

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [barangay, setBarangay] = useState(null); // { id, name }
  const [barangays, setBarangays] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

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

  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    !!barangay &&
    password.length > 0 &&
    !busy;

  const signUp = async () => {
    if (!fullName.trim()) return notify('Missing name', 'Please enter your full name.');
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      return notify('Invalid phone number', 'Enter a valid mobile number, e.g. 09123456789.');
    }
    if (!barangay) return notify('Missing barangay', 'Please select your barangay.');
    if (password.length < 6) return notify('Weak password', 'Use at least 6 characters.');
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
      <Text style={styles.heading}>Create account</Text>
      <Text style={styles.subheading}>Register to access city services</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput
        placeholder="Juan Dela Cruz"
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

      <Text style={styles.label}>Email address</Text>
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

      <Text style={styles.label}>Mobile number</Text>
      <TextInput
        ref={phoneRef}
        placeholder="09123456789"
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

      <Text style={styles.label}>Barangay (Tagum City)</Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.select, pickerOpen && styles.inputFocused]}
      >
        <Text style={[styles.selectText, !barangay && styles.selectPlaceholder]}>
          {barangay ? barangay.name : 'Select your barangay'}
        </Text>
        <Text style={styles.selectCaret}>v</Text>
      </Pressable>

      <Text style={styles.label}>Password</Text>
      <View style={[styles.passwordWrap, focused === 'password' && styles.inputFocused]}>
        <TextInput
          ref={passwordRef}
          placeholder="Min. 6 characters"
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          textContentType="newPassword"
          autoComplete="password-new"
          returnKeyType="go"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
          onSubmitEditing={signUp}
          style={styles.passwordInput}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>Use at least 6 characters.</Text>

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
          <Text style={styles.buttonText}>REGISTER</Text>
        )}
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" style={styles.link}>
          Back to login
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

      {/* Barangay picker */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
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
                    style={({ hovered }) => [
                      styles.option,
                      active && styles.optionActive,
                      hovered && !active && styles.optionHover,
                    ]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.name}
                    </Text>
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
    paddingTop: 48,
    paddingBottom: 68,
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

  // Barangay select field
  select: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  selectPlaceholder: {
    color: '#9ca3af',
  },
  selectCaret: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 8,
  },

  passwordWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 6,
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
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 20,
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  searchInput: {
    marginBottom: 8,
  },
  option: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionHover: {
    backgroundColor: COLORS.bg,
  },
  optionActive: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.text,
  },
  optionTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    paddingVertical: 20,
  },
});