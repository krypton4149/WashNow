import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
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

interface Location {
  id: string;
  name: string;
  centersCount: number;
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
  const [searchText, setSearchText] = useState(selectedLocation.name);
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
      
      if (result.success && result.serviceCenters) {
        // Transform API data to match our interface
        const transformedCenters = result.serviceCenters.map((center: any) => ({
          id: center.id.toString(),
          name: center.name,
          rating: 4.5, // Default rating since API doesn't provide it
          distance: '0.5 mi', // Default distance
          address: center.address,
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop', // Default image
          isAvailable: center.status === 'Active',
          email: center.email,
          phone: center.phone,
          weekoff_days: center.weekoff_days,
          clat: center.clat,
          clong: center.clong,
        }));
        
        setServiceCenters(transformedCenters);
      } else {
        setError(result.error || 'Failed to fetch service centers');
      }
    } catch (err) {
      console.error('Error fetching service centers:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = serviceCenters.filter(center => {
    if (!searchText.trim()) return true;
    
    const searchLower = searchText.toLowerCase().trim();
    const nameMatch = center.name.toLowerCase().includes(searchLower);
    const addressMatch = center.address.toLowerCase().includes(searchLower);
    const emailMatch = center.email?.toLowerCase().includes(searchLower);
    const phoneMatch = center.phone?.toLowerCase().includes(searchLower);
    
    console.log(`Searching for "${searchText}" in center:`, {
      name: center.name,
      address: center.address,
      nameMatch,
      addressMatch,
      emailMatch,
      phoneMatch
    });
    
    return nameMatch || addressMatch || emailMatch || phoneMatch;
  });

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
      <View style={styles.centerImageContainer}>
        <Image source={{ uri: center.image }} style={styles.centerImage} />
      </View>
      <View style={styles.centerInfo}>
        <Text style={styles.centerName}>{center.name}</Text>
        <View style={styles.centerRatingContainer}>
          <Text style={styles.centerRating}>⭐ {center.rating}</Text>
          <Text style={styles.centerDistance}>• {center.distance}</Text>
        </View>
        <Text style={styles.centerAddress}>{center.address}</Text>
        {center.phone && (
          <Text style={styles.centerPhone}>📞 {center.phone}</Text>
        )}
        {center.email && (
          <Text style={styles.centerEmail}>✉️ {center.email}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.availableButton}>
        <Text style={styles.availableButtonText}>Available</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  ? `Service Centers matching "${searchText}"` 
                  : 'Available Service Centers'
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
              
              {/* Schedule Ahead Info */}
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleIcon}>🕐</Text>
                <View style={styles.scheduleTextContainer}>
                  <Text style={styles.scheduleTitle}>Schedule Ahead</Text>
                  <Text style={styles.scheduleDescription}>
                    After selecting a center, you'll choose your preferred date and time.
                  </Text>
                </View>
              </View>
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
    gap: 16,
    marginBottom: 24,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  centerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  centerInfo: {
    flex: 1,
    marginRight: 12,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  centerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  centerRating: {
    fontSize: 14,
    color: '#F59E0B',
    fontFamily: 'System',
  },
  centerDistance: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
  },
      centerAddress: {
        fontSize: 14,
        color: '#666666',
        fontFamily: 'System',
      },
      centerPhone: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
        fontFamily: 'System',
      },
      centerEmail: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
        fontFamily: 'System',
      },
  availableButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  availableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
