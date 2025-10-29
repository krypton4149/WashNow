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

  useEffect(() => {
    // Load centers from API on mount
    const loadCenters = async () => {
      try {
        setIsLoading(true);
        const resp = await authService.getServiceCenters();
        if (resp.success) {
          const mapped: ServiceCenter[] = (resp.serviceCenters || []).map((c: any, index: number) => ({
            id: (c.id ?? index + 1).toString(),
            name: c.name || c.service_centre_name || 'Car Wash Center',
            rating: Number(c.rating || 4.5),
            distance: c.distance ? `${c.distance}` : (index + 1) * 0.5 + ' mi',
            address: c.address || c.location || 'Address not available',
            status: 'waiting',
          }));
          setCenters(mapped);
        } else {
          // Fallback: keep empty and let UI show none
          console.log('Failed to fetch centers:', resp.error);
        }
      } catch (e) {
        console.log('Error fetching service centers:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadCenters();

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simulate a center accepting the request after 7 seconds
    const acceptTimer = setTimeout(() => {
      setCenters(prev => 
        prev.map((center, idx) => 
          idx === 0 
            ? { ...center, status: 'accepted' as const }
            : center.status === 'waiting' 
            ? { ...center, status: 'not-available' as const }
            : center
        )
      );
      
      // Navigate to booking confirmed screen after 2 seconds
      setTimeout(() => {
        const acceptedCenter = (prevCenters => prevCenters.find((_, idx) => idx === 0))(centers);
        onBookingConfirmed?.(acceptedCenter);
      }, 2000);
    }, 7000);

    return () => {
      clearInterval(timer);
      clearTimeout(acceptTimer);
    };
  }, [onBookingConfirmed]);

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
          <Text style={styles.centerName}>{center.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#000" />
            <Text style={styles.centerRating}>{center.rating}</Text>
          </View>
        </View>
        <Text style={styles.centerDistance}>{center.distance}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Finding your car wash</Text>
          <Text style={styles.subtitle}>Broadcasting to all nearby centers.</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Searching Status */}
        <View style={styles.searchingCard}>
          <View style={styles.searchingLeft}>
            <View style={styles.searchingIcon}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.searchingBody}>
            <Text style={styles.searchingText}>
              {hasAcceptedCenter ? 'Match found!' : 'Searching for available centers...'}
            </Text>
            <Text style={styles.timeText}>Time elapsed: {formatTime(timeElapsed)}</Text>
          </View>
        </View>

        {/* Your Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Request</Text>
          <View style={styles.requestCard}>
            <View style={styles.requestRow}>
              <View style={styles.requestIcon}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.requestText}>Car Wash - Instant Booking</Text>
            </View>
            <Text style={styles.requestSubtext}>Service starts immediately.</Text>
            
            <View style={styles.requestRow}>
              <Ionicons name="location-outline" size={16} color="#666666" />
              <Text style={styles.requestLabel}>Your location</Text>
            </View>
            <Text style={styles.requestAddress}>{selectedLocation?.name || 'Current location'}</Text>
          </View>
        </View>

        {/* Broadcasting to Centers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Broadcasting to All Centers ({centers.length})</Text>
          <View style={styles.centersList}>
            {isLoading ? (
              <Text style={{ color: '#666666' }}>Loading centers...</Text>
            ) : centers.length === 0 ? (
              <Text style={{ color: '#666666' }}>No centers available nearby.</Text>
            ) : (
              centers.map(renderCenter)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
        <Text style={styles.cancelNote}>You can cancel anytime before a center accepts.</Text>
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
