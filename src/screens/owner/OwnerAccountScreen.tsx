import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import OwnerEditProfileScreen from './OwnerEditProfileScreen';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';
const DARK_BLUE = '#0277BD';

interface OwnerAccountScreenProps {
  onBack?: () => void;
  userData?: any;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenSupport?: () => void;
}

const OwnerAccountScreen: React.FC<OwnerAccountScreenProps> = ({
  onBack,
  userData,
  onEditProfile,
  onOpenSettings,
  onOpenSupport,
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

  const business = {
    name: getString('Premium Auto Wash',
      profile?.businessName,
      profile?.business_name,
      profile?.companyName,
      profile?.company_name,
      profile?.shopName,
      profile?.shop_name,
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
      profile?.status,
      profile?.accountStatus,
      storedOwnerData?.status
    ),
    weekOffDays: (() => {
      if (Array.isArray(profile?.weekoff_days) && profile.weekoff_days.length > 0) {
        return profile.weekoff_days.filter(Boolean).join(', ');
      }
      if (Array.isArray(storedOwnerData?.weekoff_days) && storedOwnerData.weekoff_days.length > 0) {
        return storedOwnerData.weekoff_days.filter(Boolean).join(', ');
      }
      const fallback = getString('Not provided',
        profile?.weekOffDays,
        profile?.weekoffDays,
        storedOwnerData?.weekOffDays,
        storedOwnerData?.weekoffDays
      );
      return fallback;
    })(),
    hours: profile?.hours || storedOwnerData?.hours || {
      days: 'Monday - Saturday',
      open: '09:00 AM',
      close: '06:00 PM',
    },
    services: profile?.services || storedOwnerData?.services || ['Exterior Wash', 'Interior Clean', 'Waxing', 'Detailing', 'Polish'],
  };

  console.log('[OwnerAccountScreen] resolved profile data:', { profile, business });

  const contactDetails = [
    {
      id: 'phone',
      icon: 'call-outline',
      label: 'Phone',
      value: business.phone,
    },
    {
      id: 'email',
      icon: 'mail-outline',
      label: 'Email',
      value: business.email,
    },
    {
      id: 'address',
      icon: 'location-outline',
      label: 'Address',
      value: business.address,
    },
  ];


  if (business.weekOffDays && business.weekOffDays !== 'Not provided') {
    contactDetails.push({
      id: 'weekoff',
      icon: 'calendar-outline',
      label: 'Week Off Days',
      value: business.weekOffDays,
    });
  }

  const handleEditProfilePress = () => {
    setIsEditingProfile(true);
    onEditProfile?.();
  };

  const handleProfileSaved = (updatedOwner: any) => {
    setStoredOwnerData(updatedOwner);
    setIsEditingProfile(false);
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
      {/* Blue Gradient Header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerNav}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <View style={styles.backButtonCircle}>
                <Ionicons name="chevron-back" size={20} color="#000000" />
              </View>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.editButtonCircle}>
              <Ionicons name="pencil" size={18} color="#000000" />
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
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="storefront" size={60} color="#FFFFFF" />
              </View>
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
        {/* Contact Information Card */}
        <View style={styles.sectionCard}>
          {contactDetails.map((detail, index) => (
            <View key={detail.id}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
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

        {/* Account Status Card */}
        {business.status && business.status !== 'Not provided' && (
          <View style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.sectionTitle}>Account Status</Text>
                <Text style={styles.infoValue}>{business.status}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Working Hours Card */}
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
          <View style={styles.hoursRow}>
            <Text style={styles.hoursDays}>{business.hours.days}</Text>
            <Text style={styles.hoursTime}>{`${business.hours.open} - ${business.hours.close}`}</Text>
          </View>
        </View>

        {/* Services Offered Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="briefcase-outline" size={18} color={BLUE_COLOR} />
            </View>
            <Text style={styles.sectionTitle}>Services Offered</Text>
          </View>
          <View style={styles.servicesContainer}>
            {business.services.map((service: string) => (
              <View key={service} style={styles.serviceChip}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
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
    backgroundColor: BLUE_COLOR,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 1,
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
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    color: '#FFFFFF',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#FFFFFF',
  },
  profileHeader: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessName: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_BOLD,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    color: '#E3F2FD',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingCount: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderRadius: 22,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#111827',
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activeText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#6B7280',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursDays: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  hoursTime: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    marginBottom: 10,
  },
  serviceText: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    color: '#111827',
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#111827',
  },
});

export default OwnerAccountScreen;
