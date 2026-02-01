import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZES, TEXT_STYLES } from '../utils/fonts';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    button: string;
    buttonText: string;
    error: string;
    success: string;
    warning: string;
  };
  /** Global Inter typography (responsive). Use for Screen Title, Section Heading, Card Title, Body, Button, etc. */
  typography: typeof TEXT_STYLES;
  fontSizes: typeof FONT_SIZES;
}

const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#1F2937',
  secondary: '#6B7280',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  card: '#FFFFFF',
  button: '#2563EB',
  buttonText: '#FFFFFF',
  error: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
};

const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  primary: '#F1F5F9',
  secondary: '#94A3B8',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  card: '#1E293B',
  button: '#F1F5F9',
  buttonText: '#0F172A',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@WashNow:darkMode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'true');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    colors,
    typography: TEXT_STYLES,
    fontSizes: FONT_SIZES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
