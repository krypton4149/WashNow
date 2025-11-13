import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { platformEdges } from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onBack?: () => void;
  onHelpCenter?: () => void;
  onChangePassword?: () => void;
  onLanguageChange?: (language: string) => void;
  onDarkModeChange?: (isDarkMode: boolean) => void;
  onLogout?: () => void;
}

const SettingsScreen: React.FC<Props> = ({
  onBack,
  onHelpCenter,
  onChangePassword,
  onLanguageChange,
  onDarkModeChange,
  onLogout,
}) => {
  const { isDarkMode, colors, toggleDarkMode } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [promotionalAlerts, setPromotionalAlerts] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');

  // Logout removed from Settings


  const handleDarkModeChange = (value: boolean) => {
    toggleDarkMode();
    onDarkModeChange?.(value);
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { text: 'English (US)', onPress: () => setSelectedLanguage('English (US)') },
        { text: 'Spanish', onPress: () => setSelectedLanguage('Spanish') },
        { text: 'French', onPress: () => setSelectedLanguage('French') },
        { text: 'German', onPress: () => setSelectedLanguage('German') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderSettingItem = (
    iconColor: string,
    icon: string,
    title: string,
    description?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    showDivider: boolean = true
  ) => (
    <>
      <TouchableOpacity 
        style={styles.settingItem} 
        onPress={onPress}
        disabled={!onPress && !rightComponent}
        activeOpacity={onPress || rightComponent ? 0.7 : 1}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: iconColor }]}>
            <Ionicons name={icon as any} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
            {description && <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{description}</Text>}
          </View>
        </View>
        {rightComponent || (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Banner */}
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1642520922834-2494eb4c1d73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwcGF0dGVybnxlbnwxfHx8fDE3NjI0MTAxMzN8MA&ixlib=rb-4.1.0&q=80&w=1080'
          }}
          style={styles.banner}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Customize Your Experience</Text>
            <Text style={styles.bannerSubtitle}>Manage your preferences</Text>
          </View>
        </ImageBackground>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSettingItem(
              '#3366FF',
              'notifications-outline',
              'Push Notifications',
              'Receive booking updates',
              undefined,
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.border, true: colors.primary + '33' }}
                thumbColor={pushNotifications ? colors.primary : colors.surface}
              />
            )}
            {renderSettingItem(
              '#8B5CF6',
              'notifications-outline',
              'Promotional Alerts',
              'Special offers and discounts',
              undefined,
              <Switch
                value={promotionalAlerts}
                onValueChange={setPromotionalAlerts}
                trackColor={{ false: colors.border, true: colors.primary + '33' }}
                thumbColor={promotionalAlerts ? colors.primary : colors.surface}
              />,
              false
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSettingItem(
              '#4CAF50',
              'globe-outline',
              'Language',
              selectedLanguage,
              handleLanguageChange
            )}
            {renderSettingItem(
              '#8B5CF6',
              'moon-outline',
              'Dark Mode',
              'Switch to dark theme',
              undefined,
              <Switch
                value={isDarkMode}
                onValueChange={handleDarkModeChange}
                trackColor={{ false: colors.border, true: colors.primary + '33' }}
                thumbColor={isDarkMode ? colors.primary : colors.surface}
              />,
              false
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSettingItem(
              '#DC2626',
              'lock-closed-outline',
              'Change Password',
              'Update your password',
              onChangePassword,
              undefined,
              false
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {renderSettingItem(
              '#F97316',
              'help-circle-outline',
              'Help Center',
              'FAQs and support',
              onHelpCenter,
              undefined,
              false
            )}
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  banner: {
    height: 140,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bannerContent: {
    position: 'relative',
    zIndex: 1,
    paddingHorizontal: 20,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 68,
    marginRight: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
  },
});

export default SettingsScreen;

