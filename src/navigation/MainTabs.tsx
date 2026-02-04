import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BookingHistoryScreen from '../screens/booking/BookingHistoryScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import HelpSupportScreen from '../screens/support/HelpSupportScreen';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZES } from '../utils/fonts';
import { moderateScale, iconScale } from '../utils/responsive';

type TabKey = 'home' | 'bookings' | 'activity' | 'account';

interface MainTabsProps {
  userData: any;
  onBookWash: () => void;
  onViewAllBookings: () => void;
  onOpenSettings: () => void;
  onEditProfile: () => void;
  // For full-screen navigations triggered from tab content
  navigateTo: (screen: string) => void;
  onLanguageChange?: (language: string) => void;
  onDarkModeChange?: (isDark: boolean) => void;
  onLogout?: () => void;
  onSessionExpired?: () => void;
  onChangePassword?: () => void;
  onOpenActivityDetail?: (activity: any) => void;
}

const MainTabs: React.FC<MainTabsProps> = ({
  userData,
  onBookWash,
  onViewAllBookings,
  onOpenSettings,
  onEditProfile,
  navigateTo,
  onLanguageChange,
  onDarkModeChange,
  onLogout,
  onSessionExpired,
  onChangePassword,
  onOpenActivityDetail,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [accountSub, setAccountSub] = useState<'profile' | 'settings' | 'support'>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <DashboardScreen
            onBookWash={onBookWash}
            onViewAll={() => setActiveTab('bookings')}
            onActivityPress={(activity) => onOpenActivityDetail?.(activity)}
            onNotificationPress={() => setActiveTab('activity')}
            onProfilePress={() => setActiveTab('account')}
            onLogout={onLogout}
            onSessionExpired={onSessionExpired}
            userData={userData}
          />
        );
      case 'bookings':
        return (
          <BookingHistoryScreen onBack={() => setActiveTab('home')} />
        );
      case 'activity':
        return (
          <NotificationsScreen
            onBack={() => setActiveTab('home')}
            onNotificationPress={(n) => console.log('Notification pressed:', n)}
          />
        );
      case 'account':
        if (accountSub === 'profile') {
          return (
            <ProfileScreen
              onBack={() => setActiveTab('home')}
              onEditProfile={onEditProfile}
              onBookingHistory={() => setActiveTab('bookings')}
              onHelpSupport={() => setAccountSub('support')}
              onSettings={() => setAccountSub('settings')}
              userData={userData}
            />
          );
        }
        if (accountSub === 'settings') {
          return (
            <SettingsScreen
              onBack={() => setAccountSub('profile')}
              onHelpCenter={() => setAccountSub('support')}
              onChangePassword={() => {
                // Navigate to full-screen change password
                if (onChangePassword) {
                  onChangePassword();
                } else {
                  navigateTo('change-password');
                }
              }}
              onLanguageChange={onLanguageChange}
              onDarkModeChange={onDarkModeChange}
              onLogout={onLogout}
            />
          );
        }
        return (
          <HelpSupportScreen
            onBack={() => setAccountSub('profile')}
            onContactSupport={() => console.log('Contact support')}
          />
        );
      default:
        return null;
    }
  };

  const TabButton = ({ keyId, icon, label }: { keyId: TabKey; icon: string; label: string }) => {
    const isActive = activeTab === keyId;
    const iconName = isActive ? (icon.replace('-outline', '') as any) : (icon as any);
    const color = isActive ? '#0358a8' : colors.textSecondary;
    return (
      <TouchableOpacity style={styles.tab} onPress={() => setActiveTab(keyId)}>
        <Ionicons name={iconName} size={iconScale(24)} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const bottomPadding = Math.max(12, Math.min((insets.bottom || 0) + 8, 28));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingBottom: 80 }]}>{renderContent()}</View>
      <View style={[styles.tabBarContainer, { backgroundColor: colors.background, paddingBottom: 0 }]}>
        <View style={[styles.tabBar, { paddingBottom: bottomPadding, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TabButton keyId="home" icon="home-outline" label="Home" />
          <TabButton keyId="bookings" icon="calendar-outline" label="Bookings" />
          <TabButton keyId="activity" icon="notifications-outline" label="Activity" />
          <TabButton keyId="account" icon="person-outline" label="Account" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(16),
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: FONT_SIZES.LABEL, marginTop: moderateScale(4), fontWeight: '600' },
});

export default MainTabs;


