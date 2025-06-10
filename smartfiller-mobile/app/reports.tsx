import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

const ReportsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Reports' }} />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Reports & Analytics</Text>
          <Text style={styles.subtitle}>This section will contain various reports and data visualizations.</Text>
          <Text style={styles.placeholderText}>
            • Machine Performance Reports
          </Text>
          <Text style={styles.placeholderText}>
            • User Activity Logs
          </Text>
          <Text style={styles.placeholderText}>
            • Production Efficiency Metrics
          </Text>
          <Text style={styles.placeholderText}>
            • Maintenance Schedules
          </Text>
          <Text style={styles.noDataText}>
            Report generation functionality will be added here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
    textAlign: 'left',
    paddingLeft: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
});

export default ReportsScreen;
