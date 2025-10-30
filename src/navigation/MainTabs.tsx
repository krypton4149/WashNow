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
  onChangePassword,
  onOpenActivityDetail,
}) => {
  const insets = useSafeAreaInsets();
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
              onChangePassword={onChangePassword}
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
    const color = isActive ? '#000000' : '#9CA3AF';
    return (
      <TouchableOpacity style={styles.tab} onPress={() => setActiveTab(keyId)}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>{renderContent()}</View>
      <View style={[styles.tabBar, { paddingBottom: Math.max(8, insets.bottom || 0) }]}>
        <TabButton keyId="home" icon="home-outline" label="Home" />
        <TabButton keyId="bookings" icon="calendar-outline" label="Bookings" />
        <TabButton keyId="activity" icon="notifications-outline" label="Activity" />
        <TabButton keyId="account" icon="person-outline" label="Account" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, fontWeight: '600' },
});

export default MainTabs;


