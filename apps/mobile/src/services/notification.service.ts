import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

class NotificationService {
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return;
      }
      
      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
    }

    if (token) {
      try {
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/users/fcm-token`,
          { fcmToken: token.data },
          {
            headers: {
              Authorization: `Bearer ${await this.getAuthToken()}`,
            },
          }
        );
      } catch (error) {
        console.error('Error registering FCM token:', error);
      }
    }
  }

  async configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  private async getAuthToken(): Promise<string | null> {
    // Implementar lógica para obter o token de autenticação
    return null;
  }
}

export const notificationService = new NotificationService(); 