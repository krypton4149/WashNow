import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import authService from '../../services/authService';

interface Props {
  onBack?: () => void;
  onBookingConfirmed?: (center: any) => void;
  selectedLocation?: { id: string; name: string } | null;
  filteredCenters?: any[] | null; // Centers from search filter
}

interface ServiceCenter {
  id: string;
  name: string;
  rating: number;
  distance: string;
  address: string;
  status: 'waiting' | 'not-available' | 'accepted';
}

const FindingCarWashScreen: React.FC<Props> = ({ onBack, onBookingConfirmed, selectedLocation, filteredCenters }) => {
  console.log('=== FindingCarWashScreen: Component rendered ===');
  console.log('filteredCenters prop on render:', filteredCenters);
  console.log('filteredCenters is array?', Array.isArray(filteredCenters));
  console.log('filteredCenters length?', filteredCenters?.length);
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [acceptedCenter, setAcceptedCenter] = useState<ServiceCenter | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...');
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
  const isDark = useColorScheme() === 'dark';
  const theme = {
    background: isDark ? '#000000' : '#FFFFFF',
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A3A3A3' : '#666666',
    border: isDark ? '#333333' : '#E5E7EB',
    card: isDark ? '#0B0B0B' : '#F9FAFB',
    surface: isDark ? '#111111' : '#FFFFFF',
    accent: isDark ? '#FFFFFF' : '#000000',
  };

  // Store user's current coordinates for distance calculation
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Get current GPS location and reverse geocode to address
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserCoordinates({ lat: latitude, lng: longitude });
          
          // Reverse geocode using Nominatim (free OpenStreetMap service)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'WashNowApp/1.0', // Required by Nominatim
                },
              }
            );
            
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              // Build readable address from components
              const addressParts = [];
              
              if (addr.road) addressParts.push(addr.road);
              if (addr.suburb) addressParts.push(addr.suburb);
              if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
              if (addr.state) addressParts.push(addr.state);
              
              const address = addressParts.length > 0 
                ? addressParts.join(', ')
                : data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              
              setCurrentLocation(address);
            } else {
              // Fallback to coordinates
              setCurrentLocation(`Current Location - ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } catch (geoError) {
            // If reverse geocoding fails, use coordinates with friendly format
            setCurrentLocation(`Current Location - ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.log('Location error:', error);
          setCurrentLocation('Location unavailable');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.log('GPS error:', error);
        setCurrentLocation('Location unavailable');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Calculate distance from coordinates (simplified Haversine formula)
  const calculateDistance = (lat: string, lng: string): string => {
    try {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      
      // Use user's current coordinates if available, otherwise fallback to mock
      const userLat = userCoordinates?.lat || 51.557253; // Example: Harrow area
      const userLng = userCoordinates?.lng || -0.362310;
      
      // Simple distance calculation (not precise but good enough for demo)
      const latDiff = Math.abs(centerLat - userLat);
      const lngDiff = Math.abs(centerLng - userLng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69; // Rough miles conversion
      
      return `${distance.toFixed(1)} mi`;
    } catch (error) {
      return '0.5 mi'; // Default fallback
    }
  };

  // Use useLayoutEffect to check filteredCenters synchronously before paint
  useLayoutEffect(() => {
    console.log('=== FindingCarWashScreen: useLayoutEffect (sync check) ===');
    console.log('filteredCenters prop:', filteredCenters);
    console.log('filteredCenters type:', typeof filteredCenters);
    console.log('filteredCenters is array:', Array.isArray(filteredCenters));
    console.log('filteredCenters length:', filteredCenters?.length);
  }, [filteredCenters]);

  useEffect(() => {
    console.log('=== FindingCarWashScreen: useEffect triggered ===');
    console.log('filteredCenters prop:', filteredCenters);
    console.log('filteredCenters type:', typeof filteredCenters);
    console.log('filteredCenters is array:', Array.isArray(filteredCenters));
    console.log('filteredCenters length:', filteredCenters?.length);
    
    // Get current location on mount
    getCurrentLocation();
    
    // Load centers: use filteredCenters if provided, otherwise load all from API
    const loadCenters = async () => {
      try {
        setIsLoading(true);
        
        // CRITICAL: If filteredCenters are provided (even empty array), use them
        // Only load all centers if filteredCenters is explicitly null/undefined
        if (filteredCenters !== null && filteredCenters !== undefined) {
          if (Array.isArray(filteredCenters) && filteredCenters.length > 0) {
          console.log('=== Using filtered centers for broadcasting ===');
          console.log('Filtered centers count:', filteredCenters.length);
          console.log('Filtered centers data:', JSON.stringify(filteredCenters, null, 2));
          const mapped: ServiceCenter[] = filteredCenters.map((c: any, index: number) => {
            // Calculate distance based on coordinates (simplified calculation)
            const distance = c.clat && c.clong 
              ? calculateDistance(c.clat, c.clong)
              : c.distance || '0.5 mi';
            
            return {
              id: c.id?.toString() || (index + 1).toString(),
              name: c.name || c.service_center_name || 'Car Wash Center',
              rating: c.rating || 4.5 + (index * 0.1),
              distance: distance,
              address: c.address || c.location || 'Address not available',
              status: 'waiting',
            };
          });
          
            console.log('Mapped filtered centers:', mapped);
            setCenters(mapped);
            setIsLoading(false);
            return;
          } else {
            // filteredCenters is an empty array - show empty state
            console.log('=== Filtered centers is empty array - showing no centers ===');
            setCenters([]);
            setIsLoading(false);
            return;
          }
        }
        
        // Otherwise (filteredCenters is null/undefined), load all centers from API
        console.log('=== Loading ALL service centers from API ===');
        console.log('Reason: filteredCenters is null/undefined - no filter applied');
        const resp = await authService.getServiceCenters();
        console.log('Service centers API response:', JSON.stringify(resp, null, 2));
        
        if (resp.success && resp.serviceCenters) {
          console.log('Successfully loaded centers:', resp.serviceCenters.length);
          const mapped: ServiceCenter[] = (resp.serviceCenters || []).map((c: any, index: number) => {
            // Calculate distance based on coordinates (simplified calculation)
            const distance = calculateDistance(c.clat, c.clong);
            
            return {
              id: c.id?.toString() || (index + 1).toString(),
              name: c.name || 'Car Wash Center',
              rating: 4.5 + (index * 0.1), // Generate rating since not in API
              distance: distance,
              address: c.address || 'Address not available',
              status: 'waiting',
            };
          });
          
          console.log('Mapped centers:', mapped);
          setCenters(mapped);
        } else {
          console.log('Failed to fetch centers:', resp.error);
          // Fallback: show some mock centers for testing
          const mockCenters: ServiceCenter[] = [
            {
              id: '1',
              name: 'Harrow Hand Car Wash',
              rating: 4.6,
              distance: '0.5 mi',
              address: 'Northolt Road, South Harrow, HA2 6AF',
              status: 'waiting',
            },
            {
              id: '2',
              name: 'Pro Hand Car Wash',
              rating: 4.7,
              distance: '0.8 mi',
              address: 'Rayners Lane, Harrow, HA2 9SX',
              status: 'waiting',
            },
            {
              id: '3',
              name: 'Medusa Auto Detailing',
              rating: 4.8,
              distance: '1.2 mi',
              address: 'Alveston Ave, Harrow HA3 8TG, United Kingdom',
              status: 'waiting',
            },
            {
              id: '4',
              name: 'South Harrow Hand Car Wash',
              rating: 4.5,
              distance: '0.6 mi',
              address: '290 Northolt Road, South Harrow, HA2 8EB',
              status: 'waiting',
            }
          ];
          setCenters(mockCenters);
        }
      } catch (e) {
        console.log('Error fetching service centers:', e);
        setCenters([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCenters();

    // Timer for searching card
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simulate broadcast results: random center becomes accepted, others become not available
    const acceptTimer = setTimeout(() => {
      setCenters(prev => {
        // Randomly select which center accepts the request
        const randomIndex = prev.length > 0 ? Math.floor(Math.random() * prev.length) : 0;
        
        const updated = prev.map((c, idx) => (
          idx === randomIndex ? { ...c, status: 'accepted' as const } : { ...c, status: 'not-available' as const }
        ));
        
        // Save accepted center locally; navigate in a separate effect to avoid setState during render
        const accepted = updated[randomIndex] || null;
        setAcceptedCenter(accepted);
        return updated;
      });
    }, 7000);

    return () => {
      clearInterval(timer);
      clearTimeout(acceptTimer);
    };
  }, [onBookingConfirmed, filteredCenters]);

  // Navigate to match found screen after a center is accepted
  useEffect(() => {
    if (acceptedCenter) {
      const navTimer = setTimeout(() => {
        onBookingConfirmed?.(acceptedCenter);
      }, 0);
      return () => clearTimeout(navTimer);
    }
  }, [acceptedCenter, onBookingConfirmed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCenter = (center: ServiceCenter) => (
    <View key={center.id} style={styles.centerCard}>
      <View style={styles.centerLeft}>
        <View style={[
          styles.statusIcon,
          center.status === 'waiting' && styles.statusWaiting,
          center.status === 'not-available' && styles.statusNotAvailable,
          center.status === 'accepted' && styles.statusAccepted,
        ]}>
          {center.status === 'waiting' && (
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
          )}
          {center.status === 'not-available' && (
            <Ionicons name="close" size={16} color="#FFFFFF" />
          )}
          {center.status === 'accepted' && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>
      
      <View style={styles.centerBody}>
        <View style={styles.centerHeader}>
          <Text style={[styles.centerName,{color: theme.textPrimary}]}>{center.name}</Text>
        </View>
        <Text style={[styles.centerDistance,{color: theme.textSecondary}]}>{center.distance}</Text>
      </View>
      
      <View style={styles.centerRight}>
        <Text style={[
          styles.statusText,
          center.status === 'waiting' && styles.statusTextWaiting,
          center.status === 'not-available' && styles.statusTextNotAvailable,
          center.status === 'accepted' && styles.statusTextAccepted,
        ]}>
          {center.status === 'waiting' && 'Waiting...'}
          {center.status === 'not-available' && 'Not Available'}
          {center.status === 'accepted' && 'Accepted!'}
        </Text>
      </View>
    </View>
  );

  const hasAcceptedCenter = centers.some(c => c.status === 'accepted');

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(12, Math.min(insets.bottom || 0, 20));

  return (
    <SafeAreaView style={[styles.container,{backgroundColor: theme.background}]} edges={["top","bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title,{color: theme.textPrimary}]}>Finding your car wash</Text>
          <Text style={[styles.subtitle,{color: theme.textSecondary}]}>Broadcasting to all nearby centers.</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Searching/Matched Status */}
        <View style={[
          styles.searchingCard,
          { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
        ]}>
          <View style={styles.searchingLeft}>
            <View style={[
              styles.searchingIcon,
              { backgroundColor: theme.accent }
            ]}>
              {hasAcceptedCenter ? (
                <Ionicons name="checkmark" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
              ) : (
                <Ionicons name="refresh" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
              )}
            </View>
          </View>
          <View style={styles.searchingBody}>
            <Text style={[styles.searchingText,{color: theme.textPrimary}]}>
              {hasAcceptedCenter ? 'Match found!' : 'Searching for available centers...'}
            </Text>
            <Text style={[styles.timeText,{color: theme.textSecondary}]}>Time elapsed: {formatTime(timeElapsed)}</Text>
          </View>
        </View>

        {/* Your Request */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle,{color: theme.textPrimary}]}>Your Request</Text>
          <View style={[styles.requestCard,{backgroundColor: theme.card}]}> 
            <View style={styles.requestRow}>
              <View style={[styles.requestIcon,{backgroundColor: theme.accent}]}> 
                <Ionicons name="flash" size={16} color={isDark ? '#000000' : '#FFFFFF'} />
              </View>
              <Text style={[styles.requestText,{color: theme.textPrimary}]}>Car Wash - Instant Booking</Text>
            </View>
            <Text style={[styles.requestSubtext,{color: theme.textSecondary}]}>Service starts immediately.</Text>
            
            <View style={styles.requestRow}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.requestLabel,{color: theme.textSecondary}]}>Your location</Text>
            </View>
            <Text style={[styles.requestAddress,{color: theme.textPrimary}]}>
              {isLoadingLocation ? 'Getting location...' : (selectedLocation?.name || currentLocation)}
            </Text>
          </View>
        </View>

        {/* Broadcasting to Centers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle,{color: theme.textPrimary}]}>
            {filteredCenters && filteredCenters.length > 0 
              ? `Broadcasting to Selected Centers (${centers.length})`
              : `Broadcasting to All Centers (${centers.length})`
            }
          </Text>
          <View style={styles.centersList}>
            {isLoading ? (
              <Text style={{ color: theme.textSecondary }}>Loading centers...</Text>
            ) : centers.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>No centers available nearby.</Text>
            ) : (
              centers.map(renderCenter)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={[styles.cancelButtonText,{color: theme.textSecondary}]}>Cancel Request</Text>
        </TouchableOpacity>
        <Text style={[styles.cancelNote,{color: theme.textSecondary}]}>You can cancel anytime before a center accepts.</Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  searchingLeft: {
    marginRight: 12,
  },
  searchingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingBody: {
    flex: 1,
  },
  searchingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  requestSubtext: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    marginLeft: 44,
  },
  requestLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  requestAddress: {
    fontSize: 14,
    color: '#000',
    marginLeft: 24,
    marginTop: 4,
  },
  centersList: {
    gap: 12,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerLeft: {
    marginRight: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusWaiting: {
    backgroundColor: '#E5E7EB',
  },
  statusNotAvailable: {
    backgroundColor: '#FEF2F2',
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
  },
  centerBody: {
    flex: 1,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  centerName: {
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
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  centerDistance: {
    fontSize: 14,
    color: '#666666',
  },
  centerRight: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusTextWaiting: {
    color: '#F59E0B',
  },
  statusTextNotAvailable: {
    color: '#EF4444',
  },
  statusTextAccepted: {
    color: '#059669',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  centerSimpleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  centerSimpleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  centerSimpleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  centerSimpleAddress: {
    fontSize: 14,
    color: '#666666',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  cancelNote: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});

export default FindingCarWashScreen;
