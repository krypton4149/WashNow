import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top']}
    >
      {/* Header */}
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

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary Section */}
        <View style={styles.profileSummary}>
          <View style={styles.profileImageTouchable}>
            <View style={[styles.profileImageWrapper, { backgroundColor: colors.surface }]}>
              <Text style={[styles.profileInitials, { color: colors.text }]}>{initials}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.button }]}>
                <Ionicons name="shield-checkmark" size={14} color={colors.buttonText} />
              </View>
            </View>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayEmail || 'No email provided'}</Text>
          </View>
        </View>

        {/* Contact Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Details</Text>
          
          <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.contactIcon, { backgroundColor: colors.background }]}>
              <Ionicons name="call-outline" size={20} color={colors.button} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Phone Number</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>
                {displayPhone || 'Not provided'}
              </Text>
            </View>
          </View>

          <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.contactIcon, { backgroundColor: colors.background }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.button} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Member Since</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>{memberSinceDate}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
              onPress={onBookingHistory}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="refresh-circle" size={28} color={colors.button} />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>Booking History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
              onPress={onHelpSupport}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="help-circle-outline" size={28} color={colors.button} />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>Help & Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
              onPress={onSettings}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="settings-outline" size={28} color={colors.button} />
              </View>
              <Text style={[styles.quickActionText, { color: colors.text }]}>Settings</Text>
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
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0, // Bottom padding handled by bottomSpacing
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingTop: 8,
  },
  profileImageTouchable: {
    marginRight: 16,
  },
  profileImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
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
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
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