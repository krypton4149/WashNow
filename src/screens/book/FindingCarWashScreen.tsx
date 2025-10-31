import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';

interface Props {
  onBack?: () => void;
  onBookingConfirmed?: (center: any) => void;
  selectedLocation?: { id: string; name: string } | null;
}

interface ServiceCenter {
  id: string;
  name: string;
  rating: number;
  distance: string;
  address: string;
  status: 'waiting' | 'not-available' | 'accepted';
}

const FindingCarWashScreen: React.FC<Props> = ({ onBack, onBookingConfirmed, selectedLocation }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [acceptedCenter, setAcceptedCenter] = useState<ServiceCenter | null>(null);
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

  // Calculate distance from coordinates (simplified Haversine formula)
  const calculateDistance = (lat: string, lng: string): string => {
    try {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      
      // Mock user location (you can replace with actual user location)
      const userLat = 51.557253; // Example: Harrow area
      const userLng = -0.362310;
      
      // Simple distance calculation (not precise but good enough for demo)
      const latDiff = Math.abs(centerLat - userLat);
      const lngDiff = Math.abs(centerLng - userLng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69; // Rough miles conversion
      
      return `${distance.toFixed(1)} mi`;
    } catch (error) {
      return '0.5 mi'; // Default fallback
    }
  };

  useEffect(() => {
    // Load centers from API on mount
    const loadCenters = async () => {
      try {
        setIsLoading(true);
        console.log('Loading service centers for broadcasting...');
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
  }, [onBookingConfirmed]);

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
            <Text style={[styles.requestAddress,{color: theme.textPrimary}]}>{selectedLocation?.name || 'Downtown, New York - 123 Main Street'}</Text>
          </View>
        </View>

        {/* Broadcasting to Centers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle,{color: theme.textPrimary}]}>Broadcasting to All Centers ({centers.length})</Text>
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
