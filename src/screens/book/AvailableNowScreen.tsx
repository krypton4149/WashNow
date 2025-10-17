import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';

interface Props {
  onBack?: () => void;
  onBookService?: () => void;
}

interface AvailableCenter {
  id: string;
  name: string;
  rating: number;
  distance: string;
  address: string;
  eta: string;
  image: string;
  isAvailable: boolean;
}

const AvailableNowScreen: React.FC<Props> = ({ onBack, onBookService }) => {
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
  const availableCenters: AvailableCenter[] = [
    {
      id: '1',
      name: 'Premium Auto Wash',
      rating: 4.8,
      distance: '0.5 mi',
      address: '123 Main Street, Downtown',
      eta: '15-20 min',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Quick Shine Car Care',
      rating: 4.6,
      distance: '0.7 mi',
      address: '456 Park Avenue, Midtown',
      eta: '20-25 min',
      image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=100&h=100&fit=crop',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Splash Auto Detail',
      rating: 4.7,
      distance: '1.2 mi',
      address: '321 Fifth Ave, Chelsea',
      eta: '25-30 min',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=100&h=100&fit=crop',
      isAvailable: true,
    },
  ];

  const renderCenter = (center: AvailableCenter) => (
    <TouchableOpacity key={center.id} style={styles.centerCard}>
      <View style={styles.centerImageContainer}>
        <Image source={{ uri: center.image }} style={styles.centerImage} />
      </View>
      <View style={styles.centerContent}>
        <View style={styles.centerHeader}>
          <Text style={styles.centerName}>{center.name}</Text>
          <View style={styles.availableTag}>
            <Ionicons name="flash" size={12} color="#FFFFFF" />
            <Text style={styles.availableText}>Available</Text>
          </View>
        </View>
        
        <View style={styles.centerRating}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.ratingText}>{center.rating}</Text>
          <Text style={styles.distanceText}>{center.distance}</Text>
        </View>
        
        <View style={styles.centerAddress}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.addressText}>{center.address}</Text>
        </View>
        
        <View style={styles.centerEta}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.etaText}>ETA: {center.eta}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Available Now</Text>
          <Text style={styles.subtitle}>Centers ready to wash your car immediately</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.locationText}>{currentLocation}</Text>
          {isLoadingLocation && (
            <View style={styles.loadingIndicator}>
              <Ionicons name="refresh" size={16} color="#6B7280" />
            </View>
          )}
        </View>

        {/* Available Centers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Centers ({availableCenters.length})</Text>
          <Text style={styles.sectionDescription}>
            These centers can start washing your car right now
          </Text>
        </View>

        {/* Centers List */}
        <View style={styles.centersList}>
          {availableCenters.map(renderCenter)}
        </View>

        {/* Instant Booking Section */}
        <View style={styles.instantBookingCard}>
          <View style={styles.instantBookingHeader}>
            <Ionicons name="flash" size={20} color="#3B82F6" />
            <Text style={styles.instantBookingTitle}>Instant Booking</Text>
          </View>
          <Text style={styles.instantBookingDescription}>
            We'll send your request to all available centers
          </Text>
        </View>
      </ScrollView>

      {/* Book Service Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.bookButton} onPress={onBookService}>
          <Text style={styles.bookButtonText}>Book Service</Text>
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
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  centersList: {
    gap: 12,
  },
  centerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerImageContainer: {
    marginRight: 12,
  },
  centerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  centerContent: {
    flex: 1,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  availableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  centerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  centerAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  centerEta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  instantBookingCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
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
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AvailableNowScreen;
