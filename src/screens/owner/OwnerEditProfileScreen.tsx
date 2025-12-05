import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { StatusBar } from 'react-native';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface OwnerEditProfileScreenProps {
  ownerData?: any;
  onBack?: () => void;
  onSave?: (updatedOwner: any) => void;
}

const InfoField: React.FC<{
  label: string;
  icon?: string;
  value: string;
}> = ({ label, icon, value }) => (
  <View style={styles.infoField}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputShell}>
      {icon ? (
        <Ionicons name={icon as any} size={18} color="#9CA3AF" style={styles.inputIcon} />
      ) : null}
      <Text style={styles.valueText}>{value}</Text>
    </View>
  </View>
);

const EditableField: React.FC<{
  label: string;
  icon?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'phone-pad';
}> = ({ label, icon, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.infoField}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputShell}>
      {icon ? (
        <Ionicons name={icon as any} size={18} color="#9CA3AF" style={styles.inputIcon} />
      ) : null}
      <TextInput
        style={[styles.valueText, styles.editableInput]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  </View>
);

const ensureString = (fallback: string, ...candidates: any[]): string => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const value = String(candidate).trim();
    if (value.length > 0 && value.toLowerCase() !== 'null' && value.toLowerCase() !== 'undefined') {
      return value;
    }
  }
  return fallback;
};

const OwnerEditProfileScreen: React.FC<OwnerEditProfileScreenProps> = ({
  ownerData,
  onBack,
  onSave,
}) => {
  const [storedOwner, setStoredOwner] = useState<any | null>(ownerData ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!ownerData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [ownerName, setOwnerName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const hasHydratedForm = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadOwner = async () => {
      if (ownerData) {
        setStoredOwner(ownerData);
        setIsLoading(false);
        return;
      }

      try {
        const savedUser = await authService.getUser();
        if (isMounted) {
          setStoredOwner(savedUser ?? null);
        }
      } catch (error) {
        console.log('[OwnerEditProfileScreen] failed to load owner data', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOwner();

    return () => {
      isMounted = false;
    };
  }, [ownerData]);

  const profile = useMemo(() => {
    if (!storedOwner || typeof storedOwner !== 'object') {
      return {};
    }

    const candidates = [
      storedOwner.rawUserData,
      storedOwner.userData,
      storedOwner.owner,
      storedOwner.profile,
      storedOwner.data?.userData,
      storedOwner.data?.owner,
      storedOwner,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object') {
        return candidate;
      }
    }
    return {};
  }, [storedOwner]);

  const business = useMemo(() => {
    const defaultHours = {
      days: 'Monday - Saturday',
      open: '09:00 AM',
      close: '06:00 PM',
    };

    const hours =
      profile?.hours ||
      storedOwner?.hours ||
      storedOwner?.business_hours ||
      defaultHours;

    const resolvedHours = {
      days: ensureString(defaultHours.days, hours?.days, hours?.dayRange, hours?.day_range),
      open: ensureString(defaultHours.open, hours?.open, hours?.start, hours?.opening_time),
      close: ensureString(defaultHours.close, hours?.close, hours?.end, hours?.closing_time),
    };

    return {
      businessName: ensureString('Premium Auto Wash',
        profile?.businessName,
        profile?.business_name,
        storedOwner?.businessName,
        storedOwner?.business_name,
        profile?.name,
        storedOwner?.name,
      ),
      ownerName: ensureString('John Doe',
        profile?.ownerName,
        profile?.owner_name,
        profile?.contactName,
        profile?.contact_name,
        storedOwner?.ownerName,
        storedOwner?.owner_name,
        storedOwner?.fullName,
        storedOwner?.name,
      ),
      email: ensureString('premium@carwash.com',
        profile?.email,
        profile?.contactEmail,
        profile?.contact_email,
        storedOwner?.email,
      ),
      phone: ensureString('+1 (555) 123-4567',
        profile?.phone,
        profile?.phoneNumber,
        profile?.phone_number,
        storedOwner?.phone,
        storedOwner?.phoneNumber,
        storedOwner?.phone_number,
      ),
      address: ensureString('123 Main St, Downtown',
        profile?.address,
        profile?.streetAddress,
        profile?.street_address,
        storedOwner?.address,
        storedOwner?.street_address,
      ),
      city: ensureString('New York',
        profile?.city,
        profile?.town,
        storedOwner?.city,
        storedOwner?.town,
      ),
      zip: ensureString('10001',
        profile?.zip,
        profile?.zipcode,
        profile?.postalCode,
        profile?.postal_code,
        storedOwner?.zip,
        storedOwner?.postal_code,
      ),
      hours: resolvedHours,
      memberSince: ensureString('January 2025',
        profile?.memberSince,
        profile?.member_since,
        storedOwner?.memberSince,
        storedOwner?.member_since,
      ),
      totalBookings: ensureString('247',
        String(profile?.totalBookings ?? ''),
        String(profile?.total_bookings ?? ''),
        String(storedOwner?.totalBookings ?? ''),
        String(storedOwner?.total_bookings ?? ''),
      ),
      verificationStatus: ensureString('Verified Business',
        profile?.verificationStatus,
        profile?.verification_status,
        storedOwner?.verificationStatus,
        storedOwner?.verification_status,
        'Verified Business',
      ),
    };
  }, [profile, storedOwner]);

  useEffect(() => {
    if (!hasHydratedForm.current) {
      setOwnerName(business.ownerName);
      setPhoneNumber(business.phone.replace(/\D/g, '').slice(0, 15));
      hasHydratedForm.current = true;
    }
  }, [business.ownerName, business.phone]);

  useEffect(() => {
    return () => {
      hasHydratedForm.current = false;
    };
  }, []);

  const formattedPhone = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }, [phoneNumber]);

  const handleSave = async () => {
    const trimmedName = ownerName.trim();
    const digits = phoneNumber.replace(/\D/g, '');

    if (trimmedName.length === 0) {
      Alert.alert('Validation Error', 'Owner name is required.');
      return;
    }

    if (digits.length < 7) {
      Alert.alert('Validation Error', 'Please enter a valid phone number.');
      return;
    }

    if (!storedOwner) {
      Alert.alert('Error', 'Owner data not available.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await authService.editOwnerProfile(trimmedName, digits);
      if (!result.success) {
        let errorMessage = result.error || 'Failed to update profile. Please try again.';
        if (result.validationErrors && typeof result.validationErrors === 'object') {
          const keys = Object.keys(result.validationErrors);
          if (keys.length > 0) {
            const first = result.validationErrors[keys[0]];
            errorMessage = Array.isArray(first) ? first[0] : String(first);
          }
        }
        Alert.alert('Error', errorMessage);
        return;
      }

      const updatedOwner = result.user || storedOwner;
      setStoredOwner(updatedOwner);
      setOwnerName(trimmedName);
      setPhoneNumber(digits);

      Alert.alert('Success', result.message || 'Profile updated successfully.', [
        {
          text: 'OK',
          onPress: () => {
            onSave?.(updatedOwner);
          },
        },
      ]);
    } catch (error: any) {
      console.log('[OwnerEditProfileScreen] failed to save profile', error);
      Alert.alert('Error', error?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="storefront" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Business Information</Text>
          </View>
          <InfoField label="Business Name" icon="business-outline" value={business.businessName} />
          <EditableField
            label="Owner Name"
            icon="person-outline"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <InfoField label="Email Address" icon="mail-outline" value={business.email} />
          <EditableField
            label="Phone Number"
            icon="call-outline"
            value={formattedPhone}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, 15);
              setPhoneNumber(digits);
            }}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Location Details</Text>
          </View>
          <InfoField label="Street Address" value={business.address} />
          <View style={styles.horizontalRow}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputShell}>
                <Text style={styles.valueText}>{business.city}</Text>
              </View>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Zip Code</Text>
              <View style={styles.inputShell}>
                <Text style={styles.valueText}>{business.zip}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: YELLOW_COLOR }]}>
              <Ionicons name="time" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Working Hours</Text>
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Open 24 Hours</Text>
              <Text style={styles.switchDescription}>Available round the clock</Text>
            </View>
            <Switch value={false} trackColor={{ false: '#D1D5DB', true: `${BLUE_COLOR}33` }} thumbColor={false ? '#F4F5F7' : BLUE_COLOR} disabled />
          </View>
          <View style={styles.horizontalRow}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Opening Time</Text>
              <View style={styles.inputShell}>
                <Text style={styles.valueText}>{business.hours.open}</Text>
              </View>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Closing Time</Text>
              <View style={styles.inputShell}>
                <Text style={styles.valueText}>{business.hours.close}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Business Statistics</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Member Since</Text>
            <Text style={styles.statValue}>{business.memberSince}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Bookings</Text>
            <Text style={styles.statValue}>{business.totalBookings}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Verification Status</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.verifiedText}>{business.verificationStatus}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 22, android: 20 }),
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: Platform.select({ ios: 14, android: 12 }),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    color: '#111827',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.select({ 
      ios: 100,
      android: 90
    }),
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#111827',
  },
  infoField: {
    marginBottom: 20,
  },
  label: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
    marginBottom: 8,
  },
  inputShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  valueText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#111827',
    flexShrink: 1,
  },
  editableInput: {
    flex: 1,
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  switchTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
  },
  switchDescription: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  statValue: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#22C55E',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: BLUE_COLOR,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
});

export default OwnerEditProfileScreen;


