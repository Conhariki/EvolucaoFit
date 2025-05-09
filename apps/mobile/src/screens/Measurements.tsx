import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

interface MeasurementData {
  weight: number;
  height: number;
  chest: number;
  waist: number;
  hips: number;
  biceps: number;
  thighs: number;
}

const Measurements = () => {
  const [measurements, setMeasurements] = useState<MeasurementData>({
    weight: 0,
    height: 0,
    chest: 0,
    waist: 0,
    hips: 0,
    biceps: 0,
    thighs: 0
  });

  const queryClient = useQueryClient();

  const mutation = useMutation(
    async (data: MeasurementData) => {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/measurements`,
        data
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('measurements');
        Alert.alert('Success', 'Measurements saved successfully');
        setMeasurements({
          weight: 0,
          height: 0,
          chest: 0,
          waist: 0,
          hips: 0,
          biceps: 0,
          thighs: 0
        });
      },
      onError: () => {
        Alert.alert('Error', 'Failed to save measurements');
      }
    }
  );

  const handleSubmit = () => {
    if (Object.values(measurements).some(value => value === 0)) {
      Alert.alert('Error', 'Please fill in all measurements');
      return;
    }

    mutation.mutate(measurements);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Body Measurements</Text>
          <Text style={styles.subtitle}>Track your progress</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={measurements.weight ? measurements.weight.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, weight: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter weight"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={measurements.height ? measurements.height.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, height: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter height"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chest (cm)</Text>
            <TextInput
              style={styles.input}
              value={measurements.chest ? measurements.chest.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, chest: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter chest measurement"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Waist (cm)</Text>
            <TextInput
              style={styles.input}
              value={measurements.waist ? measurements.waist.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, waist: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter waist measurement"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hips (cm)</Text>
            <TextInput
              style={styles.input}
              value={measurements.hips ? measurements.hips.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, hips: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter hips measurement"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biceps (cm)</Text>
            <TextInput
              style={styles.input}
              value={measurements.biceps ? measurements.biceps.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, biceps: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter biceps measurement"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thighs (cm)</Text>
            <TextInput
              style={styles.input}
              value={measurements.thighs ? measurements.thighs.toString() : ''}
              onChangeText={(value) =>
                setMeasurements({ ...measurements, thighs: Number(value) })
              }
              keyboardType="numeric"
              placeholder="Enter thighs measurement"
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={mutation.isLoading}
          >
            <Ionicons name="save" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>
              {mutation.isLoading ? 'Saving...' : 'Save Measurements'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollContent: {
    padding: 20
  },
  header: {
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666'
  },
  form: {
    gap: 16
  },
  inputGroup: {
    gap: 8
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
});

export default Measurements; 