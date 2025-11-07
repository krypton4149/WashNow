import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import BottomTabBar from '../../components/BottomTabBar';


interface UserData {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  type?: string;
  carModel?: string;
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
            <TouchableOpacity onPress={onBack} style={styles.headerButton} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerButton} onPress={onEditProfile} activeOpacity={0.7}>
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
    <SafeAreaView 
      style={[styles.container, { backgroundColor: '#FFFFFF' }]} 
      edges={['top', 'bottom']}
    >
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
              <Ionicons name="call-outline" size={24} color="#FFFFFF" />
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
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Member Since</Text>
              <Text style={styles.contactValue}>{memberSinceDate}</Text>
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
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="refresh-circle" size={28} color="#374151" />
              </View>
              <Text style={styles.quickActionText}>Booking History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={onHelpSupport}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="help-circle-outline" size={28} color="#374151" />
              </View>
              <Text style={styles.quickActionText}>Help & Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={onSettings}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="settings-outline" size={28} color="#374151" />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={[styles.editProfileButton, { backgroundColor: colors.surface }]}
          onPress={onEditProfile}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.editProfileButtonText, { color: colors.text }]}>Edit Profile</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBackgroundSection: {
    width: '100%',
    minHeight: 220,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    paddingTop: 12,
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
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
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
  verifiedBadgeBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3366FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmailLight: {
    fontSize: 14,
    letterSpacing: 0.2,
    color: '#E5E7EB',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
    color: '#000000',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contactIconPhone: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactIconCalendar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    color: '#000000',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
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
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;