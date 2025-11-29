import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import OwnerEditProfileScreen from './OwnerEditProfileScreen';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';

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

  if (business.status && business.status !== 'Not provided') {
    contactDetails.push({
      id: 'status',
      icon: 'shield-checkmark-outline',
      label: 'Account Status',
      value: business.status,
    });
  }

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfilePress}
        >
          <Ionicons
            name="pencil-outline"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.text} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
          </View>
        )}

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#2563EB' ? '#000' : '#020617' }]}>
          <View style={styles.avatar}>
            <Ionicons name="storefront-outline" size={36} color={colors.textSecondary} />
          </View>
          <Text style={[styles.businessName, { color: colors.text }]}>{business.name}</Text>
          <Text style={[styles.ownerName, { color: colors.textSecondary }]}>{business.ownerName}</Text>
          <View style={styles.ratingRow}>
            <Text style={[styles.bookingCount, { color: colors.textSecondary }]}>{`${business.totalBookings} bookings`}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#2563EB' ? '#000' : '#020617' }]}>
          {contactDetails.map((detail, index) => (
            <View key={detail.id}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name={detail.icon} size={20} color={colors.text} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{detail.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{detail.value}</Text>
                </View>
              </View>
              {index < contactDetails.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#2563EB' ? '#000' : '#020617' }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}>
                <Ionicons name="time-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{'Working Hours'}</Text>
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewText}>Preview</Text>
            </View>
          </View>
          <View style={styles.hoursRow}>
            <Text style={[styles.hoursDays, { color: colors.textSecondary }]}>{business.hours.days}</Text>
            <Text style={[styles.hoursTime, { color: colors.text }]}>{`${business.hours.open} - ${business.hours.close}`}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#2563EB' ? '#000' : '#020617' }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons name="briefcase-outline" size={18} color={colors.text} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{'Services Offered'}</Text>
          </View>
          <View style={styles.servicesContainer}>
            {business.services.map((service: string) => (
              <View key={service} style={[styles.serviceChip, { borderColor: colors.border }]}>
                <Text style={[styles.serviceText, { color: colors.text }]}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.button === '#2563EB' ? '#000' : '#020617' }]}>
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemTop, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            onPress={onOpenSettings}
            disabled={!onOpenSettings}
          >
            <View style={styles.actionItemLeft}>
              <View style={styles.actionIcon}>
                <Ionicons name="settings-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{'Settings'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemBottom, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            onPress={onOpenSupport}
            disabled={!onOpenSupport}
          >
            <View style={styles.actionItemLeft}>
              <View style={styles.actionIcon}>
                <Ionicons name="help-circle-outline" size={18} color={colors.text} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{'Help & Support'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 22, android: 20 }),
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 18, android: 17 }),
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 22, android: 20 }),
    paddingTop: Platform.select({ ios: 12, android: 10 }),
    paddingBottom: Platform.select({ 
      ios: 80, // Extra padding for iOS devices (5.4", 6.1", 6.3", 6.4", 6.5", 6.7")
      android: 70 // Extra padding for Android devices (5.4", 5.5", 6.1", 6.3", 6.4", 6.5", 6.7")
    }),
  },
  loadingContainer: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    paddingHorizontal: Platform.select({ ios: 16, android: 14 }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: Platform.select({ ios: 0.04, android: 0.03 }),
    shadowRadius: Platform.select({ ios: 8, android: 6 }),
    shadowOffset: { width: 0, height: Platform.select({ ios: 3, android: 2 }) || 2 },
    elevation: Platform.select({ ios: 0, android: 1 }),
    marginBottom: Platform.select({ ios: 14, android: 12 }),
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  businessName: {
    fontSize: Platform.select({ ios: 20, android: 18 }),
    fontWeight: '600',
    color: '#111827',
  },
  ownerName: {
    fontSize: Platform.select({ ios: 15, android: 14 }),
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bookingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    padding: Platform.select({ ios: 14, android: 12 }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: Platform.select({ ios: 0.04, android: 0.03 }),
    shadowRadius: Platform.select({ ios: 8, android: 6 }),
    shadowOffset: { width: 0, height: Platform.select({ ios: 3, android: 2 }) || 2 },
    elevation: Platform.select({ ios: 0, android: 1 }),
    marginBottom: Platform.select({ ios: 14, android: 12 }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Platform.select({ ios: 15, android: 14 }),
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  previewPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  previewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  hoursRow: {
    marginTop: 4,
    gap: 6,
  },
  hoursDays: {
    fontSize: 14,
    color: '#6B7280',
  },
  hoursTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default OwnerAccountScreen;
