import React from 'react';
import { StyleSheet, ViewProps, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GlobalSafeAreaProps extends ViewProps {
  backgroundColor?: string;
}

const GlobalSafeArea: React.FC<GlobalSafeAreaProps> = ({ children, style, backgroundColor }) => {
  const edges = Platform.OS === 'ios' ? ['top', 'bottom'] : ['bottom'];
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: backgroundColor || '#FFFFFF' }, style]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GlobalSafeArea;


