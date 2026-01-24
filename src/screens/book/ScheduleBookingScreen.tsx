import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';
import authService from '../../services/authService';
import { STORAGE_BASE_URL } from '../../config/env';

const BLUE_COLOR = '#0358a8';
const PLACEHOLDER_IMAGE = require('../../assets/images/Centre.png');

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
  id: string | number;
  name: string;
  time?: string; // For backward compatibility
  start_time?: string;
  end_time?: string;
  available?: number;
  isAvailable?: boolean; // For backward compatibility
}


const ScheduleBookingScreen: React.FC<ScheduleBookingScreenProps> = ({
  onBack,
  onContinue,
  selectedCenter,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { colors } = useTheme();
  const [selectedService, setSelectedService] = useState<string>('car-wash');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<boolean>(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);

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

  // Generate all time slots from 9 AM to 7 PM (30-minute intervals)
  const generateAllTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let hour = 9; // Start at 9 AM
    const endHour = 19; // End at 7 PM (19:00)
    
    while (hour < endHour) {
      const minutes = [0, 30]; // 30-minute intervals
      
      for (const minute of minutes) {
        const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        const nextMinute = minute === 0 ? 30 : 0;
        const nextHour = minute === 30 ? hour + 1 : hour;
        const endTime24 = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}:00`;
        
        // Format for display (12-hour format)
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const displayMinute = minute === 0 ? '00' : '30';
        const displayNextHour = nextHour === 0 ? 12 : nextHour > 12 ? nextHour - 12 : nextHour;
        const nextAmpm = nextHour < 12 ? 'AM' : 'PM';
        const nextDisplayMinute = nextMinute === 0 ? '00' : '30';
        
        const name = `${displayHour}:${displayMinute}${ampm}-${displayNextHour}:${nextDisplayMinute}${nextAmpm}`;
        
        slots.push({
          id: time24,
          name: name,
          start_time: time24,
          end_time: endTime24,
          available: 0,
          isAvailable: false,
        });
      }
      
      hour++;
    }
    
    return slots;
  };

  // Fetch time slots when date is selected
  const fetchTimeSlots = async (date: string) => {
    if (!date || !selectedCenter?.id) {
      setTimeSlots([]);
      return;
    }

    try {
      setLoadingTimeSlots(true);
      setTimeSlotsError(null);
      setSelectedTimeSlotId(null);
      setSelectedTime('');

      // Format date as YYYY-MM-DD
      const dateObj = new Date(currentYear, currentMonth, parseInt(date));
      const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      const centreId = selectedCenter.id || selectedCenter.service_centre_id;
      const result = await authService.getTimeSlotsForCentre(centreId, formattedDate);

      // Generate all time slots from 9 AM to 7 PM
      const allSlots = generateAllTimeSlots();

      if (result.success && result.timeSlots) {
        // Create a map of available slots from API
        const availableSlotsMap = new Map();
        result.timeSlots.forEach((slot: any) => {
          // Match by start_time
          availableSlotsMap.set(slot.start_time, {
            id: slot.id,
            name: slot.name,
            start_time: slot.start_time,
            end_time: slot.end_time,
            available: slot.available,
            isAvailable: (slot.available || 0) > 0,
          });
        });

        // Update all slots with availability from API
        const updatedSlots = allSlots.map((slot) => {
          const apiSlot = availableSlotsMap.get(slot.start_time);
          if (apiSlot) {
            return {
              ...slot,
              id: apiSlot.id, // Use API ID for booking
              name: apiSlot.name, // Use API name format
              available: apiSlot.available,
              isAvailable: apiSlot.isAvailable,
            };
          }
          return slot; // Keep as unavailable if not in API response
        });

        setTimeSlots(updatedSlots);

        // If there's a pre-selected time slot from API, select it
        if (result.selectedTimeSlot) {
          const preSelected = updatedSlots.find(slot => slot.id === result.selectedTimeSlot);
          if (preSelected && preSelected.isAvailable) {
            setSelectedTimeSlotId(preSelected.id);
            setSelectedTime(preSelected.name);
          }
        }
      } else {
        // Even if API fails, show all slots as unavailable
        setTimeSlots(allSlots);
        // Show better error message
        if (result.error && result.error.includes('timeout')) {
          setTimeSlotsError('Connection timeout. Please check your internet and try again.');
        } else {
          setTimeSlotsError(result.error || 'No time slots available for this date');
        }
      }
    } catch (error: any) {
      // Show all slots as unavailable on error
      const allSlots = generateAllTimeSlots();
      setTimeSlots(allSlots);
      // Show better error message based on error type
      if (error.message && error.message.includes('timeout')) {
        setTimeSlotsError('Connection timeout. Please check your internet and try again.');
      } else if (error.message && error.message.includes('Network')) {
        setTimeSlotsError('Network error. Please check your internet connection.');
      } else {
        setTimeSlotsError('Failed to load time slots. Please try again.');
      }
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, currentMonth, currentYear]);

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
      // Time slots will be fetched automatically via useEffect
    } else if (isWeekoff) {
      Alert.alert(
        'Service Center Closed',
        'This service center is closed on this day. Please select another date.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (timeSlot.isAvailable && (timeSlot.available || 0) > 0) {
      setSelectedTimeSlotId(timeSlot.id);
      setSelectedTime(timeSlot.name);
    } else {
      Alert.alert(
        'Slot Unavailable',
        'This time slot is not available. Please select another time.',
        [{ text: 'OK' }]
      );
    }
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
    
    if (!selectedTimeSlotId || !selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return false;
    }
    return true;
  };

  const getImageUrl = (imagePath: string | null | undefined, updatedAt?: string | null): string => {
    if (imagePath) {
      // If image path is already a full URL, return it with cache busting
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        const separator = imagePath.includes('?') ? '&' : '?';
        const cacheBuster = updatedAt ? `t=${new Date(updatedAt).getTime()}` : `t=${Date.now()}`;
        return `${imagePath}${separator}${cacheBuster}`;
      }
      
      // Remove leading slash if present
      let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      
      // API returns paths like "service_types/01KEBNEJX30YRC1T1QE0K58JGX.jpg"
      // Server serves images from: "https://carwashapp.shoppypie.in/public/storage/service_types/01KEBNEJX30YRC1T1QE0K58JGX.jpg"
      const imageUrl = `${STORAGE_BASE_URL}/${cleanPath}`;
      
      // Add cache busting query parameter using updated_at timestamp or current time
      // This ensures images are reloaded when updated on the server
      const separator = imageUrl.includes('?') ? '&' : '?';
      const cacheBuster = updatedAt ? `t=${new Date(updatedAt).getTime()}` : `t=${Date.now()}`;
      return `${imageUrl}${separator}${cacheBuster}`;
    }
    
    // Placeholder image for service centers
    return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop';
  };

  const handleBooking = () => {
    if (!validateBooking()) {
      return;
    }

    // Get selected time slot details
    const selectedTimeSlot = timeSlots.find(slot => slot.id === selectedTimeSlotId);
    
    // Format date as YYYY-MM-DD
    const dateObj = new Date(currentYear, currentMonth, parseInt(selectedDate));
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // Pass booking data to parent component for payment screen
    const bookingInfo = {
      center: {
        ...selectedCenter,
        selectedService: selectedCenter?.selectedService, // Preserve selected service
      },
      service: selectedCenter?.selectedService?.name || 'Car Wash',
      date: dateObj.toISOString(),
      formattedDate: formattedDate, // YYYY-MM-DD format for API
      time: selectedTimeSlot?.name || selectedTime, // Use name from API (e.g., "06:30PM-07:00PM")
      timeSlotId: selectedTimeSlotId,
      start_time: selectedTimeSlot?.start_time,
      end_time: selectedTimeSlot?.end_time,
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

  // Format time for display on two lines
  const formatTimeForDisplay = (timeString: string): { startTime: string; endTime: string } => {
    if (!timeString) return { startTime: 'N/A', endTime: '' };
    
    // Handle format like "06:00PM-06:30PM" or "06:00PM-07:00PM"
    if (timeString.includes('-')) {
      const parts = timeString.split('-');
      if (parts.length === 2) {
        return {
          startTime: parts[0] + '-',
          endTime: parts[1],
        };
      }
    }
    
    // If we have start_time and end_time, format them
    // This is a fallback if name doesn't have the format we expect
    return { startTime: timeString, endTime: '' };
  };

  // Pill-style time slot matching preview design
  const renderTimeSlot = (timeSlot: TimeSlot, index: number) => {
    const isSelected = selectedTimeSlotId === timeSlot.id;
    const isAvailable = timeSlot.isAvailable && (timeSlot.available || 0) > 0;
    const displayTime = timeSlot.name || timeSlot.time || 'N/A';
    const { startTime, endTime } = formatTimeForDisplay(displayTime);

    return (
      <TouchableOpacity
        key={`${timeSlot.id || timeSlot.start_time}-${index}`}
        style={[
          styles.timeSlotButton,
          isSelected && isAvailable ? styles.timeSlotButtonSelectedAvailable : 
          isAvailable ? styles.timeSlotButtonAvailable : 
          styles.timeSlotButtonUnavailable,
        ]}
        onPress={() => handleTimeSelect(timeSlot)}
        activeOpacity={0.8}
        disabled={!isAvailable}
      >
        <View style={styles.timeSlotTextContainer}>
          <Text
            style={[
              styles.timeSlotText,
              isSelected && isAvailable ? styles.timeSlotTextSelectedAvailable :
              isAvailable ? styles.timeSlotTextAvailable :
              styles.timeSlotTextUnavailable,
            ]}
          >
            {startTime}
          </Text>
          {endTime ? (
            <Text
              style={[
                styles.timeSlotText,
                isSelected && isAvailable ? styles.timeSlotTextSelectedAvailable :
                isAvailable ? styles.timeSlotTextAvailable :
                styles.timeSlotTextUnavailable,
              ]}
            >
              {endTime}
            </Text>
          ) : null}
        </View>
        {isSelected && isAvailable && (
          <View style={styles.timeSlotCheckmark}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
        {isAvailable && !isSelected && (
          <View style={styles.timeSlotRadio}>
            <View style={styles.timeSlotRadioOuter} />
          </View>
        )}
        {!isAvailable && (
          <View style={styles.timeSlotX}>
            <Ionicons name="close" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };


  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Book an Appointment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + Math.max(insets.bottom || 0, 20) } // Add padding for fixed button
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Service Center Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.serviceCenterRow}>
            <View style={[styles.serviceIconWrapper, { backgroundColor: BLUE_COLOR + '10' }]}>
              <Image 
                source={imageError ? PLACEHOLDER_IMAGE : { uri: getImageUrl(selectedCenter.image, selectedCenter.updated_at), cache: 'reload' }} 
                defaultSource={PLACEHOLDER_IMAGE}
                style={styles.serviceIconImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            </View>
            <View style={styles.serviceCenterInfo}>
              <Text style={[styles.serviceCenterName, { color: BLUE_COLOR, fontWeight: '700', fontFamily: FONTS.MONTserrat_BOLD }]}>{selectedCenter.name}</Text>
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

        {/* Time Slots Card - Matching Preview Design */}
        <View style={[styles.timeCard, { backgroundColor: colors.card }]}>
          <View style={styles.timeCardHeader}>
            <View style={styles.timeCardHeaderLeft}>
              <View style={[styles.iconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
                <Ionicons name="time-outline" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} />
              </View>
              <Text style={styles.cardTitle}>Available Time Slot</Text>
            </View>
          </View>
          
          {/* Legend removed - only showing available slots */}

          <View style={styles.timeSlotsContainer}>
            {loadingTimeSlots ? (
              <View style={styles.timeSlotsLoadingContainer}>
                <ActivityIndicator size="small" color={BLUE_COLOR} />
                <Text style={[styles.timeSlotsLoadingText, { color: colors.textSecondary }]}>
                  Loading time slots...
                </Text>
              </View>
            ) : timeSlotsError ? (
              <View style={styles.timeSlotsErrorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.timeSlotsErrorText, { color: colors.textSecondary }]}>
                  {timeSlotsError}
                </Text>
                {selectedDate && (
                  <TouchableOpacity 
                    onPress={() => fetchTimeSlots(selectedDate)}
                    style={[styles.retryButton, { borderColor: BLUE_COLOR }]}
                  >
                    <Text style={[styles.retryButtonText, { color: BLUE_COLOR }]}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : timeSlots.filter(slot => slot.isAvailable && (slot.available || 0) > 0).length === 0 ? (
              <View style={styles.timeSlotsEmptyContainer}>
                <Ionicons name="time-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.timeSlotsEmptyText, { color: colors.textSecondary }]}>
                  {selectedDate ? 'No time slots available for this date' : 'Please select a date to view available time slots'}
                </Text>
              </View>
            ) : (
              <View style={styles.timeSlotsGrid}>
                {timeSlots
                  .filter((slot) => slot.isAvailable && (slot.available || 0) > 0)
                  .sort((a, b) => {
                    // Sort by time (start_time)
                    const aTime = a.start_time || a.time || '';
                    const bTime = b.start_time || b.time || '';
                    return aTime.localeCompare(bTime);
                  })
                  .map((slot, index) => renderTimeSlot(slot, index))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Book Now Button at Bottom */}
      <View style={[
        styles.fixedButtonContainer,
        { 
          backgroundColor: colors.background,
          paddingBottom: Math.max(insets.bottom || 0, 20),
          borderTopColor: colors.border,
        }
      ]}>
        <TouchableOpacity 
          style={[styles.continueButton, { backgroundColor: BLUE_COLOR }]} 
          onPress={handleBooking}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueButtonText, { color: '#FFFFFF' }]}>Book Now</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Header title
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16, // Reduced padding
    paddingTop: 12, // Reduced padding
    // paddingBottom will be set dynamically to account for fixed button
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  calendarCard: {
    borderRadius: 14,
    padding: 12, // Reduced from 16
    marginBottom: 12, // Reduced from 16
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 24,
  },
  timeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
    gap: 12,
  },
  timeCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  timeSlotCount: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    color: '#6B7280',
    flexShrink: 0,
    marginLeft: 8,
  },
  timeSlotLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCircleAvailable: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981', // Green
  },
  legendCircleBooked: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB', // Light gray
  },
  legendText: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.3,
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    opacity: 0.7,
  },
  serviceCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  serviceIconImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hiddenImage: {
    opacity: 0,
  },
  serviceCenterInfo: {
    flex: 1,
  },
  serviceCenterName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Platform.select({ ios: 8, android: 6 }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
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
    marginBottom: 12, // Reduced from 16
  },
  calendarNavButton: {
    width: 36, // Increased for better touch target
    height: 36,
    borderRadius: 10, // Increased for modern look
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonth: {
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Month name
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // Reduced spacing
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
    minHeight: 36, // Reduced from 40
    maxHeight: 40, // Reduced from 48
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2, // Reduced padding
  },
  calendarDaySelected: {
    borderRadius: Platform.select({ ios: 22, android: 18 }),
  },
  calendarDayInactive: {
    opacity: 0.2,
  },
  calendarDayText: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular) - Calendar day
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  calendarDayTextSelected: {
    fontWeight: '600', // Changed to semibold for consistency
    fontFamily: FONTS.INTER_SEMIBOLD,
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
    gap: 12,
    justifyContent: 'space-between',
  },
  timeSlotButton: {
    borderRadius: 12, // Rounded corners like boxes
    width: '46%', // Reduced from 47%
    minHeight: 46, // Reduced from 50
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    paddingHorizontal: 12, // Reduced from 14
    paddingVertical: 10, // Reduced from 12
  },
  timeSlotButtonSelectedAvailable: {
    backgroundColor: '#D1FAE5', // Very light mint green background
    borderColor: '#10B981', // Vibrant green border
  },
  timeSlotButtonAvailable: {
    backgroundColor: '#D1FAE5', // Very light mint green background
    borderColor: '#10B981', // Vibrant green border
  },
  timeSlotButtonUnavailable: {
    backgroundColor: '#F3F4F6', // Light grey background
    borderColor: '#D1D5DB', // Darker grey border
  },
  timeSlotTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timeSlotText: {
    fontSize: 15,
    fontFamily: FONTS.INTER_MEDIUM,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 20,
  },
  timeSlotTextSelectedAvailable: {
    color: '#10B981', // Vibrant green text
    fontWeight: '500',
  },
  timeSlotTextAvailable: {
    color: '#10B981', // Vibrant green text
    fontWeight: '500',
  },
  timeSlotTextUnavailable: {
    color: '#6B7280', // Darker grey text
    fontWeight: '400',
  },
  timeSlotCheckmark: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -9, // Half of height to center vertically
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981', // Green circle background
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotRadio: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -9, // Half of height to center vertically
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotRadioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10B981', // Vibrant green border
    backgroundColor: 'transparent',
  },
  timeSlotX: {
    position: 'absolute',
    top: '50%',
    right: 10,
    marginTop: -9, // Half of height to center vertically
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#9CA3AF', // Grey circle background
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Button text
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
  timeSlotsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  timeSlotsLoadingText: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  timeSlotsErrorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  timeSlotsErrorText: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600',
  },
  timeSlotsEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  timeSlotsEmptyText: {
    fontSize: 14,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default ScheduleBookingScreen;
