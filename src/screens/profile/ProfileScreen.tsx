import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const PROFILE_IMAGE_KEY = '@profile_image_uri';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  carModel?: string;
  licensePlate?: string;
  profileImage?: string;
}

interface Props {
  onBack?: () => void;
  onEditProfile?: () => void;
  onBookingHistory?: () => void;
  onHelpSupport?: () => void;
  onSettings?: () => void;
  userData?: UserData | null;
}

const ProfileScreen: React.FC<Props> = ({
  onBack,
  onEditProfile,
  onBookingHistory,
  onHelpSupport,
  onSettings,
  userData,
}) => {
  const { colors } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(userData?.profileImage || null);

  // Load profile image from storage on mount
  useEffect(() => {
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    try {
      const savedImageUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (savedImageUri) {
        setProfileImage(savedImageUri);
      } else if (userData?.profileImage) {
        setProfileImage(userData.profileImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // Helper function to get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Default values if userData is not available
  const displayName = userData?.fullName || 'joe';
  const displayEmail = userData?.email || 'joe@gmail.com';
  const displayPhone = userData?.phoneNumber || '3242424324';
  const initials = getInitials(displayName);

  const handleProfileImagePress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Select an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Choose from Gallery', 
          onPress: () => openImagePicker()
        },
        profileImage ? {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => removeProfileImage()
        } : undefined,
      ].filter(Boolean)
    );
  };

  const openImagePicker = () => {
    // Check if the module is available
    if (!launchImageLibrary) {
      Alert.alert(
        'Error', 
        'Image picker is not available. Please rebuild the app after installing dependencies.',
        [{ text: 'OK' }]
      );
      console.error('react-native-image-picker module not available');
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 512,
      maxHeight: 512,
      selectionLimit: 1,
      includeBase64: false,
    };

    try {
      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          // User cancelled the picker
          return;
        } else if (response.errorMessage) {
          Alert.alert('Error', 'Failed to load image. Please try again.');
          console.error('ImagePicker Error: ', response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (asset && asset.uri) {
          const imageUri = asset.uri;
          setProfileImage(imageUri);
          saveProfileImage(imageUri);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
      console.error('ImagePicker Exception: ', error);
    }
  };

  const saveProfileImage = async (uri: string) => {
    try {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  const removeProfileImage = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      setProfileImage(null);
      Alert.alert('Success', 'Profile picture removed');
    } catch (error) {
      console.error('Error removing profile image:', error);
      Alert.alert('Error', 'Failed to remove profile picture');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.background }]}>Profile</Text>
          <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
            <Ionicons name="create-outline" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            <TouchableOpacity 
              onPress={handleProfileImagePress}
              activeOpacity={0.8}
            >
              <View style={[styles.profilePictureContainer, { backgroundColor: colors.background, borderColor: colors.background }]}>
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.profilePicture, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.profileInitials, { color: colors.text }]}>{initials}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleProfileImagePress}
              activeOpacity={0.8}
              style={[styles.editImageBadgeTouchable, { backgroundColor: colors.button, borderColor: colors.background }]}
            >
              <View style={styles.editImageBadge}>
                <Ionicons name="camera" size={16} color={colors.buttonText} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: colors.background }]}>{displayName}</Text>
        </View>
      </View>

      {/* Content Section with Background */}
      <View style={[styles.contentWrapper, { backgroundColor: colors.background }]}>
        {/* Decorative Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.patternCircle1, { backgroundColor: colors.primary, opacity: 0.03 }]} />
          <View style={[styles.patternCircle2, { backgroundColor: colors.primary, opacity: 0.02 }]} />
          <View style={[styles.patternCircle3, { backgroundColor: colors.primary, opacity: 0.025 }]} />
        </View>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Personal Information Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Information</Text>
            
            <TouchableOpacity style={styles.infoItem} activeOpacity={0.7}>
              <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="mail-outline" size={22} color={colors.button} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{displayEmail}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem} activeOpacity={0.7}>
              <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="call-outline" size={22} color={colors.button} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{displayPhone}</Text>
              </View>
            </TouchableOpacity>
          </View>

        {/* Quick Actions Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={[styles.navItem, styles.enhancedNavItem]} 
            onPress={onBookingHistory}
            activeOpacity={0.7}
          >
            <View style={styles.navItemLeft}>
              <View style={[styles.navItemIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="calendar-outline" size={22} color={colors.button} />
              </View>
              <Text style={[styles.navItemText, { color: colors.text }]}>Booking History</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={[styles.navItem, styles.enhancedNavItem]} 
            onPress={onHelpSupport}
            activeOpacity={0.7}
          >
            <View style={styles.navItemLeft}>
              <View style={[styles.navItemIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="help-circle-outline" size={22} color={colors.button} />
              </View>
              <Text style={[styles.navItemText, { color: colors.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <TouchableOpacity 
            style={[styles.navItem, styles.enhancedNavItem]} 
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <View style={styles.navItemLeft}>
              <View style={[styles.navItemIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="settings-outline" size={22} color={colors.button} />
              </View>
              <Text style={[styles.navItemText, { color: colors.text }]}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Edit Profile Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: colors.button }]} 
            onPress={onEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={20} color={colors.buttonText} style={{ marginRight: 8 }} />
            <Text style={[styles.editProfileButtonText, { color: colors.buttonText }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  editImageBadgeTouchable: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editImageBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  patternCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -50,
  },
  patternCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 100,
    left: -30,
  },
  patternCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 250,
    right: 20,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  enhancedNavItem: {
    paddingVertical: 16,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navItemText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  buttonContainer: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  editProfileButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  editProfileButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;