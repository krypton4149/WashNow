import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import BottomTabBar from '../../components/BottomTabBar';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';


interface UserData {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  type?: string;
  carModel?: string;
  carmake?: string;
  carmodel?: string;
  vehicle_no?: string;
  licensePlate?: string;
  status?: string;
  createdAt?: string;
}

interface Props {
  onBack?: () => void;
  onEditProfile?: () => void;
  onBookingHistory?: () => void;
  onHelpSupport?: () => void;
  onSettings?: () => void;
  userData?: UserData | null;
  onRefresh?: () => void;
  onTabChange?: (tab: 'home' | 'bookings' | 'activity' | 'account') => void;
  activeTab?: 'home' | 'bookings' | 'activity' | 'account';
}

const ProfileScreen: React.FC<Props> = ({
  onBack,
  onEditProfile,
  onBookingHistory,
  onHelpSupport,
  onSettings,
  userData: propUserData,
  onRefresh,
  onTabChange,
  activeTab = 'account',
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserData | null>(propUserData || null);
  const [isLoading, setIsLoading] = useState(!propUserData);

  // Refresh function to reload user data
  const refreshUserData = async () => {
    try {
      const refreshedUser = await authService.getUser();
      if (refreshedUser) {
        console.log('Refreshing profile data:', refreshedUser);
        setUserData(refreshedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Load user data from storage on mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Update userData when prop changes
  useEffect(() => {
    if (propUserData) {
      setUserData(propUserData);
    } else {
      refreshUserData();
    }
  }, [propUserData]);

  // Refresh data when component mounts or becomes visible (when returning from edit screen)
  useEffect(() => {
    // Immediate refresh
    refreshUserData();
    onRefresh?.();
    
    // Also refresh after a short delay to ensure AsyncStorage is fully updated
    const refreshTimer = setTimeout(() => {
      refreshUserData();
      onRefresh?.();
    }, 500);
    
    return () => clearTimeout(refreshTimer);
  }, []); // Run on mount

  // Load user data from AsyncStorage if not provided via props
  const loadUserData = async () => {
    try {
      if (!propUserData) {
        const storedUser = await authService.getUser();
        if (storedUser) {
          setUserData(storedUser);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Helper function to get first letter of first name and last name
  const getInitials = (name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // Get first letter of first name and first letter of last name
    const firstName = words[0].charAt(0).toUpperCase();
    const lastName = words[words.length - 1].charAt(0).toUpperCase();
    return firstName + lastName;
  };

  // Display values from userData (from login API)
  const displayName = userData?.fullName || userData?.name || 'User';
  const displayEmail = userData?.email || '';
  const displayPhone = userData?.phoneNumber || userData?.phone || '';
  const initials = getInitials(displayName);

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        edges={['top']}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.headerButtonWhite} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerButtonBlack} onPress={onEditProfile} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }


  // Calculate member since date from account creation date
  const getMemberSinceDate = (): string => {
    try {
      if (userData?.createdAt) {
        const createdDate = new Date(userData.createdAt);
        if (!isNaN(createdDate.getTime())) {
          const month = createdDate.toLocaleString('default', { month: 'long' });
          const currentYear = new Date().getFullYear();
          return `${month} ${currentYear}`;
        }
      }
      // Fallback: if no creation date, use current month and year
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    } catch (error) {
      // Final fallback
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    }
  };

  const memberSinceDate = getMemberSinceDate();

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      {/* Blurred Background Section at Top */}
      <View style={styles.topBackgroundSection}>
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1642520922834-2494eb4c1d73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwcGF0dGVybnxlbnwxfHx8fDE3NjI0MTAxMzN8MA&ixlib=rb-4.1.0&q=80&w=1080'
          }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          blurRadius={20}
        >
          {/* Semi-transparent overlay for better readability and blur effect */}
          <View style={styles.overlay} />
        </ImageBackground>
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.headerButtonWhite} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerButtonBlack} onPress={onEditProfile} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Summary Section */}
        <View style={styles.profileSummary}>
          <View style={styles.profileImageTouchable}>
            <View style={styles.profileImageWrapper}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userNameWhite}>{displayName}</Text>
              <View style={styles.verifiedBadgeBlue}>
                <Ionicons name="shield-outline" size={14} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.userEmailLight}>{displayEmail || 'No email provided'}</Text>
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeAreaBottom} edges={['bottom']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <View style={styles.contactCard}>
            <View style={styles.contactIconPhone}>
              <View style={styles.phoneGradientBackground} />
              <View style={styles.phoneGradientOverlay} />
              <Ionicons name="call-outline" size={16} color="#FFFFFF" style={styles.iconContent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue}>
                {displayPhone || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactIconCalendar}>
              <View style={styles.calendarGradientBackground} />
              <View style={styles.calendarGradientOverlay} />
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={styles.iconContent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Member Since</Text>
              <Text style={styles.contactValue}>{memberSinceDate}</Text>
            </View>
          </View>
        </View>

        {/* Car Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Car Details</Text>
          
          <View style={styles.contactCard}>
            <View style={styles.contactIconCar}>
              <View style={styles.carGradientBackground} />
              <View style={styles.carGradientOverlay} />
              <Ionicons name="car-outline" size={16} color="#FFFFFF" style={styles.iconContent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Vehicle Number</Text>
              <Text style={styles.contactValue}>
                {userData?.vehicle_no || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactIconCarMake}>
              <View style={styles.carMakeGradientBackground} />
              <View style={styles.carMakeGradientOverlay} />
              <Ionicons name="construct-outline" size={16} color="#FFFFFF" style={styles.iconContent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Car Make</Text>
              <Text style={styles.contactValue}>
                {userData?.carmake || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactIconCarModel}>
              <View style={styles.carModelGradientBackground} />
              <View style={styles.carModelGradientOverlay} />
              <Ionicons name="car-sport-outline" size={16} color="#FFFFFF" style={styles.iconContent} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Car Model</Text>
              <Text style={styles.contactValue}>
                {userData?.carmodel || 'Not provided'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={onBookingHistory}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <View style={styles.quickActionIconGradient} />
                <Ionicons name="refresh-circle" size={20} color="#000000" style={styles.quickActionIconContent} />
              </View>
              <Text style={styles.quickActionText}>Booking History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={onHelpSupport}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <View style={styles.quickActionIconGradient} />
                <Ionicons name="help-circle-outline" size={20} color="#000000" style={styles.quickActionIconContent} />
              </View>
              <Text style={styles.quickActionText}>Help & Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={onSettings}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <View style={styles.quickActionIconGradient} />
                <Ionicons name="settings-outline" size={20} color="#000000" style={styles.quickActionIconContent} />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={[styles.editProfileButton, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }]}
          onPress={onEditProfile}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#000000" />
          <Text style={[styles.editProfileButtonText, { color: '#000000' }]}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      {onTabChange && (
        <BottomTabBar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    paddingTop: 0,
  },
  topBackgroundSection: {
    width: '100%',
    minHeight: 220,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  headerButtonWhite: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  headerButtonBlack: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaBottom: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 0, // Bottom padding handled by bottomSpacing
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  profileImageTouchable: {
    marginRight: 16,
  },
  profileImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
    fontFamily: FONTS.INTER_BOLD,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    paddingTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userNameWhite: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
    color: '#FFFFFF',
    fontFamily: FONTS.MONTserrat_BOLD,
  },
  verifiedBadgeBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmailLight: {
    fontSize: FONT_SIZES.BODY_SMALL,
    letterSpacing: 0.2,
    color: '#E5E7EB',
    fontFamily: FONTS.INTER_REGULAR,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
    color: '#000000',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIconPhone: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  phoneGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BLUE_COLOR,
  },
  phoneGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#0369a1',
    opacity: 0.6,
  },
  contactIconCalendar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: YELLOW_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  calendarGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: YELLOW_COLOR,
  },
  calendarGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#fbbf24',
    opacity: 0.6,
  },
  contactIconCar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  carGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
  },
  carGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#059669',
    opacity: 0.6,
  },
  contactIconCarMake: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  carMakeGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
  },
  carMakeGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#7C3AED',
    opacity: 0.6,
  },
  contactIconCarModel: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  carModelGradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
  },
  carModelGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#D97706',
    opacity: 0.6,
  },
  iconContent: {
    position: 'relative',
    zIndex: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 2,
    letterSpacing: 0.2,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  contactValue: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 0.2,
    fontFamily: FONTS.INTER_REGULAR,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  quickActionIconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  quickActionIconContent: {
    position: 'relative',
    zIndex: 1,
  },
  quickActionText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
    color: '#000000',
    fontFamily: FONTS.INTER_REGULAR,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editProfileButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 0.3,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  bottomSpacing: {
    minHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
});

export default ProfileScreen;