import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import BottomTabBar from '../../components/BottomTabBar';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  loginType?: string; // loginType from login API
  carModel?: string;
  licensePlate?: string;
  createdAt?: string;
}

interface Props {
  onBack?: () => void;
  onSaveProfile?: (updatedData: UserData) => void;
  userData?: UserData | null;
  onTabChange?: (tab: 'home' | 'bookings' | 'activity' | 'account') => void;
  activeTab?: 'home' | 'bookings' | 'activity' | 'account';
}

const EditProfileScreen: React.FC<Props> = ({
  onBack,
  onSaveProfile,
  userData,
  onTabChange,
  activeTab = 'account',
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Get original values properly
  const getOriginalName = () => userData?.fullName || userData?.name || '';
  const getOriginalPhone = () => userData?.phoneNumber || userData?.phone || '';
  
  const [editedData, setEditedData] = useState({
    fullName: getOriginalName(),
    email: userData?.email || '',
    phoneNumber: getOriginalPhone(),
  });
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get initials from full name
  const getInitials = (name: string) => {
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    const firstName = words[0].charAt(0).toUpperCase();
    const lastName = words[words.length - 1].charAt(0).toUpperCase();
    return firstName + lastName;
  };

  const initials = getInitials(editedData.fullName || userData?.fullName || 'User');

  // Calculate member since date
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
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    } catch (error) {
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    }
  };

  const memberSinceDate = getMemberSinceDate();
  // Get account type from loginType (from login API) or fallback to type
  const accountType = userData?.loginType || userData?.type || 'visitor';
  // Capitalize first letter for display
  const displayAccountType = accountType.charAt(0).toUpperCase() + accountType.slice(1);
  const isVerified = true; // Assuming verified status

  // Validate phone number (exactly 10 digits)
  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const handleSave = async () => {
    // Get original values from userData (using the same method as initialization)
    const originalName = getOriginalName().trim();
    const originalPhone = getOriginalPhone().trim();
    
    // Get current edited values
    const currentName = (editedData.fullName || '').trim();
    const currentPhone = (editedData.phoneNumber || '').trim();
    
    console.log('=== VALIDATION CHECK ===');
    console.log('Original values:', {
      originalName,
      originalNameLength: originalName.length,
      originalPhone,
      originalPhoneLength: originalPhone.length
    });
    console.log('Current edited values:', {
      currentName,
      currentNameLength: currentName.length,
      currentPhone,
      currentPhoneLength: currentPhone.length
    });
    
    // Determine which fields have been changed (compare trimmed values)
    const nameChanged = currentName !== originalName;
    const phoneChanged = currentPhone !== originalPhone;
    
    console.log('Changed status:', {
      nameChanged,
      phoneChanged
    });
    
    // If nothing changed, show message
    if (!nameChanged && !phoneChanged) {
      Alert.alert('No Changes', 'You haven\'t made any changes to save.');
      return;
    }
    
    // Determine final values: use changed value if changed, otherwise use original
    // This allows users to change only name, only phone, or both
    let finalName = nameChanged ? currentName : originalName;
    let finalPhone = phoneChanged ? currentPhone : originalPhone;
    
    // Ensure we have valid values
      if (!finalName || finalName.length === 0) {
      console.log('⚠️ Final name was empty, using original:', originalName);
      finalName = originalName;
    }
    if (!finalPhone || finalPhone.length === 0) {
      console.log('⚠️ Final phone was empty, using original:', originalPhone);
      finalPhone = originalPhone;
    }
    
    finalName = finalName.trim();
    finalPhone = finalPhone.trim();
    
    console.log('=== CLIENT-SIDE VALIDATION ===');
    console.log('Final values to validate:', {
      finalName,
      finalNameLength: finalName.length,
      finalPhone,
      finalPhoneLength: finalPhone.length,
      nameChanged,
      phoneChanged
    });
    
    // Validate ONLY the fields that were changed
    // Name validation removed - user can enter any name
    // If user only changed phone, only validate phone
    // If user changed both, validate phone only
    
    console.log('Name field - no validation (user can enter any name):', {
      finalName,
      nameLength: finalName.length,
      nameChanged
    });
    
    // Validate phone (only if it was changed)
    if (phoneChanged) {
      // Extract only digits from phone number
      const phoneDigits = finalPhone.replace(/\D/g, '');
      
      console.log('Phone validation (changed):', {
        originalPhone: finalPhone,
        digitsOnly: phoneDigits,
        digitsLength: phoneDigits.length
      });
      
      if (!phoneDigits || phoneDigits.length === 0) {
        console.log('❌ VALIDATION FAILED: Changed phone is empty');
        Alert.alert('Validation Error', 'Phone number cannot be empty. Please enter your phone number.');
        return;
      }

      if (phoneDigits.length < 10) {
        console.log('❌ VALIDATION FAILED: Changed phone too short (', phoneDigits.length, 'digits)');
        Alert.alert('Validation Error', 'Phone number must be at least 10 digits.');
        return;
      }
      
      if (phoneDigits.length > 15) {
        console.log('❌ VALIDATION FAILED: Changed phone too long (', phoneDigits.length, 'digits)');
        Alert.alert('Validation Error', 'Phone number is too long. Maximum 15 digits allowed.');
        return;
      }
      
      // Phone should start with a digit 1-9
      if (!/^[1-9]/.test(phoneDigits)) {
        console.log('❌ VALIDATION FAILED: Changed phone does not start with 1-9. First digit:', phoneDigits[0]);
        Alert.alert('Validation Error', 'Phone number must start with a digit 1-9.');
        return;
      }
      console.log('✅ Phone validation passed');
    } else {
      // Phone wasn't changed, extract digits for API but don't validate (it's original)
      console.log('Phone not changed, using original value');
    }

    // Extract digits from phone for API (always send digits only)
    const phoneDigits = finalPhone.replace(/\D/g, '');

    console.log('✅ CLIENT-SIDE VALIDATION PASSED');
    console.log('Final values to send:', {
      name: finalName,
      nameLength: finalName.length,
      phone: phoneDigits,
      phoneLength: phoneDigits.length,
      nameChanged,
      phoneChanged,
      whatChanged: nameChanged && phoneChanged ? 'both' : (nameChanged ? 'name only' : 'phone only')
    });

    setIsLoading(true);
    try {
      console.log('=== SENDING TO API ===');
      console.log('API Request Data:', {
        name: finalName,
        phone: phoneDigits,
        nameChanged,
        phoneChanged,
        nameLength: finalName.length,
        phoneLength: phoneDigits.length,
        originalName,
        originalPhone,
        requestBody: JSON.stringify({
          name: finalName,
          phone: phoneDigits
        })
      });
      
      // Call the API - always send both name and phone (API requires both)
      // But we only validated the changed fields
      const result = await authService.editProfile(
        finalName, 
        phoneDigits
      );

      console.log('=== API RESPONSE RECEIVED ===');
      console.log('Result:', {
        success: result.success,
        error: result.error,
        message: result.message,
        hasValidationErrors: !!result.validationErrors,
        isAuthError: result.isAuthError
      });

      if (result.success) {
        console.log('✅ Profile update successful');
        // Wait a bit for AsyncStorage to be fully updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get updated user data from storage (already updated by editProfile API)
        const updatedUser = await authService.getUser();
        console.log('Updated user from storage after edit:', updatedUser);
        
        // Create updated user data object with latest data from storage
        const updatedUserData = {
          ...userData,
          ...(updatedUser && {
            id: updatedUser.id || userData?.id,
            fullName: updatedUser.fullName || finalName,
            phoneNumber: updatedUser.phoneNumber || phoneDigits,
            email: updatedUser.email || editedData.email || userData?.email,
            type: updatedUser.type || userData?.type,
            status: updatedUser.status || userData?.status,
            createdAt: updatedUser.createdAt || userData?.createdAt,
          }),
        } as UserData;
        
        // Notify parent component about the changes
        onSaveProfile?.(updatedUserData);
        
        // Show success message and go back
        Alert.alert('Success', result.message || 'Profile updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              setTimeout(() => {
                onBack();
              }, 100);
            }
          }
        ]);
      } else {
        console.log('❌ Profile update failed');
        console.log('Error details:', {
          error: result.error,
          validationErrors: result.validationErrors,
          isAuthError: result.isAuthError
        });
        // Handle authentication errors (only if it's truly an auth error, not validation)
        if (result.isAuthError && result.error && !result.error.toLowerCase().includes('validation')) {
          console.log('⚠️ Authentication error detected');
          Alert.alert(
            'Session Expired',
            result.error || 'Your session has expired. Please login again.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  // Optionally logout user here
                  // await authService.logout();
                  // onBack();
                }
              }
            ]
          );
          return;
        }
        
        // Handle validation errors
        let errorMessage = result.error || 'Failed to update profile. Please try again.';
        
        // If there are validation errors, extract and show them
        if (result.validationErrors && typeof result.validationErrors === 'object') {
          const validationErrors = result.validationErrors;
          console.log('Edit profile validation errors:', validationErrors);
          
          // Extract first validation error message
          const errorKeys = Object.keys(validationErrors);
          if (errorKeys.length > 0) {
            const firstError = validationErrors[errorKeys[0]];
            errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
          }
          
          // Map validation errors to form fields if needed
          if (validationErrors.name) {
            const nameError = Array.isArray(validationErrors.name) ? validationErrors.name[0] : String(validationErrors.name);
            console.log('Name validation error:', nameError);
            // You can set this to a state variable to show in the form field
          }
          if (validationErrors.phone) {
            const phoneError = Array.isArray(validationErrors.phone) ? validationErrors.phone[0] : String(validationErrors.phone);
            console.log('Phone validation error:', phoneError);
            // You can set this to a state variable to show in the form field
          }
        }
        
        console.log('Edit profile error:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.contentContainer,
          onTabChange && styles.contentContainerWithTabBar
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <View style={styles.profilePhotoSection}>
          <View style={[styles.profilePhotoContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.profilePhotoInitials, { color: colors.text }]}>{initials}</Text>
          </View>
          <Text style={[styles.profilePhotoHint, { color: colors.textSecondary }]}>
            Tap to change profile photo
          </Text>
        </View>

        {/* User Information Fields */}
        <View style={styles.inputSection}>
          {/* Full Name */}
          <View style={styles.inputField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Full Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="person-outline" size={20} color={colors.button} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={editedData.fullName}
                onChangeText={(text) => setEditedData({...editedData, fullName: text})}
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.inputField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Email Address</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="mail-outline" size={20} color={colors.button} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={editedData.email}
                onChangeText={(text) => setEditedData({...editedData, email: text})}
                placeholder="john.doe@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputField}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Phone Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="call-outline" size={20} color={colors.button} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={editedData.phoneNumber}
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
                  setEditedData({...editedData, phoneNumber: digitsOnly});
                }}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>
        </View>

        {/* Account Information Section */}
        <View style={styles.accountInfoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Member Since</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{memberSinceDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Account Type</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{displayAccountType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Verification Status</Text>
            <View style={styles.verifiedContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Changes Button */}
      <View style={[
        styles.bottomContainer, 
        { backgroundColor: colors.background },
        onTabChange && styles.bottomContainerWithTabBar
      ]}>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { backgroundColor: colors.button || '#000000' },
            isLoading && styles.saveButtonDisabled
          ]} 
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Tab Bar */}
      <BottomTabBar 
        activeTab={activeTab || 'account'} 
        onTabChange={onTabChange || ((tab) => {
          // Default navigation handler if not provided
          if (onBack && tab === 'account') {
            onBack();
          }
        })} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  contentContainerWithTabBar: {
    paddingBottom: 16,
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePhotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePhotoInitials: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  profilePhotoHint: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 32,
  },
  inputField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    paddingVertical: 0,
    letterSpacing: 0.2,
  },
  accountInfoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  bottomContainerWithTabBar: {
    paddingBottom: 12,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;