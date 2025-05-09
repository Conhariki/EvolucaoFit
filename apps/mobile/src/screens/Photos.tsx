import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

interface Photo {
  _id: string;
  url: string;
  thumbnailUrl: string;
  angle: string;
  createdAt: string;
}

const PHOTO_ANGLES = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'side', label: 'Side' }
];

const Photos = () => {
  const [selectedAngle, setSelectedAngle] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useQuery<Photo[]>(
    'photos',
    async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/photos/my-photos`
      );
      return response.data;
    }
  );

  const mutation = useMutation(
    async (data: { url: string; thumbnailUrl: string; angle: string }) => {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/photos`,
        data
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('photos');
        Alert.alert('Success', 'Photo uploaded successfully');
        setSelectedAngle('');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to upload photo');
      }
    }
  );

  const pickImage = async () => {
    if (!selectedAngle) {
      Alert.alert('Error', 'Please select a photo angle first');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Sorry, we need camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    if (!result.canceled) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `photos/${filename}`);
      const thumbnailRef = ref(storage, `thumbnails/${filename}`);

      await uploadBytes(storageRef, blob);
      await uploadBytes(thumbnailRef, blob);

      const url = await getDownloadURL(storageRef);
      const thumbnailUrl = await getDownloadURL(thumbnailRef);

      mutation.mutate({
        url,
        thumbnailUrl,
        angle: selectedAngle
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Photos</Text>
        <Text style={styles.subtitle}>Track your visual progress</Text>
      </View>

      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload New Photo</Text>
        <View style={styles.angleSelector}>
          {PHOTO_ANGLES.map((angle) => (
            <TouchableOpacity
              key={angle.value}
              style={[
                styles.angleButton,
                selectedAngle === angle.value && styles.selectedAngle
              ]}
              onPress={() => setSelectedAngle(angle.value)}
            >
              <Text
                style={[
                  styles.angleButtonText,
                  selectedAngle === angle.value && styles.selectedAngleText
                ]}
              >
                {angle.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Select Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>Recent Photos</Text>
        <View style={styles.photosGrid}>
          {photos?.map((photo) => (
            <View key={photo._id} style={styles.photoCard}>
              <Image
                source={{ uri: photo.thumbnailUrl }}
                style={styles.photo}
              />
              <View style={styles.photoInfo}>
                <Text style={styles.photoAngle}>
                  {PHOTO_ANGLES.find((a) => a.value === photo.angle)?.label}
                </Text>
                <Text style={styles.photoDate}>
                  {new Date(photo.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8
  },
  uploadSection: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  angleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  angleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center'
  },
  selectedAngle: {
    backgroundColor: '#4A90E2'
  },
  angleButtonText: {
    color: '#4A90E2',
    fontWeight: '600'
  },
  selectedAngleText: {
    color: '#fff'
  },
  uploadButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  photosSection: {
    padding: 20
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  photoCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden'
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4
  },
  photoInfo: {
    padding: 12
  },
  photoAngle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  photoDate: {
    fontSize: 14,
    color: '#666'
  }
});

export default Photos; 