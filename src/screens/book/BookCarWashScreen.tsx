import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';

interface Props {
  onBack?: () => void;
  onNavigateToAvailableNow?: () => void;
}

const BookCarWashScreen: React.FC<Props> = ({ onBack, onNavigateToAvailableNow }) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeOption, setSelectedTimeOption] = useState<'now' | 'later'>('now');
  const [currentLocation, setCurrentLocation] = useState('Getting location...');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.log('Location error:', error);
        setCurrentLocation('Location unavailable');
        setIsLoadingLocation(false);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location permissions.',
          [{ text: 'OK' }]
        );
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
      // Using a simple reverse geocoding approach
      // In a real app, you would use a proper geocoding service like Google Maps API
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.city && data.principalSubdivision) {
        setCurrentLocation(`${data.city}, ${data.principalSubdivision} - ${data.locality || 'Current Location'}`);
      } else {
        setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
      setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const centers = [
    {
      id: '1',
      name: 'Premium Auto Wash',
      rating: 4.8,
      address: '123 Main Street, Downtown, New York',
      distance: '0.5 mi',
      price: '$25',
      duration: '30 min',
    },
    {
      id: '2',
      name: 'Quick Shine Car Care',
      rating: 4.6,
      address: '456 Park Avenue, Midtown, New York',
      distance: '0.7 mi',
      price: '$20',
      duration: '25 min',
    },
    {
      id: '3',
      name: 'Elite Car Spa',
      rating: 4.9,
      address: '789 Broadway, Upper East Side, New York',
      distance: '0.9 mi',
      price: '$35',
      duration: '45 min',
    },
    {
      id: '4',
      name: 'Express Auto Detail',
      rating: 4.7,
      address: '321 5th Avenue, Chelsea, New York',
      distance: '1.3 mi',
      price: '$18',
      duration: '20 min',
    },
    {
      id: '5',
      name: 'Platinum Car Wash Center',
      rating: 4.5,
      address: '654 Lexington Ave, Gramercy, New York',
      distance: '1.7 mi',
      price: '$30',
      duration: '35 min',
    },
  ];

  // Filter centers based on search text
  const filteredCenters = centers.filter(center => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      center.name.toLowerCase().includes(searchLower) ||
      center.address.toLowerCase().includes(searchLower)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Plan your ride</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.bookingOptions}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setShowTimeModal(true)}
          >
            <Ionicons name="time-outline" size={16} color="#000" />
            <Text style={styles.optionText}>
              {selectedTimeOption === 'now' ? 'Pickup now' : 'Schedule for later'}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionText}>For me</Text>
            <Ionicons name="chevron-down-outline" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.pane}>
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>{currentLocation}</Text>
              {isLoadingLocation && (
                <View style={styles.loadingIndicator}>
                  <Ionicons name="refresh" size={16} color="#6B7280" />
                </View>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.whereToRow}>
            <Ionicons name="search-outline" size={20} color="#000" />
            <TextInput
              style={styles.searchInput}
              placeholder="Where to?"
              placeholderTextColor="#666666"
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(false)}
              returnKeyType="search"
              clearButtonMode="never"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle-outline" size={20} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          {searchText.length > 0 
            ? `Search results (${filteredCenters.length})` 
            : 'Nearby car wash centers'
          }
        </Text>

        {filteredCenters.length > 0 ? (
          filteredCenters.map((c) => (
          <TouchableOpacity key={c.id} style={styles.centerRow}>
            <View style={styles.centerLeft}>
              <Ionicons name="location-outline" size={20} color="#000" />
            </View>
            <View style={styles.centerBody}>
              <View style={styles.centerTitleRow}>
                <Text style={styles.centerTitle}>{c.name}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.centerRating}>{c.rating}</Text>
                </View>
              </View>
              <Text style={styles.centerAddress}>{c.address}</Text>
            </View>
            <Text style={styles.centerDistance}>{c.distance}</Text>
          </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#CCCCCC" />
            <Text style={styles.noResultsText}>No car wash centers found</Text>
            <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
          </View>
        )}
      </ScrollView>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>When do you want your car washed?</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeOptions}>
              {/* Now Option */}
              <TouchableOpacity 
                style={styles.timeOption}
                onPress={() => {
                  setSelectedTimeOption('now');
                  setShowTimeModal(false);
                  onNavigateToAvailableNow?.();
                }}
              >
                <View style={styles.timeOptionIcon}>
                  <Ionicons name="flash" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={styles.timeOptionTitle}>Now</Text>
                  <Text style={styles.timeOptionDescription}>
                    Get matched with nearby centers who can wash your car immediately
                  </Text>
                  <View style={styles.timeOptionTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Available now</Text>
                    </View>
                    <Text style={styles.tagSeparator}>•</Text>
                    <Text style={styles.tagLabel}>Instant matching</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Schedule for Later Option */}
              <TouchableOpacity 
                style={styles.timeOption}
                onPress={() => {
                  setSelectedTimeOption('later');
                  setShowTimeModal(false);
                }}
              >
                <View style={styles.timeOptionIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={styles.timeOptionTitle}>Schedule for later</Text>
                  <Text style={styles.timeOptionDescription}>
                    Choose a specific date, time, and location for your car wash
                  </Text>
                  <View style={styles.timeOptionTags}>
                    <View style={[styles.tag, styles.tagBlue]}>
                      <Text style={[styles.tagText, styles.tagTextBlue]}>Plan ahead</Text>
                    </View>
                    <Text style={styles.tagSeparator}>•</Text>
                    <Text style={styles.tagLabel}>Pick your time</Text>
                  </View>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#000' },
  bookingOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  pane: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFFFFF',
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  locationLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
  },
  locationDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: '#000' 
  },
  locationText: { 
    fontSize: 16, 
    color: '#000',
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  whereToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  whereToText: { 
    color: '#000', 
    fontSize: 16,
  },
  sectionLabel: { 
    marginHorizontal: 16, 
    marginTop: 8, 
    marginBottom: 12, 
    color: '#666666',
    fontSize: 16,
  },
  list: { flex: 1 },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  centerLeft: { 
    width: 32, 
    alignItems: 'center', 
    marginTop: 4 
  },
  centerBody: { 
    flex: 1, 
    paddingLeft: 12 
  },
  centerTitleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 4,
  },
  centerTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  centerRating: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: '500' 
  },
  centerAddress: { 
    color: '#666666', 
    fontSize: 14,
  },
  centerDistance: { 
    color: '#666666',
    fontSize: 14,
    marginTop: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  // Modal Styles
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
    marginBottom: 12,
  },
  timeOptionTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagBlue: {
    backgroundColor: '#DBEAFE',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  tagTextBlue: {
    color: '#2563EB',
  },
  tagSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  tagLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default BookCarWashScreen;
