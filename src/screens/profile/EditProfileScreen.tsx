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
  const [editedData, setEditedData] = useState({
    fullName: userData?.fullName || 'joe',
    email: userData?.email || 'joe@gmail.com',
    phoneNumber: userData?.phoneNumber || '3242424324',
    carModel: userData?.carModel || 'Tesla Model 3',
    licensePlate: userData?.licensePlate || 'ABC-1234',
  });

  const handleSave = () => {
    // Create updated user data
    const updatedUserData = {
      ...userData,
      fullName: editedData.fullName,
      email: editedData.email,
      phoneNumber: editedData.phoneNumber,
      carModel: editedData.carModel,
      licensePlate: editedData.licensePlate,
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedData.fullName}
                onChangeText={(text) => setEditedData({...editedData, fullName: text})}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editedData.email}
                onChangeText={(text) => setEditedData({...editedData, email: text})}
                placeholder="Enter email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editedData.phoneNumber}
                onChangeText={(text) => setEditedData({...editedData, phoneNumber: text})}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Car Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Car Details</Text>
          
          {/* Car Model */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="car-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Car Model</Text>
              <TextInput
                style={styles.textInput}
                value={editedData.carModel}
                onChangeText={(text) => setEditedData({...editedData, carModel: text})}
                placeholder="Enter car model"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* License Plate */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="car-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>License Plate</Text>
              <TextInput
                style={styles.textInput}
                value={editedData.licensePlate}
                onChangeText={(text) => setEditedData({...editedData, licensePlate: text})}
                placeholder="Enter license plate"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 4,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EditProfileScreen;
