import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import authService from '../../services/authService';

interface Props {
  onBack?: () => void;
  onNavigateToAvailableNow?: () => void;
  onNavigateToScheduleForLater?: () => void;
  onConfirmBooking?: () => void;
}

const BookCarWashScreen: React.FC<Props> = ({ onBack, onNavigateToAvailableNow, onNavigateToScheduleForLater, onConfirmBooking }) => {
  const [searchText, setSearchText] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeOption, setSelectedTimeOption] = useState<'now' | 'later'>('now');
  const [currentLocation, setCurrentLocation] = useState('Getting location...');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [centersError, setCentersError] = useState<string | null>(null);
  const [whereToWash, setWhereToWash] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A3A3A3' : '#666666',
    border: isDark ? '#333333' : '#E5E7EB',
    card: isDark ? '#111111' : '#FFFFFF',
    chip: isDark ? '#111111' : '#F5F5F5',
    accent: isDark ? '#FFFFFF' : '#000000',
  };

  // Mock data for service centers based on the exact image
  const mockServiceCenters = [
    {
      id: '1',
      name: 'Elite Car Care',
      rating: 4.6,
      distance: '0.7 mi',
      address: 'Madison, Midtown, New York',
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Pro Shine Detail',
      rating: 4.9,
      distance: '0.9 mi',
      address: 'Upper East Side, New York',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Auto Detail Express',
      rating: 4.7,
      distance: '1.3 mi',
      address: '321 5th Avenue, Chelsea, New York',
      isAvailable: true,
    },
    {
      id: '4',
      name: 'Platinum Car Wash Center',
      rating: 4.5,
      distance: '1.7 mi',
      address: '654 Lexington Ave, Gramercy, New York',
      isAvailable: true,
    },
  ];

  useEffect(() => {
    getCurrentLocation();
    fetchServiceCenters();
  }, []);

  const fetchServiceCenters = async () => {
    try {
      setLoadingCenters(true);
      const result = await authService.getServiceCenters();
      
      if (result.success && result.serviceCenters) {
        setServiceCenters(result.serviceCenters);
        setCentersError(null);
      } else {
        // Fallback to mock data if API fails
        console.log('API failed, using mock data:', result.error);
        setServiceCenters(mockServiceCenters);
        setCentersError(result.error || 'Failed to load service centers');
      }
    } catch (error) {
      console.error('Error fetching service centers:', error);
      // Fallback to mock data on error
      setServiceCenters(mockServiceCenters);
      setCentersError('Failed to load service centers');
    } finally {
      setLoadingCenters(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.log('Location error:', error);
        setCurrentLocation('Downtown, New York - 123 Main Street');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.city && data.principalSubdivision) {
        setCurrentLocation(`${data.city}, ${data.principalSubdivision} - ${data.locality || 'Current Location'}`);
      } else {
        setCurrentLocation('Downtown, New York - 123 Main Street');
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
      setCurrentLocation('Downtown, New York - 123 Main Street');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirmBooking = () => {
    console.log('Confirm booking pressed');
    onConfirmBooking?.();
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(12, Math.min(insets.bottom || 0, 20));

  return (
    <SafeAreaView style={[styles.container,{backgroundColor: theme.background}]} edges={["top","bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
                <Text style={[styles.title,{color: theme.textPrimary}]}>Plan your wash</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selection Buttons */}
        <View style={styles.selectionContainer}>
          <TouchableOpacity 
            style={[styles.selectionButton,{backgroundColor: theme.chip}]}
            onPress={() => setShowTimeModal(true)}
          >
            <Ionicons name="time-outline" size={16} color={theme.textPrimary} />
                    <Text style={[styles.selectionText,{color: theme.textPrimary}]}>Wash now</Text>
            <Ionicons name="chevron-down-outline" size={16} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.selectionButton,{backgroundColor: theme.chip}]}> 
            <Text style={[styles.selectionText,{color: theme.textPrimary}]}>For me</Text>
            <Ionicons name="chevron-down-outline" size={16} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Location Input */}
        <View style={[styles.locationContainer,{backgroundColor: theme.card,borderColor: theme.textPrimary}]}> 
          <View style={styles.locationRow}>
            <View style={[styles.locationDot,{backgroundColor: theme.textPrimary}]} />
            <Text style={[styles.locationText,{color: theme.textPrimary}]}>{currentLocation}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.whereToWashRow}
            onPress={() => setWhereToWash(!whereToWash)}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox,{borderColor: theme.textPrimary}, whereToWash && {backgroundColor: theme.textPrimary}]}> 
                {whereToWash && <Ionicons name="checkmark" size={12} color={isDark ? '#000000' : '#FFFFFF'} />}
              </View>
              <Text style={[styles.whereToWashText,{color: theme.textSecondary}]}>Where to?</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Service Centers List */}
        <View style={styles.centersList}>
          <Text style={[styles.sectionTitle,{color: theme.textPrimary}]}>Nearby car wash centers</Text>
          
          {loadingCenters ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
              <Text style={[styles.loadingText,{color: theme.textSecondary}]}>Loading service centers...</Text>
            </View>
          ) : centersError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{centersError}</Text>
              <TouchableOpacity onPress={fetchServiceCenters} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : serviceCenters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText,{color: theme.textSecondary}]}>No service centers available</Text>
            </View>
          ) : (
            serviceCenters.map((center, index) => (
              <View 
                key={center.id || index} 
                style={[styles.centerRow,{borderBottomColor: theme.border}, index === serviceCenters.length - 1 && styles.lastCenterRow]}
              >
                <View style={styles.centerLeft}>
                  <Ionicons name="location-outline" size={20} color={theme.textPrimary} />
                </View>
                <View style={styles.centerBody}>
                  <Text style={[styles.centerName,{color: theme.textPrimary}]}>{center.name || center.service_center_name || 'Service Center'}</Text>
                  <Text style={[styles.centerAddress,{color: theme.textSecondary}]}>{center.address || center.location || 'Address not available'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Instant Booking info removed as requested */}
      </ScrollView>

      {/* Confirm Booking Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: theme.card, borderTopColor: theme.border }]}> 
        <TouchableOpacity style={[styles.confirmButton,{backgroundColor: theme.accent}]} onPress={handleConfirmBooking}>
          <Text style={[styles.confirmButtonText,{color: isDark ? '#000000' : '#FFFFFF'}]}>Confirm Booking</Text>
        </TouchableOpacity>
        <Text style={[styles.bottomText,{color: theme.textSecondary}]}>Request will be sent to all {serviceCenters.length} available car wash centers.</Text>
      </View>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,{backgroundColor: theme.card}]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle,{color: theme.textPrimary}]}>When do you want your car washed?</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeOptions}>
              <TouchableOpacity 
                style={[styles.timeOption,{backgroundColor: isDark ? '#0B0B0B' : '#F9FAFB'}]}
                onPress={() => {
                  setSelectedTimeOption('now');
                  setShowTimeModal(false);
                }}
              >
                <View style={[styles.timeOptionIcon,{backgroundColor: theme.accent}]}> 
                  <Ionicons name="flash" size={24} color={isDark ? '#000000' : '#FFFFFF'} />
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={[styles.timeOptionTitle,{color: theme.textPrimary}]}>Now</Text>
                  <Text style={[styles.timeOptionDescription,{color: theme.textSecondary}]}> 
                    Get matched with nearby car wash centers who can wash your car immediately
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.timeOption,{backgroundColor: isDark ? '#0B0B0B' : '#F9FAFB'}]}
                onPress={() => {
                  setSelectedTimeOption('later');
                  setShowTimeModal(false);
                  onNavigateToScheduleForLater?.();
                }}
              >
                <View style={[styles.timeOptionIcon,{backgroundColor: theme.accent}]}> 
                  <Ionicons name="calendar-outline" size={24} color={isDark ? '#000000' : '#FFFFFF'} />
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={[styles.timeOptionTitle,{color: theme.textPrimary}]}>Schedule for later</Text>
                  <Text style={[styles.timeOptionDescription,{color: theme.textSecondary}]}> 
                    Choose a specific date, time, and location for your car wash
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    flex: 1,
  },
  selectionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    flex: 1,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
    flex: 1,
  },
  whereToWashRow: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  whereToWashText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  centersList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  lastCenterRow: {
    borderBottomWidth: 0,
  },
  centerLeft: {
    width: 32,
    alignItems: 'center',
    marginTop: 4,
  },
  centerBody: {
    flex: 1,
    paddingLeft: 12,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  centerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginBottom: 4,
  },
  centerAddress: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  centerDistance: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  instantBookingContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instantBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instantBookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  instantBookingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  timeOptions: {
    gap: 16,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  timeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timeOptionContent: {
    flex: 1,
  },
  timeOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  timeOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default BookCarWashScreen;