import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
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


const ScheduleBookingScreen: React.FC<ScheduleBookingScreenProps> = ({
  onBack,
  onContinue,
  selectedCenter,
}) => {
  const [selectedService, setSelectedService] = useState<string>('car-wash');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // Initialize with today's date
  React.useEffect(() => {
    const today = new Date().getDate();
    setSelectedDate(today.toString());
  }, []);

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


  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentDate = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < currentDate.getDay(); i++) {
      days.push({ day: '', isCurrentMonth: false, isSelected: false, isPast: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const isPast = dayDate < today.setHours(0, 0, 0, 0);
      
      days.push({
        day: day.toString(),
        isCurrentMonth: true,
        isSelected: day.toString() === selectedDate,
        isPast: isPast,
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

  const handleDateSelect = (day: string, isPast: boolean) => {
    if (day && day !== '' && !isPast) {
      setSelectedDate(day);
    }
  };

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
  };

  const validateBooking = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time');
      return false;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert('Error', 'Please enter vehicle number');
      return false;
    }
    return true;
  };

  const handleBooking = () => {
    if (!validateBooking()) {
      return;
    }

    // Format time as HH:MM AM/PM
    const selectedTimeSlot = timeSlots.find(slot => slot.id === selectedTime);
    const formattedTime = selectedTimeSlot?.time || '';

    // Pass booking data to parent component for payment screen
    const bookingInfo = {
      center: selectedCenter,
      service: 'Car Wash',
      date: new Date(currentYear, currentMonth, parseInt(selectedDate)).toISOString(),
      time: formattedTime,
      vehicleNumber: vehicleNumber.trim(),
      notes: notes.trim(),
    };
    
    onContinue(bookingInfo);
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
        dayData.isPast && styles.calendarDayPast,
      ]}
      onPress={() => handleDateSelect(dayData.day, dayData.isPast)}
      disabled={!dayData.isCurrentMonth || dayData.isPast}
    >
      <Text style={[
        styles.calendarDayText,
        dayData.isSelected && styles.calendarDayTextSelected,
        !dayData.isCurrentMonth && styles.calendarDayTextInactive,
        dayData.isPast && styles.calendarDayTextPast,
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

        {/* Vehicle Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Number</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter vehicle number (e.g., ABC 1234)"
              placeholderTextColor="#9CA3AF"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Any special instructions or notes..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
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

        {/* Book Now Button */}
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleBooking}
        >
          <Text style={styles.continueButtonText}>Book Now</Text>
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
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayTextPast: {
    color: '#9CA3AF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    paddingVertical: 8,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
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
