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
    weekoff_days?: string[] | null;
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

  // Helper function to get day name from date
  const getDayName = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Helper function to check if a date falls on a weekoff day
  const isWeekoffDay = (date: Date): boolean => {
    if (!selectedCenter?.weekoff_days || !Array.isArray(selectedCenter.weekoff_days) || selectedCenter.weekoff_days.length === 0) {
      return false;
    }
    const dayName = getDayName(date);
    return selectedCenter.weekoff_days.includes(dayName);
  };

  // Initialize with today's date (or next available date if today is a weekoff day)
  React.useEffect(() => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Check if today is a weekoff day
    if (isWeekoffDay(today)) {
      // Find the next available date (not a weekoff day and not in the past)
      let nextDate = new Date(todayYear, todayMonth, todayDate);
      let daysToAdd = 1;
      let attempts = 0;
      
      while (attempts < 30) { // Limit to 30 days ahead
        nextDate = new Date(todayYear, todayMonth, todayDate + daysToAdd);
        if (!isWeekoffDay(nextDate) && nextDate >= today) {
          setSelectedDate(nextDate.getDate().toString());
          setCurrentMonth(nextDate.getMonth());
          setCurrentYear(nextDate.getFullYear());
          return;
        }
        daysToAdd++;
        attempts++;
      }
      // If no available date found, just use today
      setSelectedDate(todayDate.toString());
    } else {
      setSelectedDate(todayDate.toString());
    }
  }, [selectedCenter]);

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
    { id: '08:00', time: '8:00 AM', isAvailable: true },
    { id: '09:00', time: '9:00 AM', isAvailable: true },
    { id: '10:00', time: '10:00 AM', isAvailable: true },
    { id: '11:00', time: '11:00 AM', isAvailable: true },
    { id: '12:00', time: '12:00 PM', isAvailable: true },
    { id: '13:00', time: '1:00 PM', isAvailable: true },
    { id: '14:00', time: '2:00 PM', isAvailable: true },
    { id: '15:00', time: '3:00 PM', isAvailable: true },
    { id: '16:00', time: '4:00 PM', isAvailable: true },
    { id: '17:00', time: '5:00 PM', isAvailable: true },
    { id: '18:00', time: '6:00 PM', isAvailable: true },
    { id: '19:00', time: '7:00 PM', isAvailable: true },
  ];

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentDate = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < currentDate.getDay(); i++) {
      days.push({ day: '', isCurrentMonth: false, isSelected: false, isPast: false, isWeekoff: false });
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const isPast = dayDate.getTime() < startOfToday.getTime();
      const isWeekoff = isWeekoffDay(dayDate);
      
      days.push({
        day: day.toString(),
        isCurrentMonth: true,
        isSelected: day.toString() === selectedDate,
        isPast: isPast,
        isWeekoff: isWeekoff,
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

  const handleDateSelect = (day: string, isPast: boolean, isWeekoff: boolean) => {
    if (day && day !== '' && !isPast && !isWeekoff) {
      setSelectedDate(day);
    } else if (isWeekoff) {
      Alert.alert(
        'Service Center Closed',
        'This service center is closed on this day. Please select another date.',
        [{ text: 'OK' }]
      );
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
    
    // Check if selected date is a weekoff day
    const selectedDateObj = new Date(currentYear, currentMonth, parseInt(selectedDate));
    if (isWeekoffDay(selectedDateObj)) {
      Alert.alert(
        'Service Center Closed',
        'This service center is closed on the selected date. Please select another date.',
        [{ text: 'OK' }]
      );
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

  const renderCalendarDay = (dayData: any, index: number) => {
    const isDisabled = !dayData.isCurrentMonth || dayData.isPast || dayData.isWeekoff;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          dayData.isSelected && [styles.calendarDaySelected, { backgroundColor: BLUE_COLOR }],
          !dayData.isCurrentMonth && styles.calendarDayInactive,
          dayData.isPast && styles.calendarDayPast,
          dayData.isWeekoff && styles.calendarDayWeekoff,
        ]}
        onPress={() => handleDateSelect(dayData.day, dayData.isPast, dayData.isWeekoff)}
        disabled={isDisabled}
      >
        <Text style={[
          styles.calendarDayText,
          { color: colors.text },
          dayData.isSelected && [styles.calendarDayTextSelected, { color: '#FFFFFF' }],
          !dayData.isCurrentMonth && [styles.calendarDayTextInactive, { color: colors.textSecondary }],
          dayData.isPast && [styles.calendarDayTextPast, { color: colors.textSecondary }],
          dayData.isWeekoff && [styles.calendarDayTextWeekoff, { color: colors.textSecondary }],
        ]}>
          {dayData.day}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (timeSlot: TimeSlot) => (
    <TouchableOpacity
      key={timeSlot.id}
      style={[
        styles.timeSlotButton,
        { 
          backgroundColor: selectedTime === timeSlot.id ? BLUE_COLOR : colors.surface,
          borderColor: selectedTime === timeSlot.id ? BLUE_COLOR : colors.border,
        },
        selectedTime === timeSlot.id && styles.timeSlotButtonSelected,
      ]}
      onPress={() => handleTimeSelect(timeSlot.id)}
      disabled={!timeSlot.isAvailable}
    >
      {selectedTime === timeSlot.id && (
        <Ionicons 
          name="checkmark-circle" 
          size={Platform.select({ ios: 18, android: 16 })} 
          color="#FFFFFF" 
          style={styles.checkIcon}
        />
      )}
      <Text style={[
        styles.timeSlotText,
        { color: selectedTime === timeSlot.id ? '#FFFFFF' : colors.text },
        selectedTime === timeSlot.id && styles.timeSlotTextSelected,
      ]}>
        {timeSlot.time}
      </Text>
    </TouchableOpacity>
  );


  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Schedule Booking</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Service Center Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.serviceCenterRow}>
            <View style={[styles.serviceIconWrapper, { backgroundColor: BLUE_COLOR + '10' }]}>
              <Image source={{ uri: selectedCenter.image }} style={styles.serviceIconImage} />
            </View>
            <View style={styles.serviceCenterInfo}>
              <Text style={[styles.serviceCenterName, { color: colors.text }]}>{selectedCenter.name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={Platform.select({ ios: 14, android: 12 })} color={BLUE_COLOR} />
                <Text style={[styles.serviceCenterAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                  {selectedCenter.address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Select Date</Text>
          </View>
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              style={[styles.calendarNavButton, { backgroundColor: colors.surface }]} 
              onPress={handlePreviousMonth}
            >
              <Ionicons name="chevron-back" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} />
            </TouchableOpacity>
            <Text style={[styles.calendarMonth, { color: colors.text }]}>
              {getMonthName(currentMonth)} {currentYear}
            </Text>
            <TouchableOpacity 
              style={[styles.calendarNavButton, { backgroundColor: colors.surface }]} 
              onPress={handleNextMonth}
            >
              <Ionicons name="chevron-forward" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarDaysHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={`day-${index}`} style={[styles.calendarDayHeaderText, { color: colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map(renderCalendarDay)}
          </View>
        </View>

        {/* Time Slots Card - Redesigned */}
        <View style={[styles.timeCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="time-outline" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Select Time</Text>
          </View>
          <View style={styles.timeSlotsContainer}>
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map(renderTimeSlot)}
            </View>
          </View>
        </View>

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
  backButton: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 16, android: 12 }),
    paddingBottom: Platform.select({ ios: 24, android: 20 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 10, android: 8 }),
    paddingBottom: Platform.select({ ios: 10, android: 8 }),
    borderBottomWidth: 1,
  },
  infoCard: {
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    marginBottom: Platform.select({ ios: 16, android: 12 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarCard: {
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    marginBottom: Platform.select({ ios: 16, android: 12 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeCard: {
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    marginBottom: Platform.select({ ios: 16, android: 12 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 10, android: 8 }),
    marginBottom: Platform.select({ ios: 16, android: 14 }),
  },
  iconContainer: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 10, android: 8 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  serviceCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrapper: {
    width: Platform.select({ ios: 56, android: 50 }),
    height: Platform.select({ ios: 56, android: 50 }),
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    marginRight: Platform.select({ ios: 12, android: 10 }),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceCenterInfo: {
    flex: 1,
  },
  serviceCenterName: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 6, android: 4 }),
    fontFamily: FONTS.INTER_MEDIUM,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({ ios: 6, android: 4 }),
  },
  serviceCenterAddress: {
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Platform.select({ ios: 16, android: 14 }),
  },
  calendarNavButton: {
    width: Platform.select({ ios: 32, android: 28 }),
    height: Platform.select({ ios: 32, android: 28 }),
    borderRadius: Platform.select({ ios: 8, android: 6 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonth: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Platform.select({ ios: 10, android: 8 }),
    width: '100%',
  },
  calendarDayHeaderText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    width: '14.28%',
    textAlign: 'center',
    fontFamily: FONTS.INTER_REGULAR,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    minHeight: Platform.select({ ios: 36, android: 32 }),
    maxHeight: Platform.select({ ios: 44, android: 38 }),
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarDaySelected: {
    borderRadius: Platform.select({ ios: 22, android: 18 }),
  },
  calendarDayInactive: {
    opacity: 0.2,
  },
  calendarDayText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  calendarDayTextSelected: {
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  calendarDayPast: {
    opacity: 0.25,
  },
  calendarDayTextPast: {},
  calendarDayTextInactive: {},
  calendarDayWeekoff: {
    opacity: 0.4,
  },
  calendarDayTextWeekoff: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  timeSlotsContainer: {
    width: '100%',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.select({ ios: 10, android: 8 }),
    justifyContent: 'space-between',
  },
  timeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Platform.select({ ios: 12, android: 10 }),
    paddingVertical: Platform.select({ ios: 8, android: 7 }),
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    width: Platform.select({ ios: '31%', android: '31%' }),
    minHeight: Platform.select({ ios: 40, android: 38 }),
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeSlotButtonSelected: {
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  checkIcon: {
    marginRight: Platform.select({ ios: 6, android: 4 }),
  },
  timeSlotText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  timeSlotTextSelected: {
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  continueButton: {
    marginHorizontal: Platform.select({ ios: 16, android: 14 }),
    marginTop: Platform.select({ ios: 24, android: 20 }),
    marginBottom: Platform.select({ ios: 24, android: 16 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    borderRadius: Platform.select({ ios: 30, android: 28 }),
    alignItems: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: Platform.select({ ios: FONT_SIZES.BUTTON_MEDIUM, android: FONT_SIZES.BUTTON_SMALL }),
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
});

export default ScheduleBookingScreen;
