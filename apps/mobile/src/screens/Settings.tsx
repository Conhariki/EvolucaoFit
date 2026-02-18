import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationSettings {
  measurements: boolean;
  photos: boolean;
  reminders: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>({
    measurements: true,
    photos: true,
    reminders: true
  });

  const { data: notificationSettings } = useQuery<NotificationSettings>(
    'notificationSettings',
    async () => {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/users/notification-settings`
      );
      return response.data;
    }
  );

  useEffect(() => {
    if (notificationSettings) {
      setSettings(notificationSettings);
    }
  }, [notificationSettings]);

  const updateSettingsMutation = useMutation(
    async (newSettings: NotificationSettings) => {
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_API_URL}/users/notification-settings`,
        newSettings
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationSettings');
        Alert.alert('Success', 'Notification settings updated');
      },
      onError: () => {
        Alert.alert('Error', 'Failed to update notification settings');
      }
    }
  );

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.'
        );
        return false;
      }
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
      return false;
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };

    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="analytics-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Measurement Updates</Text>
          </View>
          <Switch
            value={settings.measurements}
            onValueChange={() => handleToggle('measurements')}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="images-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Photo Updates</Text>
          </View>
          <Switch
            value={settings.photos}
            onValueChange={() => handleToggle('photos')}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Reminders</Text>
          </View>
          <Switch
            value={settings.reminders}
            onValueChange={() => handleToggle('reminders')}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed-outline" size={24} color="#333" />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  section: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16
  },
  version: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20
  }
});

export default Settings; 