import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface Measurement {
  _id: string;
  weight: number;
  height: number;
  chest: number;
  waist: number;
  hips: number;
  biceps: number;
  thighs: number;
  createdAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: measurements, refetch } = useQuery<Measurement[]>(
    'measurements',
    async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/measurements/my-measurements`
      );
      return response.data;
    }
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const latestMeasurement = measurements?.[0];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.email}</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="scale" size={24} color="#4A90E2" />
          <Text style={styles.statValue}>
            {latestMeasurement?.weight || '-'} kg
          </Text>
          <Text style={styles.statLabel}>Weight</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="resize" size={24} color="#4A90E2" />
          <Text style={styles.statValue}>
            {latestMeasurement?.height || '-'} cm
          </Text>
          <Text style={styles.statLabel}>Height</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Measurements</Text>
        <View style={styles.measurementsList}>
          {measurements?.slice(0, 3).map((measurement) => (
            <View key={measurement._id} style={styles.measurementItem}>
              <Text style={styles.measurementDate}>
                {new Date(measurement.createdAt).toLocaleDateString()}
              </Text>
              <View style={styles.measurementDetails}>
                <Text style={styles.measurementText}>
                  Chest: {measurement.chest} cm
                </Text>
                <Text style={styles.measurementText}>
                  Waist: {measurement.waist} cm
                </Text>
                <Text style={styles.measurementText}>
                  Hips: {measurement.hips} cm
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Measurement</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  measurementsList: {
    gap: 12,
  },
  measurementItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  measurementDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  measurementDetails: {
    gap: 4,
  },
  measurementText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Dashboard; 