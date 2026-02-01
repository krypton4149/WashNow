import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar, ImageBackground } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import OwnerEditProfileScreen from './OwnerEditProfileScreen';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';
const DARK_BLUE = '#0277BD';

const WEEKDAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Parse "Monday, Tuesday, ..." into normalized day names for comparison */
function parseWeekOffDays(weekOffStr: string | undefined): Set<string> {
  const set = new Set<string>();
  if (!weekOffStr || typeof weekOffStr !== 'string' || weekOffStr === 'Not provided') return set;
  const parts = weekOffStr.split(/[,&]/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const normalized = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    if (WEEKDAYS_ORDER.includes(normalized)) set.add(normalized);
  }
  return set;
}

/** Normalize weekoff_days from API (array or string) to display string. Use for real-time login + edit. */
function normalizeWeekoffDaysToDisplay(value: any): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).map((s: any) => String(s).trim()).filter(Boolean).join(', ');
  if (typeof value === 'string') return value.split(/[,&]/).map((s: string) => s.trim()).filter(Boolean).join(', ');
  return '';
}

/** Get working days label by excluding week-off days (e.g. "Friday - Saturday" when Mon–Thu are off) */
function getWorkingDaysLabel(weekOffDays: string | undefined, fallbackDays: string): string {
  const offSet = parseWeekOffDays(weekOffDays);
  if (offSet.size === 0) return fallbackDays;
  const working = WEEKDAYS_ORDER.filter((d) => !offSet.has(d));
  if (working.length === 0) return 'Closed';
  if (working.length === 1) return working[0];
  const firstIdx = WEEKDAYS_ORDER.indexOf(working[0]);
  const lastIdx = WEEKDAYS_ORDER.indexOf(working[working.length - 1]);
  const contiguous = lastIdx - firstIdx + 1 === working.length;
  if (contiguous) return `${working[0]} - ${working[working.length - 1]}`;
  return working.join(', ');
}

interface OwnerAccountScreenProps {
  onBack?: () => void;
  userData?: any;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
  onOwnerProfileUpdated?: (user: any) => void;
}

const OwnerAccountScreen: React.FC<OwnerAccountScreenProps> = ({
  onBack,
  userData,
  onEditProfile,
  onOpenSettings,
  onOpenSupport,
  onOwnerProfileUpdated,
}) => {
  const { colors } = useTheme();
  const [storedOwnerData, setStoredOwnerData] = useState<any | null>(userData ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [totalBookings, setTotalBookings] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const loadOwnerData = async () => {
      try {
        if (userData) {
          setStoredOwnerData(userData);
          console.log('[OwnerAccountScreen] using prop userData:', userData);
        } else {
          setIsLoading(true);
          const savedUser = await authService.getUser();
          if (!isMounted) {
            return;
          }
          console.log('[OwnerAccountScreen] fetched user from storage:', savedUser);
          setStoredOwnerData(savedUser ?? null);
        }
      } catch (error) {
        console.log('[OwnerAccountScreen] failed to load user:', error);
        if (isMounted) {
          setStoredOwnerData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadBookings = async () => {
      try {
        const result = await authService.getOwnerBookings();
        if (result.success && Array.isArray(result.bookings)) {
          const count = result.bookings.length;
          console.log('[OwnerAccountScreen] Total bookings count:', count);
          setTotalBookings(count);
        } else {
          console.log('[OwnerAccountScreen] Failed to load bookings:', result.error);
          setTotalBookings(0);
        }
      } catch (error) {
        console.error('[OwnerAccountScreen] Error loading bookings:', error);
        setTotalBookings(0);
      }
    };

    loadOwnerData();
    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [userData]);

  const profile = useMemo(() => {
    if (!storedOwnerData || typeof storedOwnerData !== 'object') {
      return {};
    }

    const candidates = [
      storedOwnerData.rawUserData,
      storedOwnerData.userData,
      storedOwnerData.owner,
      storedOwnerData.profile,
      storedOwnerData.data?.userData,
      storedOwnerData.data?.owner,
      storedOwnerData.data,
      storedOwnerData,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object') {
        return candidate;
      }
    }

    return {};
  }, [storedOwnerData]);

  const getString = (fallback: string, ...candidates: any[]): string => {
    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) {
        continue;
      }
      const value = String(candidate).trim();
      if (value.length > 0) {
        return value;
      }
    }
    return fallback;
  };

  const getNumber = (fallback: number, ...candidates: any[]): number => {
    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const parsed = Number(candidate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return fallback;
  };

  // Service centre from owner login API (data.userData.service_centre)
  const serviceCentre = profile?.service_centre || storedOwnerData?.userData?.service_centre || storedOwnerData?.service_centre;

  // Format time from API "09:30:00" -> "09:30 AM"
  const formatTimeForDisplay = (timeStr: string | undefined): string => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    const parts = timeStr.trim().split(':');
    const hour = parseInt(parts[0], 10);
    const min = parts[1] ? parseInt(parts[1], 10) : 0;
    if (Number.isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return min > 0 ? `${hour12}:${String(min).padStart(2, '0')} ${ampm}` : `${hour12} ${ampm}`;
  };

  const business = {
    name: getString('Premium Auto Wash',
      profile?.businessName,
      profile?.business_name,
      profile?.companyName,
      profile?.company_name,
      profile?.shopName,
      profile?.shop_name,
      serviceCentre?.name,
      profile?.name,
      storedOwnerData?.businessName,
      storedOwnerData?.companyName,
      storedOwnerData?.name
    ),
    ownerName: getString('John Doe',
      profile?.ownerName,
      profile?.owner_name,
      profile?.contactName,
      profile?.contact_name,
      profile?.contactPerson,
      profile?.contact_person,
      storedOwnerData?.ownerName,
      storedOwnerData?.owner_name,
      profile?.name
    ),
    totalBookings: totalBookings,
    phone: getString('Not provided',
      serviceCentre?.phone,
      profile?.phone,
      profile?.phoneNumber,
      profile?.phone_number,
      profile?.businessPhone,
      profile?.business_phone,
      storedOwnerData?.phone,
      storedOwnerData?.phoneNumber,
      storedOwnerData?.phone_number
    ),
    email: getString('Not provided',
      serviceCentre?.email,
      profile?.email,
      profile?.contactEmail,
      profile?.contact_email,
      profile?.businessEmail,
      profile?.business_email,
      storedOwnerData?.email,
      storedOwnerData?.contactEmail,
      storedOwnerData?.contact_email
    ),
    address: getString('Not provided',
      serviceCentre?.address,
      profile?.address,
      profile?.businessAddress,
      profile?.business_address,
      profile?.location,
      profile?.streetAddress,
      profile?.street_address,
      storedOwnerData?.address,
      storedOwnerData?.businessAddress,
      storedOwnerData?.business_address
    ),
    status: getString('Not provided',
      serviceCentre?.status,
      profile?.status,
      profile?.accountStatus,
      storedOwnerData?.status
    ),
    weekOffDays: (() => {
      // Prefer service_centre.weekoff_days (login + edit) so login data updates in real time
      const fromServiceCentre = normalizeWeekoffDaysToDisplay(serviceCentre?.weekoff_days);
      if (fromServiceCentre) return fromServiceCentre;
      const fromProfile = normalizeWeekoffDaysToDisplay(profile?.weekoff_days);
      if (fromProfile) return fromProfile;
      const fromStored = normalizeWeekoffDaysToDisplay(storedOwnerData?.weekoff_days);
      if (fromStored) return fromStored;
      const fallback = getString('Not provided',
        profile?.weekOffDays,
        profile?.weekoffDays,
        storedOwnerData?.weekOffDays,
        storedOwnerData?.weekoffDays
      );
      return fallback;
    })(),
    hours: (() => {
      // Prefer service_centre open_time / close_time / is_24h_open from login API
      if (serviceCentre) {
        const is24h = serviceCentre.is_24h_open === true || serviceCentre.is_24h_open === '1';
        if (is24h) {
          return { days: 'Every day', open: '12:00 AM', close: '11:59 PM', is24h: true };
        }
        const open = formatTimeForDisplay(serviceCentre.open_time) || '09:00 AM';
        const close = formatTimeForDisplay(serviceCentre.close_time) || '06:00 PM';
        return { days: 'Monday - Saturday', open, close, is24h: false };
      }
      return profile?.hours || storedOwnerData?.hours || {
        days: 'Monday - Saturday',
        open: '09:00 AM',
        close: '06:00 PM',
        is24h: false,
      };
    })(),
  };

  console.log('[OwnerAccountScreen] resolved profile data:', { profile, business });

  const contactDetails = [
    {
      id: 'phone',
      icon: 'call-outline' as const,
      label: 'Phone',
      value: business.phone,
      iconBgColor: BLUE_COLOR,
    },
    {
      id: 'email',
      icon: 'mail-outline' as const,
      label: 'Email',
      value: business.email,
      iconBgColor: '#8B5CF6',
    },
    {
      id: 'address',
      icon: 'location-outline' as const,
      label: 'Address',
      value: business.address,
      iconBgColor: '#10B981',
    },
  ];


  if (business.weekOffDays && business.weekOffDays !== 'Not provided') {
    contactDetails.push({
      id: 'weekoff',
      icon: 'calendar-outline' as const,
      label: 'Week Off Days',
      value: business.weekOffDays,
      iconBgColor: YELLOW_COLOR,
    });
  }

  const handleEditProfilePress = () => {
    setIsEditingProfile(true);
    onEditProfile?.();
  };

  const handleProfileSaved = (updatedOwner: any) => {
    setStoredOwnerData(updatedOwner);
    setIsEditingProfile(false);
    onOwnerProfileUpdated?.(updatedOwner);
  };

  if (isEditingProfile) {
    return (
      <OwnerEditProfileScreen
        ownerData={storedOwnerData}
        onBack={() => setIsEditingProfile(false)}
        onSave={handleProfileSaved}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      {/* Header with image background (like user account screen) */}
      <View style={styles.headerGradient}>
        <ImageBackground
          source={require('../../assets/images/Profile.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          imageStyle={{ opacity: 1.0 }}
        >
          <View style={styles.headerOverlay} />
        </ImageBackground>
        <View style={styles.headerNav}>
          <View style={styles.headerLeftPlaceholder} />
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.editButtonCircle}>
              <Ionicons name="create-outline" size={20} color={BLUE_COLOR} />
            </View>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <View style={styles.profileHeader}>
            <View style={styles.centerIconContainer}>
              <Ionicons name="storefront" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.ownerName}>{business.ownerName}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.bookingCount}>{business.totalBookings} bookings</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Contact Information Card - colored icons like user account screen */}
        <View style={styles.sectionCard}>
          {contactDetails.map((detail, index) => (
            <View key={detail.id}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: detail.iconBgColor || BLUE_COLOR }]}>
                  <Ionicons name={detail.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{detail.label}</Text>
                  <Text style={styles.infoValue}>{detail.value}</Text>
                </View>
              </View>
              {index < contactDetails.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Account Status Card - colored icon */}
        {business.status && business.status !== 'Not provided' && (
          <View style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.sectionTitle}>Account Status</Text>
                <Text style={styles.infoValue}>{business.status}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Working Hours Card - colored icon */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.workingHoursIcon}>
                <Ionicons name="time" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Working Hours</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
          <View style={styles.hoursContent}>
            <Text style={styles.hoursDays} numberOfLines={2}>
              {getWorkingDaysLabel(business.weekOffDays, business.hours.days)}
            </Text>
            <Text style={styles.hoursTime} numberOfLines={1}>
              {business.hours.is24h ? 'Open 24 hours' : `${business.hours.open} – ${business.hours.close}`}
            </Text>
          </View>
        </View>

        {/* Action Card */}
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemTop]}
            activeOpacity={0.7}
            onPress={onOpenSettings}
            disabled={!onOpenSettings}
          >
            <View style={styles.actionItemLeft}>
              <View style={styles.actionIcon}>
                <Ionicons name="settings-outline" size={18} color={BLUE_COLOR} />
              </View>
              <Text style={styles.actionLabel}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemBottom]}
            activeOpacity={0.7}
            onPress={onOpenSupport}
            disabled={!onOpenSupport}
          >
            <View style={styles.actionItemLeft}>
              <View style={styles.actionIcon}>
                <Ionicons name="help-circle-outline" size={18} color={BLUE_COLOR} />
              </View>
              <Text style={styles.actionLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLUE_COLOR,
    marginTop: 0,
    paddingTop: 0,
  },
  headerGradient: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: BLUE_COLOR,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 14,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 88, 168, 0.35)',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    zIndex: 1,
  },
  headerLeftPlaceholder: {
    width: 40,
    height: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.screenTitle,
    flex: 1,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 1,
  },
  loadingText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 8,
    color: '#FFFFFF',
  },
  profileHeader: {
    alignItems: 'center',
    zIndex: 1,
  },
  centerIconContainer: {
    marginBottom: 8,
    marginTop: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessName: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  ownerName: {
    ...TEXT_STYLES.bodyPrimary,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingCount: {
    ...TEXT_STYLES.bodySecondary,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.select({ 
      ios: 80,
      android: 70
    }),
    backgroundColor: '#F5F5F5',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...TEXT_STYLES.label,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workingHoursIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: YELLOW_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    ...TEXT_STYLES.cardTitleSemiBold,
    fontSize: FONT_SIZES.SECTION_HEADING,
    color: '#111827',
    letterSpacing: -0.3,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activeText: {
    ...TEXT_STYLES.caption,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#6B7280',
  },
  hoursContent: {
    flexDirection: 'column',
  },
  hoursDays: {
    ...TEXT_STYLES.bodyPrimary,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
    marginBottom: 6,
  },
  hoursTime: {
    ...TEXT_STYLES.bodySecondary,
    color: '#6B7280',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  actionItemTop: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  actionItemBottom: {},
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionLabel: {
    ...TEXT_STYLES.cardTitleSemiBold,
    color: '#111827',
  },
});

export default OwnerAccountScreen;
