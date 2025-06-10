import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BASE_URL = 'http://10.122.66.89';

const AddMachineScreen: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Idle'); // Default status
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMachine = async () => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    if (!name || !description || !location) {
      Alert.alert("Error", "Please fill in all required fields (Name, Description, Location).");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/machines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, status, location }),
      });

      if (response.ok) {
        Alert.alert("Success", "Machine added successfully!");
        router.back(); // Go back to dashboard or machine list
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to add machine. Please try again.");
      }
    } catch (error) {
      console.error('Error adding machine:', error);
      Alert.alert("Network Error", "Could not connect to the server to add machine.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
          title: 'Add New Machine'
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Add New Machine</Text>

          <TextInput
            style={styles.input}
            placeholder="Machine Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Ladner, BC)"
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
          />
          {/* You might use a Picker for status selection */}
          <TextInput
            style={styles.input}
            placeholder="Status (e.g., Running, Idle, Offline)"
            placeholderTextColor="#999"
            value={status}
            onChangeText={setStatus}
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddMachine}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Machine</Text>
            )}
          </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddMachineScreen;
