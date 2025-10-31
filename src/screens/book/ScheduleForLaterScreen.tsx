import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../../components/ui/BackButton';
import authService from '../../services/authService';

interface ScheduleForLaterScreenProps {
  onBack: () => void;
  onCenterSelect: (center: any) => void;
  selectedLocation: {
    id: string;
    name: string;
    centersCount: number;
  };
}

interface CarWashCenter {
  id: string;
  name: string;
  rating: number;
  distance: string;
  address: string;
  image: string;
  isAvailable: boolean;
}

const ScheduleForLaterScreen: React.FC<ScheduleForLaterScreenProps> = ({
  onBack,
  onCenterSelect,
  selectedLocation,
}) => {
  // Start with empty search so ALL centers are visible by default
  const [searchText, setSearchText] = useState('');
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  const fetchServiceCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.getServiceCenters();
      
      if (result.success && result.serviceCenters && result.serviceCenters.length > 0) {
        // Transform API data to match our interface
        const transformedCenters = result.serviceCenters.map((center: any) => ({
          id: center.id?.toString() || Math.random().toString(),
          name: center.name || center.service_center_name || 'Service Center',
          rating: 4.5, // Default rating since API doesn't provide it
          distance: '0.5 mi', // Default distance
          address: center.address || center.location || 'Address not available',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop', // Default image
          isAvailable: center.status === 'Active',
          email: center.email,
          phone: center.phone,
          weekoff_days: center.weekoff_days,
          clat: center.clat,
          clong: center.clong,
        }));
        
        console.log('Fetched service centers:', transformedCenters);
        setServiceCenters(transformedCenters);
      } else {
        // Fallback to mock data if API fails or returns empty
        console.log('Using mock data - API failed or empty:', result.error);
        const mockCenters = [
          {
            id: '1',
            name: 'Elite Car Care',
            rating: 4.6,
            distance: '0.7 mi',
            address: 'Madison Ave, Midtown, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'info@elitecar.com',
            phone: '+1 (555) 123-4567',
          },
          {
            id: '2',
            name: 'Pro Shine Detail',
            rating: 4.9,
            distance: '0.9 mi',
            address: 'Upper East Side, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'contact@proshine.com',
            phone: '+1 (555) 234-5678',
          },
          {
            id: '3',
            name: 'Auto Detail Express',
            rating: 4.7,
            distance: '1.3 mi',
            address: '321 5th Avenue, Chelsea, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'service@autodetail.com',
            phone: '+1 (555) 345-6789',
          },
          {
            id: '4',
            name: 'Platinum Car Wash Center',
            rating: 4.5,
            distance: '1.7 mi',
            address: '654 Lexington Ave, Gramercy, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'info@platinumwash.com',
            phone: '+1 (555) 456-7890',
          },
        ];
        setServiceCenters(mockCenters);
      }
    } catch (err) {
      console.error('Error fetching service centers:', err);
      // Use mock data as fallback
      const mockCenters = [
        {
          id: '1',
          name: 'Elite Car Care',
          rating: 4.6,
          distance: '0.7 mi',
          address: 'Madison Ave, Midtown, New York',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
          isAvailable: true,
          email: 'info@elitecar.com',
          phone: '+1 (555) 123-4567',
        },
        {
          id: '2',
          name: 'Pro Shine Detail',
          rating: 4.9,
          distance: '0.9 mi',
          address: 'Upper East Side, New York',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
          isAvailable: true,
          email: 'contact@proshine.com',
          phone: '+1 (555) 234-5678',
        },
      ];
      setServiceCenters(mockCenters);
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = serviceCenters.filter(center => {
    if (!searchText.trim()) return true;
    
    const searchLower = searchText.toLowerCase().trim();
    const nameMatch = center.name?.toLowerCase().includes(searchLower) || false;
    const addressMatch = center.address?.toLowerCase().includes(searchLower) || false;
    const emailMatch = center.email?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = center.phone?.toLowerCase().includes(searchLower) || false;
    
    return nameMatch || addressMatch || emailMatch || phoneMatch;
  });

  const centersCount = filteredCenters.length;

  // Remove this line since we're not using popularLocations anymore
  // const filteredLocations = popularLocations.filter(location =>
  //   location.name.toLowerCase().includes(searchText.toLowerCase())
  // );


  const renderCarWashCenter = (center: CarWashCenter) => (
    <TouchableOpacity
      key={center.id}
      style={styles.centerCard}
      onPress={() => onCenterSelect(center)}
    >
      <View style={styles.centerLocationIcon}>
        <Text style={styles.centerLocationIconText}>📍</Text>
      </View>
      <View style={styles.centerInfo}>
        <Text style={styles.centerName}>{center.name || 'Service Center'}</Text>
        <Text style={styles.centerAddress}>{center.address || 'Address not available'}</Text>
      </View>
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["top","bottom"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: Math.max(12, Math.min(insets.bottom || 0, 20)) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          <View style={styles.headerContent}>
            <Text style={styles.title}>Schedule for Later</Text>
            <Text style={styles.subtitle}>Choose location and center first</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Where do you want the car wash?"
              placeholderTextColor="#999999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

            {/* Car Wash Centers */}
            <View style={styles.centersContainer}>
              <Text style={styles.sectionTitle}>
                {searchText.length > 0 
                  ? `Service Centers matching "${searchText}" (${centersCount})` 
                  : `Available Service Centers (${centersCount})`
                }
              </Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#000000" />
                  <Text style={styles.loadingText}>Loading service centers...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchServiceCenters}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredCenters.length > 0 ? (
                <View style={styles.centersList}>
                  {filteredCenters.map(renderCarWashCenter)}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    {searchText.length > 0 
                      ? `No service centers found for "${searchText}"` 
                      : 'No service centers available'
                    }
                  </Text>
                  <Text style={styles.noResultsSubtext}>
                    {searchText.length > 0 
                      ? 'Try searching with different keywords or check spelling' 
                      : 'Please try again later'
                    }
                  </Text>
                </View>
              )}
              
              {/* Schedule Ahead Info removed as requested */}
            </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#666666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
  },
  locationsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
  },
  locationsList: {
    gap: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationIconText: {
    fontSize: 18,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'System',
  },
  centersCount: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
  },
  centersContainer: {
    paddingHorizontal: 20,
  },
  locationSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
  },
  centersList: {
    backgroundColor: '#FFFFFF',
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  centerLocationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  centerLocationIconText: {
    fontSize: 16,
    color: '#000000',
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'System',
  },
  centerAddress: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  scheduleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  scheduleTextContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
      scheduleDescription: {
        fontSize: 14,
        color: '#666666',
        fontFamily: 'System',
      },
      loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      loadingText: {
        fontSize: 16,
        color: '#666666',
        marginTop: 12,
        fontFamily: 'System',
      },
      errorContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      errorText: {
        fontSize: 16,
        color: '#FF6B6B',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: 'System',
      },
      retryButton: {
        backgroundColor: '#000000',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
      },
      retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'System',
      },
      noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      noResultsText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
        fontFamily: 'System',
      },
      noResultsSubtext: {
        fontSize: 14,
        color: '#999999',
        fontFamily: 'System',
      },
    });

    export default ScheduleForLaterScreen;
