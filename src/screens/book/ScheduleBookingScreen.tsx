import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

interface ScheduleBookingScreenProps {
  onBack: () => void;
  onContinue: (bookingData: any) => void;
  selectedCenter: {
    id: string;
    name: string;
    rating: number;
    distance: string;
    address: string;
    image: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSelected: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: string;
  isSelected: boolean;
}

const ScheduleBookingScreen: React.FC<ScheduleBookingScreenProps> = ({
  onBack,
  onContinue,
  selectedCenter,
}) => {
  const [selectedService, setSelectedService] = useState<string>('car-wash');
  const [selectedDate, setSelectedDate] = useState<string>('22');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('toyota-camry');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  const services: Service[] = [
    {
      id: 'car-wash',
      name: 'Car Wash',
      description: 'Standard wash service',
      icon: '🚗✨',
      isSelected: true,
    },
  ];

  const timeSlots: TimeSlot[] = [
    { id: '08:00', time: '08:00 AM', isAvailable: true },
    { id: '09:00', time: '09:00 AM', isAvailable: true },
    { id: '10:00', time: '10:00 AM', isAvailable: true },
    { id: '11:00', time: '11:00 AM', isAvailable: true },
    { id: '12:00', time: '12:00 PM', isAvailable: true },
    { id: '13:00', time: '01:00 PM', isAvailable: true },
    { id: '14:00', time: '02:00 PM', isAvailable: true },
    { id: '15:00', time: '03:00 PM', isAvailable: true },
    { id: '16:00', time: '04:00 PM', isAvailable: true },
    { id: '17:00', time: '05:00 PM', isAvailable: true },
    { id: '18:00', time: '06:00 PM', isAvailable: true },
    { id: '19:00', time: '07:00 PM', isAvailable: true },
  ];

  const vehicles: Vehicle[] = [
    {
      id: 'toyota-camry',
      name: 'Toyota Camry',
      plateNumber: 'ABC 1234',
      type: 'Sedan',
      isSelected: true,
    },
    {
      id: 'honda-crv',
      name: 'Honda CR-V',
      plateNumber: 'XYZ 5678',
      type: 'SUV',
      isSelected: false,
    },
  ];

  const generateCalendarDays = () => {
    const days = [];
    
    // Get first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ day: '', isCurrentMonth: false, isSelected: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        day: day.toString(),
        isCurrentMonth: true,
        isSelected: day.toString() === selectedDate,
      });
    }
    
    return days;
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleDateSelect = (day: string) => {
    if (day && day !== '') {
      setSelectedDate(day);
    }
  };

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const renderServiceItem = (service: Service) => (
    <TouchableOpacity
      key={service.id}
      style={[
        styles.serviceCard,
        selectedService === service.id && styles.serviceCardSelected,
      ]}
      onPress={() => handleServiceSelect(service.id)}
    >
      <View style={styles.serviceIcon}>
        <Text style={styles.serviceIconText}>{service.icon}</Text>
      </View>
      <View style={styles.serviceInfo}>
        <Text style={[
          styles.serviceName,
          selectedService === service.id && styles.serviceNameSelected,
        ]}>
          {service.name}
        </Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
      </View>
      {selectedService === service.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCalendarDay = (dayData: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.calendarDay,
        dayData.isSelected && styles.calendarDaySelected,
        !dayData.isCurrentMonth && styles.calendarDayInactive,
      ]}
      onPress={() => handleDateSelect(dayData.day)}
      disabled={!dayData.isCurrentMonth}
    >
      <Text style={[
        styles.calendarDayText,
        dayData.isSelected && styles.calendarDayTextSelected,
        !dayData.isCurrentMonth && styles.calendarDayTextInactive,
      ]}>
        {dayData.day}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeSlot = (timeSlot: TimeSlot) => (
    <TouchableOpacity
      key={timeSlot.id}
      style={[
        styles.timeSlotButton,
        selectedTime === timeSlot.id && styles.timeSlotButtonSelected,
      ]}
      onPress={() => handleTimeSelect(timeSlot.id)}
      disabled={!timeSlot.isAvailable}
    >
      <Text style={[
        styles.timeSlotText,
        selectedTime === timeSlot.id && styles.timeSlotTextSelected,
      ]}>
        {timeSlot.time}
      </Text>
    </TouchableOpacity>
  );

  const renderVehicle = (vehicle: Vehicle) => (
    <TouchableOpacity
      key={vehicle.id}
      style={[
        styles.vehicleCard,
        selectedVehicle === vehicle.id && styles.vehicleCardSelected,
      ]}
      onPress={() => handleVehicleSelect(vehicle.id)}
    >
      <View style={[
        styles.vehicleIcon,
        selectedVehicle === vehicle.id && styles.vehicleIconSelected,
      ]}>
        <Text style={[
          styles.vehicleIconText,
          selectedVehicle === vehicle.id && styles.vehicleIconTextSelected,
        ]}>🚗</Text>
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={[
          styles.vehicleName,
          selectedVehicle === vehicle.id && styles.vehicleNameSelected,
        ]}>
          {vehicle.name}
        </Text>
        <Text style={styles.vehicleDetails}>
          {vehicle.plateNumber} • {vehicle.type}
        </Text>
      </View>
      {selectedVehicle === vehicle.id && (
        <View style={styles.vehicleCheckmark}>
          <Text style={styles.vehicleCheckmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Schedule Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Service Center */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Center</Text>
          <View style={styles.centerCard}>
            <Image source={{ uri: selectedCenter.image }} style={styles.centerImage} />
            <View style={styles.centerInfo}>
              <Text style={styles.centerName}>{selectedCenter.name}</Text>
              <View style={styles.centerRatingContainer}>
                <Text style={styles.centerRating}>⭐ {selectedCenter.rating}</Text>
                <Text style={styles.centerDistance}>• {selectedCenter.distance}</Text>
              </View>
              <View style={styles.centerAddressContainer}>
                <Text style={styles.centerAddressIcon}>📍</Text>
                <Text style={styles.centerAddress}>{selectedCenter.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>
          <View style={[styles.serviceCard, styles.serviceCardSelected]}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>🚗✨</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceName, styles.serviceNameSelected]}>
                Car Wash
              </Text>
              <Text style={styles.serviceDescription}>Standard wash service</Text>
            </View>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.calendarNavButton} onPress={handlePreviousMonth}>
                <Text style={styles.calendarNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>{getMonthName(currentMonth)} {currentYear}</Text>
              <TouchableOpacity style={styles.calendarNavButton} onPress={handleNextMonth}>
                <Text style={styles.calendarNavText}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarDaysHeader}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <Text key={day} style={styles.calendarDayHeaderText}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map(renderCalendarDay)}
            </View>
            
            {/* Selected Date Display */}
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateLabel}>Selected Date</Text>
              <Text style={styles.selectedDateText}>
                {new Date(currentYear, currentMonth, parseInt(selectedDate)).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <View style={styles.timeHeader}>
            <Text style={styles.timeIcon}>🕐</Text>
            <Text style={styles.sectionTitle}>Select Time</Text>
          </View>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map(renderTimeSlot)}
          </View>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle</Text>
          <View style={styles.vehiclesList}>
            {vehicles.map(renderVehicle)}
          </View>
        </View>

        {/* Schedule Ahead Info */}
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleIcon}>📅</Text>
          <View style={styles.scheduleTextContainer}>
            <Text style={styles.scheduleTitle}>Schedule Ahead</Text>
            <Text style={styles.scheduleDescription}>
              Your booking will be confirmed once you complete payment.
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={() => {
            const bookingInfo = {
              center: selectedCenter,
              service: 'Car Wash',
              date: new Date(currentYear, currentMonth, parseInt(selectedDate)).toISOString(),
              time: timeSlots.find(slot => slot.id === selectedTime)?.time || '',
              vehicle: vehicles.find(v => v.id === selectedVehicle) || vehicles[0],
            };
            onContinue(bookingInfo);
          }}
        >
          <Text style={styles.continueButtonText}>Continue to Confirmation</Text>
        </TouchableOpacity>
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
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
  centerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  centerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  centerRating: {
    fontSize: 14,
    color: '#F59E0B',
  },
  centerDistance: {
    fontSize: 14,
    color: '#666666',
  },
  centerAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerAddressIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  centerAddress: {
    fontSize: 14,
    color: '#666666',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceCardSelected: {
    borderColor: '#000000',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIconText: {
    fontSize: 20,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  serviceNameSelected: {
    color: '#000000',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666666',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  calendarCard: {
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarNavText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#000000',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextInactive: {
    color: '#9CA3AF',
  },
  selectedDateContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotButtonSelected: {
    backgroundColor: '#000000',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  vehiclesList: {
    gap: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehicleCardSelected: {
    borderColor: '#000000',
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleIconSelected: {
    backgroundColor: '#000000',
  },
  vehicleIconText: {
    fontSize: 20,
    color: '#000000',
  },
  vehicleIconTextSelected: {
    color: '#FFFFFF',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  vehicleNameSelected: {
    color: '#000000',
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666666',
  },
  vehicleCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCheckmarkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
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
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666666',
  },
  continueButton: {
    backgroundColor: '#374151',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ScheduleBookingScreen;
