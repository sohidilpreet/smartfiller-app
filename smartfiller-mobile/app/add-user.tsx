import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { jwtDecode } from 'jwt-decode';

const BASE_URL = 'http://10.122.66.89';

interface DecodedToken {
  id: string;
  company_id: string;
  role: string;
}

const AddUserScreen: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role
  const [isLoading, setIsLoading] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const getCompanyId = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token);
          setUserCompanyId(decoded.company_id);
        } catch (error) {
          console.error("Failed to decode token:", error);
          // Handle invalid token case, e.g., redirect to login
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    };
    getCompanyId();
  }, [router]);

  const handleAddUser = async () => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    if (!name || !email || !password || !role || !userCompanyId) {
      Alert.alert("Error", "Please fill in all required fields and ensure company ID is available.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role, company_id: userCompanyId }),
      });

      if (response.ok) {
        Alert.alert("Success", "User added successfully!");
        router.back();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to add user. Please try again.");
      }
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert("Network Error", "Could not connect to the server to add user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
          title: 'Add New User'
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Add New User</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Role:</Text>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="User" value="user" />
              <Picker.Item label="Admin" value="admin" />
              <Picker.Item label="Controller" value="controller" />
              <Picker.Item label="Viewer" value="viewer" />
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddUser}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add User</Text>
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
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 15,
    paddingTop: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  pickerItem: {
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

export default AddUserScreen;
