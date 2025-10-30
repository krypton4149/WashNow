import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };


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
    icon: string,
    title: string,
    description?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.border }]}>
          <Ionicons name={icon} size={20} color={colors.textSecondary} />
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
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderSettingItem(
              'notifications-outline',
              'Push Notifications',
              'Receive booking updates',
              undefined,
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#E5E7EB', true: '#1F2937' }}
                thumbColor={pushNotifications ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {renderSettingItem(
              'megaphone-outline',
              'Promotional Alerts',
              'Special offers and discounts',
              undefined,
              <Switch
                value={promotionalAlerts}
                onValueChange={setPromotionalAlerts}
                trackColor={{ false: '#E5E7EB', true: '#1F2937' }}
                thumbColor={promotionalAlerts ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderSettingItem(
              'globe-outline',
              'Language',
              selectedLanguage,
              handleLanguageChange
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            {renderSettingItem(
              'moon-outline',
              'Dark Mode',
              'Switch to dark theme',
              undefined,
              <Switch
                value={isDarkMode}
                onValueChange={handleDarkModeChange}
                trackColor={{ false: '#E5E7EB', true: '#1F2937' }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderSettingItem(
              'lock-closed-outline',
              'Change Password',
              'Update your password',
              onChangePassword
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderSettingItem(
              'help-circle-outline',
              'Help Center',
              'FAQs and support',
              onHelpCenter
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.error }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
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
    borderBottomWidth: 1,
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
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

