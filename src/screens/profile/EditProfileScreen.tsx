import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  carModel?: string;
  licensePlate?: string;
}

interface Props {
  onBack?: () => void;
  onSaveProfile?: (updatedData: UserData) => void;
  userData?: UserData | null;
}

const EditProfileScreen: React.FC<Props> = ({
  onBack,
  onSaveProfile,
  userData,
}) => {
  const { colors } = useTheme();
  const [editedData, setEditedData] = useState({
    fullName: userData?.fullName || 'joe',
    email: userData?.email || 'joe@gmail.com',
    phoneNumber: userData?.phoneNumber || '3242424324',
  });

  const handleSave = () => {
    // Create updated user data
    const updatedUserData = {
      ...userData,
      fullName: editedData.fullName,
      email: editedData.email,
      phoneNumber: editedData.phoneNumber,
    } as UserData;
    
    // Notify parent component about the changes
    onSaveProfile?.(updatedUserData);
    
    // Show success message and go back
    Alert.alert('Success', 'Profile updated successfully!', [
      { text: 'OK', onPress: onBack }
    ]);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Changes',
      'Are you sure you want to cancel? Your changes will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: onBack }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header with gradient-like effect */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.background} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.background }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={[styles.welcomeIconContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="create-outline" size={32} color={colors.button} />
          </View>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Update Your Information</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Keep your profile information up to date
          </Text>
        </View>

        {/* Personal Information Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="person-circle-outline" size={24} color={colors.button} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Information</Text>
          </View>
          
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <Ionicons name="person-outline" size={22} color={colors.button} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={editedData.fullName}
                  onChangeText={(text) => setEditedData({...editedData, fullName: text})}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <Ionicons name="mail-outline" size={22} color={colors.button} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={editedData.email}
                  onChangeText={(text) => setEditedData({...editedData, email: text})}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputLeft}>
                <Ionicons name="call-outline" size={22} color={colors.button} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={editedData.phoneNumber}
                  onChangeText={(text) => setEditedData({...editedData, phoneNumber: text})}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.button }]} 
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.buttonText} style={{ marginRight: 8 }} />
          <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Save Changes</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
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
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingVertical: 0,
    letterSpacing: 0.2,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    paddingBottom: 34,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default EditProfileScreen;
