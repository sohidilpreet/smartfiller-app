import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import { LineChart } from 'react-native-chart-kit';

const BASE_URL = 'http://10.122.66.89:5050';

interface MachineRun {
  id: string;
  run_time: string;
  description: string;
  operator_name?: string;
  user_name?: string;
}

interface MachineFile {
  id: string;
  filename: string;
  originalname: string;
  uploaded_by_name: string;
  uploaded_at: string;
  file_url?: string;
}

interface MachineStatsSummary {
  total_runs: number;
  last_run: string;
  top_operator: string;
}

interface MachineStatsHistory {
  date: string;
  total_runs: number;
}

interface MachineDetails {
  id: string;
  name: string;
  description: string;
  status: 'Running' | 'Idle' | 'Offline' | 'Error';
  location: string;
  created_by_name: string;
  last_maintenance?: string;
  uptime_percentage?: number;
  serial_number?: string;
  installation_date?: string;
  firmware_version?: string;
  runs: MachineRun[];
  files: MachineFile[];
  stats?: {
    summary: MachineStatsSummary;
    history: MachineStatsHistory[];
  };
}

const MachineDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const machineId = id as string;

  const [machine, setMachine] = useState<MachineDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runForm, setRunForm] = useState({ description: '', operatorName: '' });
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchMachineDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    try {
      const userProfileResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userProfileResponse.ok) {
        const userProfileData = await userProfileResponse.json();
        setCurrentUserRole(userProfileData.role);
      } else {
        console.warn('Failed to fetch user role:', userProfileResponse.status);
      }

      const [machineRes, statsRes, filesRes, runsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/machines/${machineId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${BASE_URL}/api/machines/${machineId}/stats/runs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${BASE_URL}/api/machines/${machineId}/files`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${BASE_URL}/api/machines/${machineId}/runs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (!machineRes.ok) throw new Error(`Machine fetch failed: ${machineRes.status}`);

      const machineData = await machineRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : { summary: {}, history: [] };
      const filesData = filesRes.ok ? await filesRes.json() : { files: [] };
      const runsData = runsRes.ok ? await runsRes.json() : { runs: [] };

      setMachine({
        ...machineData,
        stats: statsData,
        files: filesData.files || [],
        runs: runsData.runs || [],
      });

    } catch (err: any) {
      console.error('Error fetching machine details:', err);
      setError(err.message || "Failed to load machine details.");
      if (err.message.includes("401") || err.message.includes("404")) {
        await AsyncStorage.removeItem('token');
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [machineId, router]);

  useEffect(() => {
    if (machineId) {
      fetchMachineDetails();
    } else {
      Alert.alert("Error", "Machine ID not provided.");
      router.back();
    }
  }, [machineId, fetchMachineDetails]);

  const handleRunSubmit = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return router.replace('/login');

    if (!runForm.description) {
      Alert.alert("Error", "Run description is required.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/machines/${machineId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(runForm),
      });
      if (response.ok) {
        Alert.alert("Success", "Machine run logged successfully!");
        fetchMachineDetails();
        setRunForm({ description: '', operatorName: '' });
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to log machine run.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  const updateStatus = async (newStatus: MachineDetails['status']) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return router.replace('/login');

    try {
      const response = await fetch(`${BASE_URL}/api/machines/${machineId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        Alert.alert("Success", `Machine status updated to ${newStatus}.`);
        fetchMachineDetails();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to update status.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  const handleDeleteFile = async (fileId: string, originalname: string) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${originalname}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) return router.replace('/login');

            try {
              const response = await fetch(`${BASE_URL}/api/machines/${machineId}/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) {
                Alert.alert("Success", "File deleted.");
                fetchMachineDetails();
              } else {
                const errorData = await response.json();
                Alert.alert("Error", errorData.message || "Failed to delete file.");
              }
            } catch (err) {
              Alert.alert("Network Error", "Could not connect to the server.");
            }
          }
        }
      ]
    );
  };

  const handleFileUpload = async () => {
    // In a real React Native app, you'd use a library like `expo-document-picker`
    // or `react-native-image-picker` to select a file from the device.
    Alert.alert(
      "File Upload",
      "File upload functionality requires a native module (e.g., expo-document-picker) to select a file from the device. This is a placeholder.",
      [{ text: "OK" }]
    );
  };

  const handleOpenFile = (filename: string) => {
    const fileUrl = `${BASE_URL}/uploads/${filename}`;
    Linking.openURL(fileUrl).catch(err => Alert.alert("Error", `Could not open file: ${err.message}`));
  };

  if (isLoading) {
    return (
      <View style={detailsStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={detailsStyles.loadingText}>Loading machine details...</Text>
      </View>
    );
  }

  if (error || !machine) {
    return (
      <View style={detailsStyles.loadingContainer}>
        <Text style={detailsStyles.errorText}>Error: {error || "Machine not found."}</Text>
        <TouchableOpacity style={detailsStyles.backButton} onPress={() => router.back()}>
          <Text style={detailsStyles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={detailsStyles.container}>
      <Stack.Screen options={{
          title: machine.name || 'Machine Details'
        }}
      />
      <ScrollView contentContainerStyle={detailsStyles.scrollViewContent}>
        <View style={detailsStyles.card}>
          <Text style={detailsStyles.machineName}>{machine.name}</Text>
          <Text style={detailsStyles.machineDescription}>{machine.description}</Text>

          <View style={detailsStyles.detailRow}>
            <Icon name="location-on" size={20} color="#666" />
            <Text style={detailsStyles.detailText}>Location: {machine.location}</Text>
          </View>
          <View style={detailsStyles.detailRow}>
            <Icon name="person" size={20} color="#666" />
            <Text style={detailsStyles.detailText}>Created By: {machine.created_by_name}</Text>
          </View>
          <View style={detailsStyles.detailRow}>
            <Icon name="settings" size={20} color="#666" />
            <Text style={detailsStyles.detailText}>Status:
              <Text style={[detailsStyles.statusText, { color: machine.status === 'Running' ? '#4caf50' : machine.status === 'Idle' ? '#ff9800' : '#f44336' }]}>
                {` ${machine.status}`}
              </Text>
            </Text>
          </View>

          <View style={detailsStyles.actionsContainer}>
            <TouchableOpacity onPress={() => updateStatus('Running')} style={[detailsStyles.statusButton, { backgroundColor: '#4caf50' }]}>
              <Icon name="play-arrow" size={20} color="#fff" />
              <Text style={detailsStyles.statusButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateStatus('Idle')} style={[detailsStyles.statusButton, { backgroundColor: '#ff9800' }]}>
              <Icon name="pause" size={20} color="#fff" />
              <Text style={detailsStyles.statusButtonText}>Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateStatus('Error')} style={[detailsStyles.statusButton, { backgroundColor: '#f44336' }]}>
              <Icon name="warning" size={20} color="#fff" />
              <Text style={detailsStyles.statusButtonText}>Error</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={detailsStyles.card}>
          <Text style={detailsStyles.sectionTitle}>Run Activity (Last 30 Days)</Text>
          {machine.stats?.history?.length > 0 ? (
            <View>
              <View style={detailsStyles.chartPlaceholder}>
                {/* <Text style={detailsStyles.chartPlaceholderText}>
                  Chart visualization goes here (e.g., using react-native-chart-kit or similar)
                </Text> */}
                <LineChart
                  data={{
                    labels: machine.stats.history.map(item => item.date),
                    datasets: [{
                        data: machine.stats.history
                          .map(item => Number(item.total_runs))
                          .map(val => isNaN(val) ? 0 : val)
                      }]
                  }}
                  width={detailsStyles.chartPlaceholder.width || 300}
                  height={detailsStyles.chartPlaceholder.height || 200}
                  chartConfig={{
                    backgroundColor: '#e26a00',
                    backgroundGradientFrom: '#fb8c00',
                    backgroundGradientTo: '#ffa726',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#ffa726'
                    }
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </View>

              <Text style={detailsStyles.statSummaryText}>Total Runs: {machine.stats.summary?.total_runs || 0}</Text>
              <Text style={detailsStyles.statSummaryText}>Last Run: {machine.stats.summary?.last_run ? new Date(machine.stats.summary.last_run).toLocaleString() : 'N/A'}</Text>
              <Text style={detailsStyles.statSummaryText}>Top Operator: {machine.stats.summary?.top_operator || 'N/A'}</Text>
            </View>
          ) : <Text style={detailsStyles.noDataText}>No activity in the last 30 days.</Text>}
        </View>

        <View style={detailsStyles.card}>
          <Text style={detailsStyles.sectionTitle}>Log a Machine Run</Text>
          <TextInput
            style={detailsStyles.input}
            placeholder="What was done..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={runForm.description}
            onChangeText={(text) => setRunForm(prev => ({ ...prev, description: text }))}
          />
          <TextInput
            style={detailsStyles.input}
            placeholder="Operator name (optional)"
            placeholderTextColor="#999"
            value={runForm.operatorName}
            onChangeText={(text) => setRunForm(prev => ({ ...prev, operatorName: text }))}
          />
          <TouchableOpacity style={detailsStyles.submitButton} onPress={handleRunSubmit}>
            <Text style={detailsStyles.submitButtonText}>Submit Run</Text>
          </TouchableOpacity>
        </View>

        <View style={detailsStyles.card}>
          <Text style={detailsStyles.sectionTitle}>Uploaded Files</Text>
          {machine.files?.length > 0 ? (
            <View>
              {machine.files.map(file => (
                <View key={file.id} style={detailsStyles.fileItem}>
                  <Icon name="insert-drive-file" size={20} color="#667eea" />
                  <TouchableOpacity onPress={() => handleOpenFile(file.filename)} style={detailsStyles.fileNameContainer}>
                    <Text style={detailsStyles.fileName} numberOfLines={1}>
                      {file.originalname}
                    </Text>
                    <Text style={detailsStyles.fileMeta}> by {file.uploaded_by_name} at {new Date(file.uploaded_at).toLocaleString()}</Text>
                  </TouchableOpacity>
                  {(currentUserRole === 'admin' || currentUserRole === 'controller') && (
                    <TouchableOpacity onPress={() => handleDeleteFile(file.id, file.originalname)} style={detailsStyles.deleteFileButton}>
                      <Icon name="delete" size={20} color="#f44336" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : <Text style={detailsStyles.noDataText}>No files uploaded.</Text>}

          {(currentUserRole === 'admin' || currentUserRole === 'controller') && (
            <View>
              <Text style={[detailsStyles.sectionTitle, { marginTop: 20 }]}>Upload File</Text>
              <TouchableOpacity style={detailsStyles.uploadButton} onPress={handleFileUpload}>
                <Icon name="cloud-upload" size={24} color="#fff" />
                <Text style={detailsStyles.uploadButtonText}>Select & Upload File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {currentUserRole === 'admin' && (
          <View style={detailsStyles.card}>
            <Text style={detailsStyles.sectionTitle}>Assign Users to Machine</Text>
            <Text style={detailsStyles.noDataText}>Assign User Form goes here.</Text>
            {/* Here you would integrate your AssignUserForm component */}
            {/* Example: <AssignUserForm machineId={machineId} /> */}
          </View>
        )}

        <View style={detailsStyles.card}>
          <Text style={detailsStyles.sectionTitle}>Run History</Text>
          {machine.runs?.length === 0 ? (
            <Text style={detailsStyles.noDataText}>No runs logged yet.</Text>
          ) : (
            <View>
              {machine.runs.map(run => (
                <View key={run.id} style={detailsStyles.runItem}>
                  <Text style={detailsStyles.runTime}>{new Date(run.run_time).toLocaleString()}</Text>
                  <Text style={detailsStyles.runDescription}>{run.description}</Text>
                  <Text style={detailsStyles.runOperator}>by {run.user_name || run.operator_name || 'N/A'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const detailsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 600,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  machineName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  machineDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  statusText: {
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  statusButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#667eea',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 15,
  },
  chartPlaceholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  statSummaryText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
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
  submitButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  fileNameContainer: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 10,
  },
  fileName: {
    fontSize: 16,
    color: '#333',
  },
  fileMeta: {
    fontSize: 12,
    color: '#777',
  },
  deleteFileButton: {
    padding: 5,
  },
  uploadButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  runItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  runTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  runDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  runOperator: {
    fontSize: 12,
    color: '#777',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    paddingVertical: 20,
  },
});

export default MachineDetailScreen;
