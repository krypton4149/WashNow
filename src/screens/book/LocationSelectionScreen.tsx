import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import BackButton from '../../components/ui/BackButton';

interface LocationSelectionScreenProps {
  onBack: () => void;
  onLocationSelect: (location: any) => void;
}

interface Location {
  id: string;
  name: string;
  centersCount: number;
}

const LocationSelectionScreen: React.FC<LocationSelectionScreenProps> = ({
  onBack,
  onLocationSelect,
}) => {
  const [searchText, setSearchText] = useState('');

  const popularLocations: Location[] = [
    {
      id: '1',
      name: 'Downtown, New York',
      centersCount: 2,
    },
    {
      id: '2',
      name: 'Midtown, New York',
      centersCount: 2,
    },
    {
      id: '3',
      name: 'Upper East Side, New York',
      centersCount: 1,
    },
    {
      id: '4',
      name: 'Brooklyn, New York',
      centersCount: 0,
    },
    {
      id: '5',
      name: 'Queens, New York',
      centersCount: 0,
    },
  ];

  const filteredLocations = popularLocations.filter(location =>
    location.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
  };

  const renderLocationItem = (location: Location) => (
    <TouchableOpacity
      key={location.id}
      style={styles.locationItem}
      onPress={() => handleLocationSelect(location)}
    >
      <View style={styles.locationIcon}>
        <Text style={styles.locationIconText}>📍</Text>
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{location.name}</Text>
        <Text style={styles.centersCount}>
          {location.centersCount} car wash center{location.centersCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Schedule for Later</Text>
            <Text style={styles.subtitle}>Choose location and center first</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Where do you want the car wash?"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Popular Locations */}
        <View style={styles.locationsContainer}>
          <Text style={styles.sectionTitle}>Popular locations</Text>
          <View style={styles.locationsList}>
            {filteredLocations.map(renderLocationItem)}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#6B7280',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  locationsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  locationsList: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  centersCount: {
    fontSize: 14,
    color: '#666666',
  },
});

export default LocationSelectionScreen;

