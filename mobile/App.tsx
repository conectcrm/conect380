import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Fênix CRM</Text>
      <Text style={styles.subtitle}>Mobile App</Text>
      <Text style={styles.description}>
        O aplicativo mobile será desenvolvido aqui com React Native e Expo
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 24,
  },
});
