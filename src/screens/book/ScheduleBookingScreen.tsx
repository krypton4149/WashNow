import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

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
  const { colors } = useTheme();
  const [selectedService, setSelectedService] = useState<string>('car-wash');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
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
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const isPast = dayDate.getTime() < startOfToday.getTime();
      
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
        dayData.isSelected && [styles.calendarDaySelected, { backgroundColor: BLUE_COLOR }],
        !dayData.isCurrentMonth && styles.calendarDayInactive,
        dayData.isPast && styles.calendarDayPast,
      ]}
      onPress={() => handleDateSelect(dayData.day, dayData.isPast)}
      disabled={!dayData.isCurrentMonth || dayData.isPast}
    >
      <Text style={[
        styles.calendarDayText,
        { color: colors.text },
        dayData.isSelected && [styles.calendarDayTextSelected, { color: '#FFFFFF' }],
        !dayData.isCurrentMonth && [styles.calendarDayTextInactive, { color: colors.textSecondary }],
        dayData.isPast && [styles.calendarDayTextPast, { color: colors.textSecondary }],
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
        { backgroundColor: colors.surface, borderColor: BLUE_COLOR + '30' },
        selectedTime === timeSlot.id && [styles.timeSlotButtonSelected, { backgroundColor: BLUE_COLOR, borderColor: BLUE_COLOR }],
      ]}
      onPress={() => handleTimeSelect(timeSlot.id)}
      disabled={!timeSlot.isAvailable}
    >
      <Text style={[
        styles.timeSlotText,
        { color: colors.text },
        selectedTime === timeSlot.id && [styles.timeSlotTextSelected, { color: '#FFFFFF' }],
      ]}>
        {timeSlot.time}
      </Text>
    </TouchableOpacity>
  );


  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: Math.max(16, Math.min(insets.bottom || 0, 24)) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: BLUE_COLOR + '30' }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={onBack}>
            <Ionicons name="close" size={20} color={BLUE_COLOR} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Schedule Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Service Center */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Center</Text>
          <View style={[styles.centerCard, { backgroundColor: colors.card, borderColor: BLUE_COLOR + '30', borderWidth: 1 }]}>
            <Image source={{ uri: selectedCenter.image }} style={styles.centerImage} />
            <View style={styles.centerInfo}>
              <Text style={[styles.centerName, { color: colors.text }]}>{selectedCenter.name}</Text>
              <View style={styles.centerAddressContainer}>
                <Ionicons name="location" size={16} color={BLUE_COLOR} style={styles.centerAddressIcon} />
                <Text style={[styles.centerAddress, { color: colors.textSecondary }]}>{selectedCenter.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <View style={styles.dateHeader}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar-outline" size={20} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Date</Text>
          </View>
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: BLUE_COLOR + '30', borderWidth: 1 }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={[styles.calendarNavButton, { backgroundColor: BLUE_COLOR + '15' }]} onPress={handlePreviousMonth}>
                <Ionicons name="chevron-back" size={18} color={BLUE_COLOR} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonth, { color: colors.text }]}>{getMonthName(currentMonth)} {currentYear}</Text>
              <TouchableOpacity style={[styles.calendarNavButton, { backgroundColor: BLUE_COLOR + '15' }]} onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={18} color={BLUE_COLOR} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarDaysHeader}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <Text key={day} style={[styles.calendarDayHeaderText, { color: colors.textSecondary }]}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {generateCalendarDays().map(renderCalendarDay)}
            </View>
            
            {/* Selected Date Display */}
            <View style={[styles.selectedDateContainer, { borderTopColor: BLUE_COLOR + '30' }]}>
              <Text style={[styles.selectedDateLabel, { color: colors.textSecondary }]}>Selected Date</Text>
              <Text style={[styles.selectedDateText, { color: colors.text }]}>
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
            <View style={styles.timeIconContainer}>
              <Ionicons name="time-outline" size={20} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Time</Text>
          </View>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map(renderTimeSlot)}
          </View>
        </View>

        {/* Vehicle Number and Notes removed as requested */}

        {/* Book Now Button */}
        <TouchableOpacity 
          style={[styles.continueButton, { backgroundColor: BLUE_COLOR }]} 
          onPress={handleBooking}
        >
          <Text style={[styles.continueButtonText, { color: '#FFFFFF' }]}>Book Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: BLUE_COLOR,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: FONTS.INTER_BOLD,
  },
  centerAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  centerAddressIcon: {
    marginRight: 6,
  },
  centerAddress: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    flex: 1,
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
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BLUE_COLOR + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: BLUE_COLOR,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarNavText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarMonth: {
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  calendarDayHeaderText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '600',
    width: '14.28%', // Match calendar day width for alignment
    textAlign: 'center',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 = 14.28% for exactly 7 items per row
    aspectRatio: 1,
    minHeight: 36,
    maxHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarDaySelected: {
    borderRadius: 22,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
  },
  calendarDayTextSelected: {
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayTextPast: {},
  calendarDayTextInactive: {},
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
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    marginBottom: 4,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  selectedDateText: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BLUE_COLOR + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  timeSlotButtonSelected: {
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  timeSlotTextSelected: {
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
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
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
});

export default ScheduleBookingScreen;
