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
  PermissionsAndroid,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [storedOwner, setStoredOwner] = useState<any | null>(ownerData ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!ownerData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [ownerName, setOwnerName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zip, setZip] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState<string>('');
  const [is24hOpen, setIs24hOpen] = useState<boolean>(false);
  const [openTime, setOpenTime] = useState<string>('09:30');
  const [closeTime, setCloseTime] = useState<string>('18:30');
  const [weekoffDays, setWeekoffDays] = useState<string[]>([]);
  const hasHydratedForm = useRef<boolean>(false);

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  const serviceCentre = profile?.service_centre || storedOwner?.userData?.service_centre || storedOwner?.service_centre;

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

    // H:i from API "09:30:00" -> "09:30"
    const toHi = (v: string | undefined): string => {
      if (!v || typeof v !== 'string') return '';
      const parts = v.trim().split(':');
      if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      return v;
    };

    return {
      businessName: ensureString('Premium Auto Wash',
        serviceCentre?.name,
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
      is24hOpen: serviceCentre?.is_24h_open === true || serviceCentre?.is_24h_open === '1',
      openTimeHi: toHi(serviceCentre?.open_time) || '09:30',
      closeTimeHi: toHi(serviceCentre?.close_time) || '18:30',
      weekoffDays: (() => {
        const w = serviceCentre?.weekoff_days || profile?.weekoff_days || storedOwner?.weekoff_days;
        if (Array.isArray(w) && w.length > 0) return w.map((d: any) => String(d).trim()).filter(Boolean);
        return [];
      })(),
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
  }, [profile, storedOwner, serviceCentre]);

  useEffect(() => {
    if (!hasHydratedForm.current) {
      setBusinessName(business.businessName);
      setOwnerName(business.ownerName);
      setPhoneNumber(business.phone.replace(/\D/g, '').slice(0, 15));
      setAddress(business.address);
      setCity(business.city);
      setZip(business.zip);
      const clat = serviceCentre?.clat != null ? parseFloat(String(serviceCentre.clat)) : null;
      const clong = serviceCentre?.clong != null ? parseFloat(String(serviceCentre.clong)) : null;
      if (clat != null && !Number.isNaN(clat)) setLatitude(clat);
      if (clong != null && !Number.isNaN(clong)) setLongitude(clong);
      setIs24hOpen(business.is24hOpen ?? false);
      setOpenTime(business.openTimeHi || '09:30');
      setCloseTime(business.closeTimeHi || '18:30');
      setWeekoffDays(business.weekoffDays ?? []);
      hasHydratedForm.current = true;
    }
  }, [business.businessName, business.ownerName, business.phone, business.address, business.city, business.zip, business.is24hOpen, business.openTimeHi, business.closeTimeHi, business.weekoffDays, serviceCentre]);

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

  // Request location permission for Android
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'WashNow needs access to your location to set your center address.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  // Get current location and reverse geocode to address
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to use this feature. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoadingLocation(true);
    try {
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setLatitude(latitude);
            setLongitude(longitude);

            // Reverse geocode using Nominatim (free OpenStreetMap service)
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'WashNowApp/1.0', // Required by Nominatim
                  },
                }
              );

              const data = await response.json();
              if (data && data.address) {
                const addr = data.address;
                
                // Build address string
                const addressParts = [];
                if (addr.house_number) addressParts.push(addr.house_number);
                if (addr.road) addressParts.push(addr.road);
                if (addr.suburb) addressParts.push(addr.suburb);
                
                const fullAddress = addressParts.length > 0 
                  ? addressParts.join(' ')
                  : data.display_name?.split(',')[0] || '';
                
                setAddress(fullAddress);
                setCity(addr.city || addr.town || addr.village || '');
                setZip(addr.postcode || '');
              } else {
                // Fallback to coordinates
                setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              }
            } catch (geoError) {
              console.error('Reverse geocoding error:', geoError);
              // Fallback to coordinates
              setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
          } catch (error) {
            console.error('Location processing error:', error);
            Alert.alert('Error', 'Failed to process location. Please try again.');
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          Alert.alert(
            'Location Error',
            'Unable to get your current location. Please check your location settings or enter the address manually.',
            [{ text: 'OK' }]
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (error) {
      console.error('Location request error:', error);
      setIsLoadingLocation(false);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    }
  };

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

    const openTimeHi = (openTime || '09:30').trim() || '09:30';
    const closeTimeHi = (closeTime || '18:30').trim() || '18:30';

    setIsSaving(true);
    try {
      const result = await authService.editOwnerProfile(
        trimmedName,
        digits,
        address.trim(),
        city.trim(),
        zip.trim(),
        latitude,
        longitude,
        is24hOpen,
        is24hOpen ? '00:00' : openTimeHi,
        is24hOpen ? '23:59' : closeTimeHi,
        weekoffDays.length > 0 ? weekoffDays : undefined,
        businessName.trim() || undefined
      );
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

      // Use latest user from storage so login response / stored user is single source of truth everywhere
      const latestUser = await authService.getUser();
      const updatedOwner = latestUser ?? result.user ?? storedOwner;
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: insets.top + Platform.select({ ios: 0.5, android: 0.5 }),
        }
      ]}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Business Profile</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <Ionicons name="storefront" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Business Information</Text>
          </View>
          <EditableField
            label="Business Name"
            icon="business-outline"
            value={businessName}
            onChangeText={setBusinessName}
          />
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
          
          {/* Address Field with Location Button */}
          <View style={styles.infoField}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Center Address</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
                activeOpacity={0.7}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color={BLUE_COLOR} />
                ) : (
                  <Ionicons name="location" size={18} color={BLUE_COLOR} />
                )}
                <Text style={styles.locationButtonText}>
                  {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputShell}>
              <Ionicons name="home-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.valueText, styles.editableInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter center address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          <View style={styles.horizontalRow}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputShell}>
                <Ionicons name="business-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.valueText, styles.editableInput]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Zip Code</Text>
              <View style={styles.inputShell}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.valueText, styles.editableInput]}
                  value={zip}
                  onChangeText={setZip}
                  placeholder="Enter zip code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Display coordinates if available */}
          {(latitude !== null || longitude !== null) && (
            <View style={styles.coordinatesContainer}>
              <Ionicons name="navigate-outline" size={16} color="#6B7280" />
              <Text style={styles.coordinatesText}>
                Coordinates: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </Text>
            </View>
          )}
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
            <Switch
              value={is24hOpen}
              onValueChange={setIs24hOpen}
              trackColor={{ false: '#D1D5DB', true: `${BLUE_COLOR}33` }}
              thumbColor={is24hOpen ? BLUE_COLOR : '#F4F5F7'}
            />
          </View>
          <View style={styles.horizontalRow}>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Opening Time (H:i)</Text>
              <View style={styles.inputShell}>
                <Ionicons name="time-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.valueText, styles.editableInput]}
                  value={openTime}
                  onChangeText={setOpenTime}
                  placeholder="09:30"
                  placeholderTextColor="#9CA3AF"
                  editable={!is24hOpen}
                />
              </View>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.label}>Closing Time (H:i)</Text>
              <View style={styles.inputShell}>
                <Ionicons name="time-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.valueText, styles.editableInput]}
                  value={closeTime}
                  onChangeText={setCloseTime}
                  placeholder="18:30"
                  placeholderTextColor="#9CA3AF"
                  editable={!is24hOpen}
                />
              </View>
            </View>
          </View>
          <View style={styles.infoField}>
            <Text style={styles.label}>Week-off Days</Text>
            <View style={styles.weekoffChipsRow}>
              {WEEKDAYS.map((day) => {
                const selected = weekoffDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.weekoffChip, selected && styles.weekoffChipSelected]}
                    onPress={() => {
                      if (selected) {
                        setWeekoffDays(weekoffDays.filter((d) => d !== day));
                      } else {
                        setWeekoffDays([...weekoffDays, day].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.weekoffChipText, selected && styles.weekoffChipTextSelected]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingBottom: Platform.select({ ios: 6, android: 5 }),
    paddingTop: 0,
    borderBottomWidth: 1,
  },
  backButton: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.screenTitleSmall,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: Platform.select({ ios: 36, android: 32 }),
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.select({ 
      ios: 100,
      android: 90
    }),
    backgroundColor: 'transparent',
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
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
  },
  infoField: {
    marginBottom: 20,
  },
  label: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
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
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
  },
  switchDescription: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 4,
  },
  weekoffChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  weekoffChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  weekoffChipSelected: {
    borderColor: BLUE_COLOR,
    backgroundColor: '#EFF6FF',
  },
  weekoffChipText: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  weekoffChipTextSelected: {
    color: BLUE_COLOR,
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
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
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    color: '#6B7280',
  },
  statValue: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
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
    borderRadius: Platform.select({ ios: 30, android: 28 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    paddingHorizontal: Platform.select({ ios: 24, android: 20 }),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.select({ ios: 56, android: 52 }),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    textAlign: 'center',
    lineHeight: Platform.select({ ios: 24, android: 22 }),
    includeFontPadding: false,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: BLUE_COLOR + '40',
    gap: 6,
  },
  locationButtonText: {
    fontSize: FONT_SIZES.LABEL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: BLUE_COLOR,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  coordinatesText: {
    fontSize: FONT_SIZES.LABEL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
    flex: 1,
  },
});

export default OwnerEditProfileScreen;


