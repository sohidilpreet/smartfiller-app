import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMe } from '../api/auth';
import axios from 'axios';

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const navigation = useNavigation();
  const token = 'your_jwt_token_here'; // Replace this dynamically later

  useEffect(() => {
    getMe(token).then(res => {
      setUser(res.data);
      return axios.get('http://localhost:5050/api/machines', {
        headers: { Authorization: `Bearer ${token}` }
      });
    })
    .then(res => setMachines(res.data.machines || []))
    .catch(console.error);
  }, []);

  return (
    <ScrollView style={styles.container}>
      {user && (
        <View>
          <Text style={styles.title}>Welcome, {user.name}</Text>
          <Text style={styles.subtitle}>Company: {user.company_name}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Your Machines</Text>
      {machines.map(machine => (
        <TouchableOpacity key={machine.id} onPress={() => navigation.navigate('MachineDetail', { id: machine.id })}>
          <View style={styles.card}>
            <Text style={styles.machineName}>{machine.name}</Text>
            <Text style={styles.machineInfo}>{machine.description} ({machine.location})</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 20, marginTop: 20 },
  card: {
    backgroundColor: '#f0f4f7',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10
  },
  machineName: { fontSize: 18, fontWeight: 'bold' },
  machineInfo: { color: '#666' }
});
