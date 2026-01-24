import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
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
  const hasMountedRef = useRef(false);
  
  // Car details editing state
  const [showCarDetailsModal, setShowCarDetailsModal] = useState(false);
  const [editingField, setEditingField] = useState<'vehicle_no' | 'carmake' | 'carmodel' | null>(null);
  const [carDetails, setCarDetails] = useState({
    vehicle_no: '',
    carmake: '',
    carmodel: '',
  });
  const [isSavingCarDetails, setIsSavingCarDetails] = useState(false);

  // Refresh function to reload user data
  const refreshUserData = useCallback(async () => {
    try {
      const refreshedUser = await authService.getUser();
      if (refreshedUser) {
        // Only update if data actually changed to prevent flicker
        setUserData(prevData => {
          if (JSON.stringify(prevData) === JSON.stringify(refreshedUser)) {
            return prevData;
          }
          return refreshedUser;
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, []);

  // Consolidated effect to load and update user data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // If propUserData is provided, use it directly
      if (propUserData) {
        if (isMounted) {
          // Only update if data actually changed
          setUserData(prevData => {
            if (JSON.stringify(prevData) === JSON.stringify(propUserData)) {
              return prevData;
            }
            return propUserData;
          });
          setIsLoading(false);
        }
        return;
      }

      // Otherwise, load from storage
      try {
        const storedUser = await authService.getUser();
        if (isMounted && storedUser) {
          // Only update if data actually changed
          setUserData(prevData => {
            if (JSON.stringify(prevData) === JSON.stringify(storedUser)) {
              return prevData;
            }
            return storedUser;
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [propUserData]);

  // Only refresh on mount if not already loaded
  useEffect(() => {
    if (!hasMountedRef.current && !isLoading && userData) {
      hasMountedRef.current = true;
      // Silent refresh in background without causing flicker
      refreshUserData();
    }
  }, [isLoading, userData, refreshUserData]);

  // Initialize car details from userData
  useEffect(() => {
    if (userData) {
      setCarDetails({
        vehicle_no: userData.vehicle_no || '',
        carmake: userData.carmake || '',
        carmodel: userData.carmodel || '',
      });
    }
  }, [userData]);

  // Handle opening edit modal for car details
  const handleEditCarDetail = (field: 'vehicle_no' | 'carmake' | 'carmodel') => {
    setEditingField(field);
    setShowCarDetailsModal(true);
  };

  // Handle saving car details
  const handleSaveCarDetails = async () => {
    if (!editingField) return;

    setIsSavingCarDetails(true);
    try {
      // Update local user data
      const updatedUserData = {
        ...userData,
        [editingField]: carDetails[editingField],
      };

      // Save to AsyncStorage
      await authService.setUser(updatedUserData);
      setUserData(updatedUserData);

      // Show success message
      Alert.alert('Success', 'Car details updated successfully!');
      setShowCarDetailsModal(false);
      setEditingField(null);
      
      // Refresh user data
      refreshUserData();
    } catch (error) {
      console.error('Error saving car details:', error);
      Alert.alert('Error', 'Failed to save car details. Please try again.');
    } finally {
      setIsSavingCarDetails(false);
    }
  };


  // Helper function to get first letter of first name and last name
  const getInitials = useCallback((name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // Get first letter of first name and first letter of last name
    const firstName = words[0].charAt(0).toUpperCase();
    const lastName = words[words.length - 1].charAt(0).toUpperCase();
    return firstName + lastName;
  }, []);

  // Memoize display values to prevent unnecessary recalculations
  const displayName = useMemo(() => userData?.fullName || userData?.name || 'User', [userData?.fullName, userData?.name]);
  const displayEmail = useMemo(() => userData?.email || '', [userData?.email]);
  const displayPhone = useMemo(() => userData?.phoneNumber || userData?.phone || '', [userData?.phoneNumber, userData?.phone]);
  const initials = useMemo(() => getInitials(displayName), [displayName, getInitials]);

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        edges={['top']}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerButtonEdit} onPress={onEditProfile} activeOpacity={0.8}>
              <View style={[styles.editIconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="create-outline" size={20} color={BLUE_COLOR} />
              </View>
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
          source={require('../../assets/images/Profile.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          blurRadius={0}
          imageStyle={{ opacity: 1.0 }}
        >
          {/* Light overlay for text readability */}
          <View style={styles.overlay} />
        </ImageBackground>
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerButtonEdit} onPress={onEditProfile} activeOpacity={0.8}>
              <View style={styles.editIconContainer}>
                <Ionicons name="create-outline" size={20} color={BLUE_COLOR} />
              </View>
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
                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.userEmailLight}>{displayEmail || 'No email provided'}</Text>
          </View>
        </View>
      </View>

      <SafeAreaView style={styles.safeAreaBottom} edges={['bottom']}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          onTabChange && styles.contentContainerWithTabBar
        ]}
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
          
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleEditCarDetail('vehicle_no')}
            activeOpacity={0.7}
          >
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
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleEditCarDetail('carmake')}
            activeOpacity={0.7}
          >
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
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleEditCarDetail('carmodel')}
            activeOpacity={0.7}
          >
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
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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

      </ScrollView>

      {/* Bottom Tab Bar */}
      {onTabChange && (
        <BottomTabBar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
        />
      )}

      {/* Car Details Edit Modal */}
      <Modal
        visible={showCarDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCarDetailsModal(false);
          setEditingField(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit {editingField === 'vehicle_no' ? 'Vehicle Number' : editingField === 'carmake' ? 'Car Make' : 'Car Model'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCarDetailsModal(false);
                  setEditingField(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                {editingField === 'vehicle_no' ? 'Vehicle Number' : editingField === 'carmake' ? 'Car Make' : 'Car Model'}
              </Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.surface || '#F3F4F6',
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={editingField ? carDetails[editingField] : ''}
                onChangeText={(text) => {
                  if (editingField) {
                    setCarDetails({ ...carDetails, [editingField]: text });
                  }
                }}
                placeholder={`Enter ${editingField === 'vehicle_no' ? 'vehicle number' : editingField === 'carmake' ? 'car make' : 'car model'}`}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize={editingField === 'vehicle_no' ? 'characters' : 'words'}
              />
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCarDetailsModal(false);
                  setEditingField(null);
                  // Reset to original values
                  if (userData) {
                    setCarDetails({
                      vehicle_no: userData.vehicle_no || '',
                      carmake: userData.carmake || '',
                      carmodel: userData.carmodel || '',
                    });
                  }
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: BLUE_COLOR }]}
                onPress={handleSaveCarDetails}
                disabled={isSavingCarDetails}
              >
                {isSavingCarDetails ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    minHeight: 160,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 88, 168, 0.1)', // Light overlay for text readability only
  },
  header: {
    paddingTop: 0,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  headerButtonEdit: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaBottom: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16, // Reduced from 20
    paddingTop: 20, // Reduced from 24
    paddingBottom: 20, // Reduced from 24
  },
  contentContainerWithTabBar: {
    paddingBottom: 120,
  },
  profileSummary: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingTop: 2,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
    width: '100%', // Full width to ensure proper centering
  },
  profileImageTouchable: {
    marginBottom: 10,
  },
  profileImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  profileInitials: {
    fontSize: 28,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    width: '100%', // Full width to ensure proper centering
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the name and badge
    marginBottom: 8,
    width: '100%', // Full width to ensure proper centering
  },
  userNameWhite: {
    fontSize: 26, // Increased from 22px to 26px
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
    color: '#FFFFFF', // White color
    fontFamily: FONTS.MONTserrat_BOLD,
    textAlign: 'center',
  },
  verifiedBadgeBlue: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  userEmailLight: {
    fontSize: 16, // Increased from 14px to 16px
    letterSpacing: 0.2,
    color: '#FFFFFF', // White color
    fontFamily: FONTS.INTER_MEDIUM, // Changed to MEDIUM for better visibility
    fontWeight: '500', // Increased from 400 to 500
    textAlign: 'center',
  },
  section: {
    marginBottom: 20, // Reduced from 28
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
    borderRadius: 14, // Increased for modern look
    padding: 12, // Reduced from 16
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    width: 40, // Slightly increased for better visual
    height: 40,
    borderRadius: 10, // Increased for modern look
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
    width: 40, // Slightly increased for better visual
    height: 40,
    borderRadius: 10, // Increased for modern look
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
    width: 40, // Slightly increased for better visual
    height: 40,
    borderRadius: 10, // Increased for modern look
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
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Contact label
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 2,
    letterSpacing: 0.2,
    fontFamily: FONTS.INTER_REGULAR,
  },
  contactValue: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Contact value
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
    borderRadius: 14, // Reduced from 16
    padding: 12, // Reduced from 16
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 40, // Reduced from 44
    height: 40,
    borderRadius: 10, // Reduced from 12
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
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Quick action text
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Loading text
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.select({ ios: 34, android: 24 }),
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONTS.INTER_REGULAR,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.select({ ios: 0, android: 8 }),
    borderTopWidth: 1,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
});

export default ProfileScreen;