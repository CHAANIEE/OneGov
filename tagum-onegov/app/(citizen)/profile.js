import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useAuth } from '../../src/context/AuthContext';
import { notify } from '../../src/lib/helpers';

const COLORS = {
  primary: '#166534',
  primaryDark: '#14532d',
  accent: '#dcfce7',
  bg: '#f0fdf4',
  card: '#ffffff',
  border: '#d1d5db',
  borderSoft: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
};

// Used only when the "barangays" collection in Firestore is still empty.
const TAGUM_BARANGAYS = [
  'Apokon', 'Bincungan', 'Busaon', 'Canocotan', 'Cuambogan', 'La Filipina',
  'Liboganon', 'Madaum', 'Magdum', 'Magugpo East', 'Magugpo North',
  'Magugpo Poblacion', 'Magugpo South', 'Magugpo West', 'Mankilam',
  'New Balamban', 'Nueva Fuerza', 'Pagsabangan', 'Pandapan', 'San Agustin',
  'San Isidro', 'San Miguel', 'Visayan Village',
];

const ROLE_LABELS = {
  citizen: 'Citizen',
  staff: 'City Staff',
  barangay: 'Barangay Personnel',
  admin: 'Administrator',
};

// Accepts 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX, returns 09XXXXXXXXX or null
const normalizePhone = (input) => {
  let s = (input || '').replace(/[\s-]/g, '');
  if (s.startsWith('+63')) s = '0' + s.slice(3);
  else if (s.startsWith('63') && s.length === 12) s = '0' + s.slice(2);
  return /^09\d{9}$/.test(s) ? s : null;
};

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export default function Profile() {
  const { profile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [barangay, setBarangay] = useState(null); // { id, name }
  const [barangays, setBarangays] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(false);

  // Fill the form from the signed-in profile
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || '');
    setPhone(profile.phone || '');
    setBarangay(
      profile.barangayName ? { id: profile.barangayId ?? null, name: profile.barangayName } : null
    );
  }, [profile]);

  // Load barangays (public read), fall back to the built-in list
  useEffect(() => {
    getDocs(collection(db, 'barangays'))
      .then((snap) => {
        setBarangays(
          snap.docs
            .map((d) => ({ id: d.id, name: d.data().barangayName }))
            .filter((b) => !!b.name)
        );
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

  if (!profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const dirty =
    fullName.trim() !== (profile.fullName || '') ||
    phone.trim() !== (profile.phone || '') ||
    (barangay?.name || '') !== (profile.barangayName || '');

  const canSave = dirty && fullName.trim().length > 0 && !busy;

  const save = async () => {
    if (!fullName.trim()) return notify('Missing name', 'Please enter your full name.');

    const data = { fullName: fullName.trim() };

    if (phone.trim()) {
      const clean = normalizePhone(phone);
      if (!clean) {
        return notify('Invalid phone number', 'Enter a valid mobile number, e.g. 09123456789.');
      }
      data.phone = clean;
    } else if (profile.phone) {
      return notify('Missing phone', 'Your mobile number cannot be empty.');
    }

    if (barangay) {
      data.barangayId = barangay.id;
      data.barangayName = barangay.name;
    }

    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), data);
      setFullName(data.fullName);
      if (data.phone) setPhone(data.phone);
      notify('Profile updated', 'Your changes were saved.');
    } catch (e) {
      notify('Update failed', e.message);
    }
    setBusy(false);
  };

  const pickBarangay = (b) => {
    setBarangay(b);
    setPickerOpen(false);
    setSearch('');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        {/* Identity header */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(profile.fullName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.fullName || 'Your profile'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABELS[profile.role] || profile.role}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.heading}>Edit profile</Text>
        <Text style={styles.subheading}>Keep your contact details up to date.</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          placeholder="Juan Dela Cruz"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
          textContentType="name"
          value={fullName}
          onChangeText={setFullName}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused(null)}
          style={[styles.input, focused === 'name' && styles.inputFocused]}
        />

        <Text style={styles.label}>Email address</Text>
        <View style={[styles.input, styles.readOnly]}>
          <Text style={styles.readOnlyText} numberOfLines={1}>
            {profile.email}
          </Text>
        </View>

        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          placeholder="09123456789"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={16}
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

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.button,
            !canSave && styles.buttonDisabled,
            pressed && canSave && styles.buttonPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>SAVE CHANGES</Text>
          )}
        </Pressable>
      </View>

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
              style={[styles.input, { marginBottom: 8 }]}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  // Identity
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 18,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  heading: {
    fontSize: 22,
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
  readOnly: {
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  readOnlyText: {
    fontSize: 16,
    color: COLORS.muted,
  },

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
    marginBottom: 22,
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
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
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